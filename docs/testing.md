# Linkbase Testing — Unit Tests and QA

What gets tested, with which tool, and against which database. All paths are under `src/` unless they're at the repo root.

---

## Overview

| Layer | Tool | Covers | Lives in |
|---|---|---|---|
| **Unit** | Vitest | Pure functions and Zod schemas | `*.test.ts` next to the file under test |
| **End-to-end QA** | Playwright MCP, driven by the `run-qa-suite` skill | Pages, forms, Server Actions, auth, the database | Nowhere in the repo; scenarios come from the plan |

Rules that apply to both:

- **Every test is independent.** No shared state between tests, and no reliance on the order they run in. Any single test can run alone and pass.
- **Never touch the dev or prod database.** Unit tests don't use a database at all, and QA uses only the test database (see [Test database](#test-database)).

## Unit tests (Vitest)

Vitest isn't installed yet (`npm install -D vitest`). Add a `"test": "vitest"` script when it is.

### What to unit test

- **Zod schemas** in `lib/validation/`: valid input passes, each rule rejects with the message the form shows, and transforms (trim, lowercase) produce the expected output.
- **Pure functions**: helpers with no I/O, such as `safeCallbackUrl` in `lib/validation/auth.ts`.

### What not to unit test

- **Server Actions, query functions, models and the proxy.** They depend on the session, `headers()`, MongoDB and Next.js internals. They're covered by QA instead, against the real stack. **Don't mock them** (no mocked `auth()`, Mongoose models or `next/headers`).
- **Components.** UI behavior is checked in QA.

If a function mixes logic with I/O and the logic needs unit tests, extract the logic into a pure function and test that.

### Where tests live

Put the test next to the file it tests, with the same name plus `.test.ts`:

```
src/lib/validation/
├── auth.ts
└── auth.test.ts
```

### Example

```ts
// src/lib/validation/auth.test.ts
import { describe, expect, it } from "vitest";

import { safeCallbackUrl, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("lowercases and trims the email", () => {
    const result = signUpSchema.safeParse({
      email: "  Jane@Example.com ",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-9",
    });
    expect(result.success && result.data.email).toBe("jane@example.com");
  });

  it("rejects mismatched passwords on confirmPassword", () => {
    const result = signUpSchema.safeParse({
      email: "jane@example.com",
      password: "correct-horse-9",
      confirmPassword: "correct-horse-8",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("safeCallbackUrl", () => {
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", undefined])(
    "falls back to /dashboard for %s",
    (value) => {
      expect(safeCallbackUrl(value)).toBe("/dashboard");
    },
  );
});
```

- Build each test's input inside the test. Don't share mutable fixtures between tests, and don't use `beforeAll` to set up state that tests change.
- Test behavior a user or caller sees (the result and the error message), not implementation details.

## End-to-end QA (Playwright MCP)

QA is run by the **`run-qa-suite` skill**, which drives a real browser through the Playwright MCP server, following the **QA Scenarios** in the feature's plan (`plans/<branch>.md`).

- **No committed browser tests.** There's no `/e2e` folder, no `playwright.config.ts` and no `.spec.ts` files. Don't add them.
- **Server Actions are tested here, through the UI**, with a real session, real validation and a real database write. They're never mocked.
- Each scenario sets up its own data (for example, by signing up a new user with a unique email such as `qa+<timestamp>@example.com`) and doesn't depend on another scenario having run first.
- A scenario passes only if what the plan says should happen is visible in the browser: the page, the message, the redirect.

## Test database

QA runs against a **separate MongoDB database**, never the dev or prod one.

- The connection string is `MONGODB_URI_TEST`, set in **`.env.test`**. It's gitignored by the `.env*` rule, so add a placeholder for it to `.env.example`.
- The app always reads `MONGODB_URI` (`lib/env.ts`). For QA, the app is started with `MONGODB_URI` set to the value of `MONGODB_URI_TEST`, so no app code knows about the test database.
- Use a database name that makes the purpose obvious, for example `mongodb://localhost:27017/linkbase_test`.
- **Before running QA, check that `MONGODB_URI_TEST` is set and differs from the dev `MONGODB_URI`.** If it's missing or the same, stop. Don't fall back to the dev database.
- Because scenarios create their own data, the test database can be dropped at any time without breaking anything.

## Checklist

Before merging a feature, check that:

- [ ] New Zod schemas and pure helpers have `*.test.ts` files next to them
- [ ] No test mocks a Server Action, `auth()`, a Mongoose model or `next/headers`
- [ ] Every test passes when run on its own
- [ ] The plan's QA Scenarios pass in `run-qa-suite` against the test database
- [ ] No `/e2e` folder, `playwright.config.ts` or `.spec.ts` files were added
