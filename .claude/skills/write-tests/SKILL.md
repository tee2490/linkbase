---
name: write-tests
description: Write the Vitest unit tests for a Linkbase feature, following docs/testing.md (Zod schemas and pure functions only, as *.test.ts next to the file under test). Writes tests only, with no running, no QA and no commits, then reports in 2–3 lines and hands back. Use whenever the user asks to write, add or create tests, unit tests or test coverage for a feature, branch or file, for example "write tests", "add tests for auth", "test the signup schema" or "cover this with tests".
---

# Write tests

Write the unit tests for the current feature exactly as `docs/testing.md` defines them. **Write tests only.** Don't run them, don't run QA and don't commit. The user runs tests and triggers `run-qa-suite` separately.

## 1. Read the testing doc

Read `docs/testing.md` first, before looking at any code. It decides what gets a unit test, what doesn't, where test files go and how they're written. If anything below conflicts with it, `docs/testing.md` wins.

Also read `docs/coding-standards.md` for imports, naming and the no-`any` rules, which apply to test files too.

## 2. Find what the feature added

1. Get the branch: `git branch --show-current`. If it's `main`, stop and ask which feature to test.
2. Read `./plans/<branch>.md` (for `feat/add-links`, that's `plans/feat/add-links.md`) to understand what the feature is meant to do.
3. List the feature's files: `git diff --name-only main...HEAD` plus uncommitted changes from `git status --short`.
4. If the user named a specific file or schema, limit the work to that.

## 3. Pick what to test

From the feature's files, keep only what `docs/testing.md` says gets unit tests:

- **Zod schemas** in `src/lib/validation/`
- **Pure functions**: no database, session, `headers()`, network or Next.js runtime calls

Skip Server Actions, query functions, models, the proxy and components, since QA covers them. **Never mock** `auth()`, Mongoose models, `next/headers` or a Server Action to make something testable. If logic worth testing is tangled with I/O, don't refactor it here. Mention it in the report as a candidate to extract.

If nothing in the feature qualifies, write no tests. Say so in the report.

## 4. Check Vitest is installed

Look for `vitest` in `package.json` `devDependencies`. If it's missing, stop and ask before installing it (`npm install -D vitest`, plus a `"test": "vitest"` script). Test files that import `vitest` without it installed break `npm run build`'s type check.

Before writing Vitest code, pull current Vitest docs through Context7 (the "Live Docs" rule in `CLAUDE.md`), matching the installed version.

## 5. Write the tests

- **One `*.test.ts` file next to each file under test**, with the same name: `src/lib/validation/auth.ts` → `src/lib/validation/auth.test.ts`. If the test file already exists, add to it and don't duplicate cases.
- **Import from the file under test with a relative path** (`./auth`), and import `describe`, `it` and `expect` from `vitest` explicitly.
- **For each schema**, cover:
  - valid input passing, plus what its transforms (trim, lowercase) produce
  - each rule rejecting, checking the issue `path` and the exact message the form shows
  - cross-field refinements (for example password and confirm password)
  - boundaries such as minimum and maximum lengths
- **For each pure function**, cover the normal case, edge cases and the inputs it must reject, including security-relevant ones (for example `//evil.com` for a redirect check).
- **Every test is independent.** Build each test's input inside the test. Don't share mutable fixtures, don't use `beforeAll` for state that tests change, and don't depend on test order.
- **Test what callers see** (the result and its messages), not implementation details. Use `it.each` for tables of similar inputs.
- Follow `docs/coding-standards.md`: no `any`, no `@ts-ignore`, and the same import order.

Only create or change `*.test.ts` files. Don't change the code under test. If a test exposes a bug, leave the test showing the expected behavior and report the bug.

## 6. Stop and hand back

When the tests are written:

- **Don't** run the tests, run lint or build, run QA, start the app, commit or push.
- Report in **2–3 lines**: which test files were added or changed and what they cover, anything skipped or flagged (logic to extract, a suspected bug), and that they're ready to run.

Example:

> Added `src/lib/validation/auth.test.ts`: `signInSchema`, `signUpSchema` (email normalization, password length, 72-byte limit, confirm-password match) and `safeCallbackUrl` (relative paths pass; `//`, `/\` and absolute URLs fall back to `/dashboard`).
> Nothing else in the feature is pure; actions and the proxy are left to QA. Ready to run with `npm test`.
