---
name: write-tests
description: Write unit tests for a Linkbase feature following docs/testing.md. Use whenever the user asks to write, add or create tests for a feature, branch, file or function ("write tests for auth", "add tests", "add unit tests for the validation schemas", "cover this with tests"). Writes Vitest *.test.ts files next to the code for pure functions and Zod schemas, then stops and reports. Does not run the tests, run QA or commit.
---

# Write tests

Run this when the user asks for tests for a feature. Its only job is to write unit tests.

**Out of scope:** running the tests, running QA (that's `run-qa-suite`), writing Playwright or e2e specs, committing, pushing or opening PRs.

## 1. Read the testing rules

Read `docs/testing.md` in full before anything else. It defines:

- what gets a unit test
- where tests live and how they're named
- the style to write them in
- Vitest setup
- the independence rules

Also read `docs/coding-standards.md`. Tests follow the same TypeScript and import rules.

## 2. Find what to test

1. Work out the feature's scope:
   - Run `git branch --show-current` and read `./plans/<branch>.md` (with `/` replaced by `-`), if it exists.
   - Run `git diff main...HEAD --name-only` plus `git status --short` to list the files the feature added or changed.
   - If the user named specific files or functions, test those instead.
2. From those files, pick only the code `docs/testing.md` says gets a unit test: **pure functions and Zod schemas**. Skip the following, because QA covers them:
   - Server Actions
   - components and pages
   - queries and models
   - anything that needs the database, the session, `next/headers` or the DOM
3. Read each file you'll test, and the existing `*.test.ts` next to it if there is one. Add to an existing test file rather than replacing it.

If a Server Action holds logic worth a unit test, don't mock the action. Tell the user it could be pulled out into a pure function in `/lib`, and leave that change to them.

## 3. Make sure Vitest is set up

If `vitest` isn't in `package.json`, do the **Setup** steps from `docs/testing.md` first:

- install the dev dependency
- add the `test` script
- add `vitest.config.ts` with the `@/` alias, `environment: "node"` and the `server-only` alias

This is the one non-test change the skill makes. Mention it in the report.

## 4. Write the tests

For each function or schema, write a `<file>.test.ts` next to it, in the style `docs/testing.md` shows:

- **Schemas:** valid input passes, and each rule fails with its exact user-facing message. Cover transforms (trim, lowercase), boundaries (min and max lengths) and cross-field checks (the error is on the right `path`). Use `safeParse`, never `parse`.
- **Helpers:** the normal case, edge and boundary inputs, and malformed or unexpected input (wrong types, empty strings, hostile values like `//evil.com` for redirect guards).
- **Independent tests:** each test builds its own input inside the test. No shared mutable fixtures, no module-level state, and no test that depends on another having run. Reset any spy or fake timer in the test that created it.
- **Assert behaviour, not implementation:** check the outputs and messages, not private details.
- Keep `describe` blocks per function or schema and name each `it` after the behaviour it checks.

## 5. Stop and report

Don't run the tests. Report in 2 to 3 lines:

- which test files were added or extended, and roughly what they cover
- anything set up for the first time (Vitest)
- anything deliberately left to QA, or suggested for extraction

Then hand back, so the user can run `npm test` or `run-qa-suite` when they're ready.
