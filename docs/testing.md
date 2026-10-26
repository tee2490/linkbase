# Testing

How Linkbase is tested. There are two layers, and each one covers different code:

| Layer | Tool | Covers | Lives in |
| --- | --- | --- | --- |
| **Unit tests** | Vitest | Pure functions and Zod schemas | `*.test.ts` next to the file under test |
| **End-to-end QA** | Playwright MCP, driven by the `run-qa-suite` skill | Pages, forms, Server Actions, auth and data, through the real app | Nothing committed. Scenarios come from the feature's plan |

Both layers follow the same rule: **every test is independent.** See [Independence](#independence).

## Unit tests (Vitest)

### What gets a unit test

Code that takes input and returns output without touching the network, the database, the session or the DOM:

- **Zod schemas** in `/lib/validation`, such as `signUpSchema` and `signInSchema`. Test valid input, each rule's error message, trimming and lowercasing, and cross-field checks like password confirmation.
- **Pure helpers**, such as `safeCallbackUrl()` in `lib/auth/callback-url.ts`, `isDuplicateKeyError()` in `lib/db/errors.ts` and `getClientIp()` in `lib/rate-limit/rate-limit.ts`.

What doesn't get a unit test:

- **Server Actions.** They're tested end to end through MCP-driven QA, against the real database and session. Don't mock `auth()`, `connectDb()`, Mongoose models or `next/headers` to unit-test an action. A mocked action proves the mocks, not the action.
- **Components and pages.** These are covered by QA in the browser.
- **Queries and models.** These are covered by QA against the test database.

If a piece of logic inside an action is worth unit-testing, extract it into a pure function in `/lib` and test that.

### Location and naming

Tests live next to the file they test, with the same name plus `.test.ts`:

```
lib/validation/
  auth.ts
  auth.test.ts
lib/auth/
  callback-url.ts
  callback-url.test.ts
```

There's no `__tests__` or `/tests` folder. Tests are TypeScript (`.test.ts`, not `.test.tsx`), because they cover pure code.

### Writing them

```ts
// lib/validation/auth.test.ts
import { describe, expect, it } from "vitest";

import { signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("lowercases and trims the email", () => {
    const result = signUpSchema.safeParse({
      email: "  Maya@Example.COM ",
      password: "trail2026",
      confirmPassword: "trail2026",
    });
    expect(result.success && result.data.email).toBe("maya@example.com");
  });

  it("puts a mismatch error on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      email: "maya@example.com",
      password: "trail2026",
      confirmPassword: "trail2027",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
```

- Use `safeParse` and assert on `success`, the data and the issue paths and messages. Messages are shown to users, so a changed message should fail a test.
- Build each input inside the test. Don't share mutable fixtures between tests.
- Follow `docs/coding-standards.md`: strict TypeScript, no `any`, and the same import order.

### Setup

Vitest is **not installed yet**. Add it in the first change that adds a unit test:

- Add `vitest` as a dev dependency and `"test": "vitest run"` to `package.json`.
- Add `vitest.config.ts` with the `@/` path alias from `tsconfig.json` and `environment: "node"`.
- Modules that start with `import "server-only"` throw outside a React Server Components build. Alias `server-only` to an empty module in `vitest.config.ts`, so pure helpers in those files can still be tested.

Run the tests with `npm test`. They must pass before a PR is merged.

## End-to-end QA (Playwright MCP)

End-to-end QA is run by an agent, not by a test runner. The `run-qa-suite` skill drives a real browser through the Playwright MCP server, against a running copy of the app.

- **No committed browser tests.** There's no `/e2e` folder, no `playwright.config.ts` and no `.spec.ts` files. Don't add them.
- **The scenarios are the QA Scenarios section of the feature's plan** (`plans/<branch>.md`, written by `plan-feature`). Each scenario is one line: what the user does → what should happen. `run-qa-suite` runs each one and reports pass or fail with what it observed.
- **Server Actions are tested here,** through the forms and buttons that call them. That covers validation errors, `ActionResult` messages, auth redirects, rate limits and the data written to the test database.
- Check what the user sees *and* what was stored. For example, after sign-up, confirm the user document has `email`, a `passwordHash` in `scrypt$…` format and no `handle`.
- Cover the same states for every feature: the happy path, the auth boundary (signed out, or another user's data), validation, and at least one edge case.

### Test database

QA runs against a **separate test database**. It never uses the development or production database.

| File | Variable | Used by |
| --- | --- | --- |
| `.env.local` | `MONGODB_URI` | `npm run dev` (development data) |
| `.env.test` | `MONGODB_URI_TEST` | QA runs only |

- `.env.test` is ignored by git, because `.gitignore` ignores `.env*`. Its variable is listed in `.env.example` without a value (`docs/security.md`).
- `run-qa-suite` starts its own copy of the app on `localhost:3000`, with `MONGODB_URI` set to the value of `MONGODB_URI_TEST`. A process environment variable overrides the `.env` files. It never reuses a dev server that's already running, because that one uses the dev database. If port 3000 is taken, it asks you to stop that server first.
- Between scenarios it empties every collection in the test database but keeps the collections and indexes, so unique constraints are still enforced. It refuses to reset a database whose name doesn't contain `test`.
- **Refuse to run** if `MONGODB_URI_TEST` is missing or equal to `MONGODB_URI`. Use a database name that marks it as a test database, such as `linkbase_test`.
- QA may delete data, but only in the test database.

## Independence

Every test, unit or QA, runs on its own. It passes alone, in any order and alongside any other test.

- **No shared state.** A test creates everything it needs and doesn't rely on data, accounts or sessions left behind by another test.
- **No order dependencies.** Never write "scenario 3 uses the account created in scenario 1". If a scenario needs a signed-in user, it signs up a fresh one first.
- **Unique data per test.** Build values that can't collide, such as `qa-<timestamp>-<random>@example.test` for emails.
- **Clean starting state for QA.** Before each scenario, clear what could leak between scenarios in the test database. That includes the `rate_limits` collection, because every QA request comes from the same IP and would otherwise hit the sign-in and sign-up limits. Clear the browser's cookies, too, so each scenario starts signed out.
- **Unit tests have no module-level mutable state.** Reset any spy or fake timer in the test that created it.
