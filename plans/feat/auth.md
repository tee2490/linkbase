# Plan: MongoDB database setup

**Branch:** feat/auth
**Goal:** Server code can call `connectToDatabase()` to get one cached Mongoose connection, and env vars are validated on startup. This is the groundwork that the NextAuth work on this branch will build on.

## Context
No database code exists yet. `package.json` has no `mongoose`, `zod` or `server-only`, and there is no `src/lib/`. The user chose to keep this setup in `feat/auth` and not open a separate branch. Context7 timed out this session, so APIs come from the installed packages' own types and READMEs in `node_modules`.

## Docs followed
- `docs/database.md`: one helper, `connectToDatabase()`, in `src/lib/db/connect.ts`, cached on `globalThis`, with `bufferCommands: false`, and the retry reset on failure. Models go in `src/lib/db/models/` and are deferred (see Out of scope).
- `docs/security.md`: secrets only in env vars, with a committed `.env.example`. `.gitignore` gets a `!.env.example` exception. Env is validated with Zod in `src/lib/env.ts`, and any module that reads secrets starts with `import "server-only"`.
- `docs/architecture.md`: shared non-UI code goes in `lib/`, with kebab-case file names.
- `docs/coding-standards.md`: strict TS, no `any`, named exports, `import type`, and the import order rules.

## Files
| Action | Path | Purpose |
|---|---|---|
| Change | `package.json` / `package-lock.json` | `npm install mongoose zod server-only` |
| Create | `src/lib/env.ts` | `server-only`. A Zod schema with `MONGODB_URI: z.string().url()` (or a mongodb-scheme check), parsed from `process.env`, exporting a typed `env`. It fails fast with a clear message and never prints the value |
| Create | `src/lib/db/connect.ts` | `server-only`. Implements `connectToDatabase()` exactly as in `docs/database.md`, but reads `env.MONGODB_URI` and drops the non-null `!` |
| Create | `.env.example` | `MONGODB_URI=mongodb://localhost:27017/linkbase`, plus `AUTH_SECRET=` and the OAuth placeholders from `docs/security.md`, each with a comment |
| Change | `.gitignore` | Add `!.env.example` under `.env*` |

## Approach
1. Install the three deps, then check the Mongoose major version and the `connect` signature in `node_modules/mongoose/types`.
2. `env.ts` holds only the DB var for now. The auth vars get added when the auth plan needs them, so the build doesn't fail on vars that aren't used yet.
3. `connect.ts` imports `env`, so the URI is validated once, centrally.
4. The local secret file is not touched. A `.env` file already exists and is gitignored. Docs say `.env.local`, and Next loads both, so this is the user's call (see Open questions).

## Out of scope
- `User`/`Link` models, NextAuth and its adapter. These are the auth part of this branch and get their own plan step.
- Security headers/CSP and rate limits.

## Open questions
- Should the real `MONGODB_URI` stay in your existing `.env`, or move to `.env.local` per `docs/security.md`? Is it a local MongoDB or Atlas?

## QA Scenarios
1. **Happy path:** with a valid `MONGODB_URI`, a scratch script (`node --conditions=react-server` + tsx) calls `connectToDatabase()` twice → it connects, `readyState === 1`, and the second call returns the same instance.
2. **Validation:** `MONGODB_URI` unset or `not-a-url` → the first import throws `Invalid environment variables: MONGODB_URI …`, and the URI value doesn't appear in the output.
3. **Edge case (retry):** MongoDB stopped, then started → the first call rejects and the next call connects (the cached promise was cleared).
4. **Boundary:** importing `@/lib/db/connect` from a `"use client"` file → the build fails with the `server-only` error.
5. **Repo hygiene:** `git status` shows `.env.example` as tracked and `.env`/`.env.local` as ignored. `npm run lint` and `npm run build` pass.
