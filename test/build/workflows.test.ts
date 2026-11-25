// The acceptance workflow depends on the commit build in ways GitHub does not check: a renamed
// workflow or a dropped concurrency setting fails silently, by never running or by testing
// stale commits. These tests make such a change fail loudly instead.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { parse } from 'yaml';

const WORKFLOWS = new URL('../../.github/workflows/', import.meta.url);
// actions.lock pins the commit. An exact tag keeps that pin reviewable: the lockfile tool cannot
// tell when a floating tag such as v7 is moved back to an older commit.
const EXACT_VERSION_TAG = /^[\w.-]+\/[\w.-]+@v\d+\.\d+\.\d+$/;

type Step = {
  readonly uses?: string;
  readonly run?: string;
  readonly if?: string;
  readonly with?: Record<string, unknown>;
};
type Job = { readonly if?: string; readonly env?: Record<string, string>; readonly steps: readonly Step[] };
type Workflow = {
  readonly name: string;
  readonly 'run-name'?: string;
  readonly on: Record<string, unknown>;
  readonly permissions?: Record<string, string>;
  readonly concurrency?: { readonly group: string; readonly 'cancel-in-progress': unknown };
  readonly jobs: Record<string, Job>;
};

const TESTED_COMMIT = '${{ github.event.workflow_run.head_sha }}';

function workflow(file: string): Workflow {
  return parse(readFileSync(new URL(file, WORKFLOWS), 'utf8')) as Workflow;
}

function allSteps(definition: Workflow): readonly Step[] {
  return Object.values(definition.jobs).flatMap((job) => job.steps);
}

const commitBuild = workflow('commit-build.yml');
const acceptanceTests = workflow('acceptance-tests.yml');

describe('commit build workflow', () => {
  // GitHub keeps one waiting run per concurrency group and cancels the others, even without
  // cancel-in-progress. A group shared by all of main would skip builds of commits in between.
  test('gives every commit on main a build of its own', () => {
    assert.equal(
      commitBuild.concurrency?.group,
      "commit-build-${{ github.event_name == 'pull_request' && github.ref || github.sha }}",
    );
  });
});

describe('acceptance tests workflow', () => {
  test('starts when the commit build on main completes', () => {
    assert.deepEqual(acceptanceTests.on.workflow_run, {
      workflows: [commitBuild.name],
      types: ['completed'],
      branches: ['main'],
    });
  });

  test('runs only after a successful commit build of a push', () => {
    for (const job of Object.values(acceptanceTests.jobs)) {
      assert.equal(
        job.if,
        "github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push'",
      );
    }
  });

  test('is debounced: one group, and a run in progress is never cancelled', () => {
    assert.deepEqual(acceptanceTests.concurrency, { group: 'acceptance-tests', 'cancel-in-progress': false });
  });

  test('tests the commit the commit build tested', () => {
    const checkout = allSteps(acceptanceTests).find((step) => step.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout?.with?.ref, TESTED_COMMIT);
  });

  // A workflow_run run belongs to the head of main, not to the commit it tests, so without these
  // the list of runs names the wrong commit and the tested commit shows no acceptance result.
  test('names the commit it tests in the title of the run', () => {
    assert.ok(acceptanceTests['run-name']?.includes(TESTED_COMMIT));
  });

  test('reports on the tested commit from start to finish, whatever the outcome', () => {
    assert.equal(acceptanceTests.permissions?.statuses, 'write');
    for (const job of Object.values(acceptanceTests.jobs)) {
      const [first] = job.steps;
      const last = job.steps.at(-1);
      assert.equal(job.env?.TESTED_COMMIT, TESTED_COMMIT);
      assert.match(first?.run ?? '', /statuses\/\$TESTED_COMMIT\b.*state=pending/s);
      assert.match(last?.run ?? '', /statuses\/\$TESTED_COMMIT\b/);
      assert.equal(last?.if, 'always()');
    }
  });

  test('tests the pages the commit build built', () => {
    const uploaded = allSteps(commitBuild).find((step) => step.uses?.startsWith('actions/upload-artifact@'));
    const downloaded = allSteps(acceptanceTests).find((step) => step.uses?.startsWith('actions/download-artifact@'));
    assert.equal(downloaded?.with?.name, uploaded?.with?.name);
    assert.equal(downloaded?.with?.['run-id'], '${{ github.event.workflow_run.id }}');
  });
});

describe('every workflow', () => {
  const files = readdirSync(WORKFLOWS).filter((file) => file.endsWith('.yml'));

  for (const file of files) {
    test(`${file} names an exact version of every action`, () => {
      for (const step of allSteps(workflow(file))) {
        if (step.uses !== undefined) {
          assert.match(step.uses, EXACT_VERSION_TAG);
        }
      }
    });
  }
});
