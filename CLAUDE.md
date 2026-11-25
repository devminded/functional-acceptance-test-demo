# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

A demo of efficient functional and acceptance testing for a tiny web app, Postboard. The tests
are the point; the app exists to be tested. The rule the demo shows: **each step takes the
route that fits it.** A `Given` describes a state, so it is set up through the API. A `When` is
the behaviour under test, so it goes through the UI. Sign-in gets UI scenarios of its own; other
scenarios never sign in through the UI. See `README.md`.

## Commands

```sh
make init            # one-time: npm ci, gh-actions-lock extension, Chromium, git hooks
npm run lint         # eslint + tsc --noEmit
npm test             # unit + functional tests
npm run test:build   # checks on the GitHub Actions workflows
make acceptance      # vite build, then the Playwright scenarios
make check           # everything
make lock-actions    # regenerate .github/workflows/actions.lock after changing a `uses:`
```

Single tests: `node --test --test-name-pattern "rejects a post" test/functional/sharing.test.ts`,
or `npx --no-install playwright test --grep "shares a post"` after `bddgen`. Acceptance tests
serve `dist/`, so build first. Node comes from mise; in a non-interactive shell prefix commands
with `mise exec --`.

## Architecture

- **No compile step.** Node 24 runs the TypeScript directly, so `tsconfig.json` allows only
  erasable syntax (no enums, no parameter properties) and imports name the `.ts` file.
- **Server** (`src/server`): Fastify. `buildApp(options)` wires in-memory `Members`, `Sessions`,
  `Timeline` and `Mailbox`; `main.ts` alone reads env vars. Errors answer `{ problems: [...] }`.
- **Web** (`src/web`): Vite, two pages. `sign-in.html` for visitors and `index.html` (the
  timeline) for members. Each page checks `GET /api/session` and redirects to the other.
- **Test mailbox**: no real mail is sent. `EXPOSE_TEST_MAILBOX=true` adds
  `GET /api/test/mailbox/:address`, the only back door, and it must stay off outside tests.
- **`test/support/member-api.ts`**: one API client with two transports. Functional tests use
  in-process `inject()` (`test/functional/postboard.ts`). Acceptance tests use HTTP through the
  actor's browser context (`test/acceptance/screenplay/cast.ts`), so API and browser share cookies.
- **Acceptance** (`test/acceptance`): playwright-bdd turns `features/` into Playwright tests.
  Steps are split into `given` (API), `when` (UI) and `then` files. An `Actor` has a `browser`
  and an `api`. "she/he" means the last actor named. Tasks live in `tasks/through-the-api.ts`
  and `tasks/through-the-ui.ts`; UI tasks drive the page objects in `pages/`.
- **Pipeline**: `commit-build.yml` lints, tests, builds and uploads
  `dist/`. `acceptance-tests.yml` starts via `workflow_run`, tests that commit and its `dist/`,
  and is debounced by one concurrency group without `cancel-in-progress`.
  `test/build/workflows.test.ts` guards this coupling, which otherwise breaks silently.

## Writing tests

- Test a rule at the lowest tier that covers it: unit for pure logic, functional for API
  behaviour, acceptance only for what a member sees.
- Feature files state intentions ("she registers"), never mechanics ("I click Register").
  Fields and buttons belong in page objects.
- A new `Given` goes through the API, a new `When` through the UI. A `When` that would need the
  API is probably a functional test.
- Tests run in parallel against shared state, so make data with `aNewMemberCalled(name)` and
  `aPostAbout(subject)`, which are unique per call, and assert on those values, never on counts.
- Locate elements by role and label. Wait with Playwright's `expect`, never `sleep`.
- Name tests as behaviour sentences ("rejects a post with nothing in it").

## Conventions

- Dependencies: install with `npm ci`; add with `npm install --save-exact` and review the lock
  file. `.npmrc` blocks install scripts and only accepts versions published at least 7 days ago.
- Actions: workflows name exact tags (`actions/checkout@v7.0.1`); `actions.lock` pins the
  commits. After changing a `uses:`, run `make lock-actions` and commit both.

## Git

- Conventional Commits with a scope (`feat(sharing): ...`, `fix(server): ...`, `test(acceptance): ...`).
  Workflow and build-setup changes use the `build` type.
- Subject: imperative, lowercase, no trailing period, at most 72 characters.
- Body explains *why*, not *what*.
- One logical change per commit. Never commit secrets, `.env` files or build output.
