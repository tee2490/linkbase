# MongoDB setup

**Branch:** feat/auth (your choice: the DB setup is the first step of the auth feature)
**Docs followed:** docs/architecture.md, docs/database.md, docs/security.md, docs/coding-standards.md, docs/errors-and-validation.md

## Goal
Give the app a working MongoDB connection through Mongoose: one cached, server-only `connectDb()` that later features (auth first) call before any query. It also adds the committed env template. Models are out of scope. They come with the features that need them.

## Files
### Create
- `lib/db/connect.ts`: `connectDb()`, as in docs/database.md. It starts with `import "server-only";`, throws `new Error("MONGODB_URI is not set")` at import when the variable is missing, and caches the pending promise on `globalThis` so hot reloads and concurrent first calls share one connection. It uses `serverSelectionTimeoutMS: 5000`.
- `.env.example`: the template from docs/security.md, with `MONGODB_URI=` (empty, with a comment showing the `mongodb+srv://user:password@host/db` shape). `AUTH_SECRET` and the provider lines are left for the auth step, per "add a variable in the same change that uses it".

### Change
- `package.json` / `package-lock.json`: add `mongoose` and `server-only` as dependencies.

## Notes
- **Server-only (docs/database.md, docs/security.md).** `lib/db` reads a secret, so `import "server-only"` makes any Client Component import fail the build.
- **One departure from the doc snippet.** docs/database.md caches the promise with `??=`. If the first connect fails (Atlas down, wrong IP allowlist), the rejected promise stays cached and every later call fails until a restart. I'll clear the cache when the promise rejects, so the next call retries, and rethrow the error wrapped with `cause` (docs/coding-standards.md → Errors). Everything else matches the doc. The connection string is never logged (docs/security.md).
- **`.env.local`.** It currently has no `MONGODB_URI` value, and the protect-env hook blocks me from editing it anyway. You add the real string yourself: `MONGODB_URI=mongodb+srv://…`. `.gitignore` already ignores `.env*` and re-includes `.env.example`.
- **Nothing imports `connectDb` yet,** so the landing page build isn't affected by a missing variable. The first caller will be the auth step.
- **Next.js / Mongoose versions.** Before writing it, I'll check the installed Mongoose version's `connect` options and its TypeScript types through Context7.

## QA Scenarios
1. **Happy path:** with a valid `MONGODB_URI` in `.env.local`, a server-side call to `connectDb()` → resolves, and `mongoose.connection.readyState` is `1`.
2. **Auth/boundary:** a `"use client"` file imports `@/lib/db/connect` → `next build` fails with the `server-only` error, so the secret never reaches the browser.
3. **Validation:** `MONGODB_URI` missing or empty → importing the module throws `MONGODB_URI is not set` and doesn't fall back to a default.
4. **Edge case (unreachable DB):** `MONGODB_URI` points at an unreachable host → `connectDb()` rejects within about 5s, and the next call tries again instead of returning the cached failure.
5. **Edge case (reuse):** two concurrent first calls, and a call after a dev hot reload → share one connection, with no second `mongoose.connect`.
6. **Secrets:** run `git status` after setup → only `.env.example` is new, `.env.local` stays ignored, and no connection string appears in code or logs.

## Verification
- `npx tsc --noEmit`, `npm run lint` and `npm run build` pass.
- After you add `MONGODB_URI` to `.env.local`: run a one-off connection check with `node --env-file=.env.local` that imports mongoose, connects and prints `connected` or the error message, never the URI. No test file is committed.
