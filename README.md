# Functional and acceptance tests, done efficiently

Postboard is a tiny web app: members register, confirm their email address, sign in and
share short posts. It has two pages, the sign-in page for visitors and the timeline for
members who are signed in. The app exists only to show how to test it efficiently.

## The idea

> Test each behaviour through the user's door, but don't make every test walk through the
> whole building to get there.

The scenarios state intentions, not mechanics:

```gherkin
Scenario: A member shares a post
  Given Anna is signed in
  When she shares a post
  Then her post is on the timeline
```

Because the scenario says only *what* happens, the code underneath decides *how*, and each
step can take a different route into the app:

| Step | What it is | Route |
|------|------------|-------|
| `Given Anna is signed in` | a state to start from | API, in milliseconds |
| `When she shares a post` | the behaviour under test | the UI, as Anna would |
| `Then her post is on the timeline` | what Anna sees | the UI |

Signing in through the UI before every scenario would test sign-in again and again, slowly,
and make every scenario fail when the sign-in page breaks. Instead, sign-in has scenarios of its
own (`signing-in.feature`), and one scenario walks the whole journey through the UI
(`joining.feature`), because there the journey itself is the behaviour. Cypress and
Playwright both recommend this: set up state through the API, test the behaviour through the UI.

The same thinking decides which *tier* a rule is tested at. Whether an unconfirmed member may
sign in is a rule of the API, so the functional tests check it, in-process, in milliseconds. The
acceptance tests check only what a member sees.

Further reading: [Creating maintainable automated acceptance tests](https://www.slideshare.net/slideshow/creating-maintainable-automated-acceptance-tests/13990429).

## Test tiers

| Tier | Where | Runs | Command |
|------|-------|------|---------|
| Unit | `test/unit` | pure functions, no I/O | `npm run test:unit` |
| Functional | `test/functional` | the API in-process via Fastify's `inject()`; no network | `npm run test:functional` |
| Acceptance | `test/acceptance` | Gherkin scenarios in Chromium against the built app | `npm run test:acceptance` |
| Build | `test/build` | checks on the GitHub Actions workflows | `npm run test:build` |

`npm test` runs unit and functional tests, the ones to run on every change.

### How the acceptance tests are built

- **Features** (`features/*.feature`) state intentions only.
- **Step definitions** (`steps/`) are split by kind, and the split is the point:
  every `Given` goes through the API, every `When` through the UI, and the `Then` steps
  check what the member sees.
- **Screenplay** (`screenplay/`): an `Actor` such as Anna has two abilities, a browser and the
  API, which share one cookie jar. That is why signing in through the API signs her browser in
  too. Tasks are grouped by route: `tasks/through-the-api.ts` and `tasks/through-the-ui.ts`.
- **Page objects** (`pages/`) know the fields and buttons; tasks only say what the actor does.
- **`test/support/member-api.ts`** is one client for the API, used by both the functional
  tests (in-process transport) and the acceptance tests (HTTP through the actor's browser
  context).

The only back door is a test mailbox (`EXPOSE_TEST_MAILBOX=true`), which lets a test follow a
confirmation link the way a member would from their inbox. A functional test makes sure the
mailbox stays closed unless a test run switches it on.

Every test makes its own members with unique email addresses, so all tests run in parallel
against one server.

## Pipeline

- **Commit build** (`.github/workflows/commit-build.yml`) runs on every push and pull request:
  lint, unit and functional tests, build tests, then it builds the pages and uploads them.
- **Actions are locked** in `.github/workflows/actions.lock`, generated with GitHub's
  [`gh actions-lock`](https://github.com/github/gh-actions-lock) extension. The workflows name
  readable exact versions (`actions/checkout@v7.0.1`), and the lockfile records the verified
  commit for each, including actions they use in turn. When a job starts, the runner checks its
  actions against the lockfile and refuses anything else, so the pipeline needs no check of its
  own. After changing a `uses:`, run `make lock-actions` and commit the lockfile with the
  workflow; the pre-commit hook catches a forgotten one.
- **Acceptance tests** (`.github/workflows/acceptance-tests.yml`) start through `workflow_run`
  when a commit build on `main` succeeds. They test the commit and the pages that build produced.
  They are debounced with a `concurrency` group without `cancel-in-progress`: a run in progress
  always finishes, and of the commits that land meanwhile, only the newest is tested next.
  A `workflow_run` run belongs to the head of `main`, not to the commit it tests, so each run is
  titled after the tested commit and posts its result there as an *Acceptance tests* status.
  Commits skipped by the debounce get no status, because nothing tested them on their own.

## Getting started

Needs the [GitHub CLI](https://cli.github.com), logged in (`gh auth login`), and Node 24 (the exact version is in `.nvmrc`, which the workflows also read). With
[mise](https://mise.jdx.dev), `mise.toml` provides it.

```sh
make init          # install dependencies, gh-actions-lock and Chromium, set up git hooks
npm test           # unit + functional tests
make acceptance    # build the pages, then run the acceptance tests
make check         # everything
```

To run the app while developing, start both in separate terminals and open
http://localhost:5173:

```sh
npm run dev:server   # the API on port 3000, restarts on changes
npm run dev:web      # Vite, proxies /api to port 3000
```
