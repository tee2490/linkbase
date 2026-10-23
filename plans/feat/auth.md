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

---

# Plan: Credentials authentication (sign up, sign in, user menu)

**Branch:** feat/auth
**Goal:** A visitor can create an account with email and password, sign in and out, and see who they're signed in as in the site header (avatar + dropdown). `/dashboard` is protected, and signed-out visitors are sent to `/sign-in`. Picking a handle is a separate, later feature.

## Context
MongoDB is already set up on this branch (`src/lib/db/connect.ts`, `src/lib/env.ts`, commit f584c09). There are no User model, auth library or auth routes yet. The landing header (`src/components/landing/site-header.tsx`) has static "Log in" / "Sign up free" links to `/sign-in`, which doesn't exist. Context7 is down this session, so Auth.js APIs come from the installed package's types and README after install. Next.js behavior comes from `node_modules/next/dist/docs/` (proxy.md, authentication.md).

## Docs followed
- `docs/auth.md`: Auth.js v5. `lib/auth/config.ts` exports `handlers/auth/signIn/signOut`. `lib/auth/index.ts` has `getSession`/`requireUserId`. `proxy.ts` uses an allowlist. Only the user id goes in the session, with a bounded `maxAge`. Callbacks are relative-only. Credentials means hashing with bcrypt/argon2 and rate-limiting sign-in.
- `docs/database.md`: schema in `lib/db/models/user.ts`, strict mode, timestamps, `models.User ?? model(...)`.
- `docs/data-mutations.md` + `docs/errors-and-validation.md`: Zod schemas in `lib/validation/`, `ActionResult` in `lib/types/action-result.ts`, `useActionState` forms with `aria-invalid`/`aria-describedby`, duplicate key 11000 becomes a field error, and caught error text is never returned.
- `docs/data-fetching.md`: the header reads the user through a `server-only` query in `lib/db/queries/`, which returns a DTO to the Client Component.
- `docs/routing.md`: `(auth)` group for `/sign-in` and `/sign-up`, `(dashboard)` group for `/dashboard`, and `PUBLIC_PATHS` updated.
- `docs/security.md`: `AUTH_SECRET` validated in `env.ts` and placed in `.env.example`. Rate limits use a shared store, not memory. The same message is shown whether or not the account exists.
- `docs/ui.md` / `docs/design-system.md`: reuse `Button`, `buttonClasses`, `Input` and `Avatar`. Focus rings use `ring-ink`.
- `CLAUDE.md` React Performance: the session-dependent header part is a small async server leaf inside `<Suspense>`. The client boundary is only the dropdown, and only the `{ displayName, email }` DTO is passed to it.

## Files
| Action | Path | Purpose |
|---|---|---|
| Change | `package.json` | `npm install next-auth@beta bcryptjs` (v5 beta.32 supports Next 16; bcryptjs is pure JS, so no native build) |
| Change | `src/lib/env.ts` | Add `AUTH_SECRET: z.string().min(32)` |
| Change | `.env.example` | Note `AUTH_SECRET` (`npx auth secret`) and `AUTH_TRUST_HOST=true` for self-hosting behind a proxy |
| Create | `src/lib/db/models/user.ts` | `email` (required, unique, lowercase, trim, max 254), `passwordHash` (required, `select: false`), `displayName` (required, max 50), `handle` (optional, lowercase, trim; unique **partial** index on `{ handle: { $type: "string" } }`). Strict, with timestamps, plus the `User` type |
| Create | `src/lib/db/models/rate-limit.ts` | `{ key, count, expiresAt }`: unique `key` and a TTL index on `expiresAt` |
| Create | `src/lib/rate-limit/index.ts` | `server-only` `checkRateLimit(key, limit, windowSeconds)` using one atomic `findOneAndUpdate` upsert with `$inc`, and `getClientIp()` from `headers()` / request headers |
| Create | `src/lib/types/action-result.ts` | Shared `ActionResult` exactly as documented |
| Create | `src/lib/validation/auth.ts` | `signInSchema` (`z.email()`, password 1–72 bytes), `signUpSchema` (password 8–72 **bytes**, the bcrypt limit), `safeCallbackUrl` (relative `/…`, not `//`, default `/dashboard`) |
| Create | `src/lib/auth/config.ts` | `NextAuth({ providers: [Credentials({ authorize })], session: { strategy: "jwt", maxAge: 30d }, pages: { signIn: "/sign-in" }, callbacks: { jwt (keep only `sub`), session (`session.user.id = token.sub`) } })`. `authorize`: Zod-parse, rate-limit by IP+email, look up the user with `+passwordHash`, and `bcrypt.compare` (against a dummy hash when there's no user, so timing doesn't show which emails exist). On limit it throws a `CredentialsSignin` subclass with `code = "rate_limited"` |
| Create | `src/lib/auth/index.ts` | `server-only` `getSession()` and `requireUserId()` as in `docs/auth.md` |
| Create | `src/lib/auth/next-auth.d.ts` | Module augmentation: `Session["user"]["id"]: string` |
| Create | `src/lib/db/queries/users.ts` | `server-only` `getUserSummary(userId)` → `{ displayName, email } \| null` (lean, DTO, uncached, which is fine because only the owner reads it) |
| Create | `src/app/api/auth/[...nextauth]/route.ts` | `export const { GET, POST } = handlers` |
| Create | `src/proxy.ts` | Allowlist from `docs/auth.md` plus `/sign-up`. Signed-in users on `/sign-in` or `/sign-up` go to `/dashboard` |
| Create | `src/app/(auth)/layout.tsx` | Minimal centered layout with the wordmark linking home |
| Create | `src/app/(auth)/sign-in/page.tsx` | Reads `callbackUrl` from `searchParams` (async) and renders `SignInForm` |
| Create | `src/app/(auth)/sign-up/page.tsx` | Renders `SignUpForm` |
| Create | `src/app/(auth)/actions.ts` | `"use server"`. `signInWithCredentials`: validate, then `signIn("credentials", { …, redirectTo })`. Catches `AuthError`: `rate_limited` → "Too many attempts. Try again later.", anything else → "Email or password is incorrect". Other errors (including the redirect) are rethrown. `signUp`: rate-limit by IP (5/hour), validate, hash (bcrypt cost 12), create with `displayName` = the part of the email before the @, catch 11000 → `email: ["An account with this email already exists"]`, then sign in → `/dashboard`. `signOutUser` → `signOut({ redirectTo: "/" })` |
| Create | `src/components/auth/sign-in-form.tsx` | `"use client"` `useActionState` form (email, password, hidden callbackUrl), with inline errors and a pending state. Links to sign-up |
| Create | `src/components/auth/sign-up-form.tsx` | Same pattern (email, password with an "8+ characters" hint, confirm password checked by a `signUpSchema` refine). Links to sign-in |
| Create | `src/components/auth/header-auth.tsx` | Async server leaf: no session → Log in / Sign up free links. Session → `getUserSummary`, then `<UserMenu>`. Also a static `HeaderAuthFallback` placeholder of the same size |
| Create | `src/components/auth/user-menu.tsx` | `"use client"` disclosure: an avatar button (`aria-expanded`, `aria-controls`) opens a panel with name and email, a Dashboard link and a Sign out form button. Closes on Escape (focus returns to the trigger), outside click or route change |
| Change | `src/components/landing/site-header.tsx` | Replace the static links with `<Suspense fallback={<HeaderAuthFallback />}><HeaderAuth /></Suspense>` |
| Change | `src/components/landing/claim-form.tsx` | Point to `/sign-up` (keep `?handle=` for the later onboarding feature) |
| Create | `src/app/(dashboard)/dashboard/page.tsx` | Minimal protected placeholder: `SiteHeader` plus a "You're signed in as {email}" stub. It's the post-sign-in target |
| Change | `docs/database.md`, `docs/auth.md`, `docs/routing.md`, `docs/security.md` | Record the decisions: `handle` is optional until onboarding (partial unique index), the provider is credentials with bcrypt and JWT sessions, the `/sign-up` route, and the rate-limit store is MongoDB TTL |

## Approach
1. **Model and validation first**, then rate limiting, Auth.js config, the proxy, actions, pages, and finally the header.
2. **JWT sessions** (Credentials requires them), so there's no MongoDB adapter. The token holds only `sub`. The header gets the name and email from the DB by id, which follows the "only the user id in the session" rule.
3. **Rate limiting lives inside `authorize`**, not only in the action, so direct POSTs to `/api/auth/callback/credentials` are limited too. Sign-in is 5 per 15 minutes per IP+email, and sign-up is 5 per hour per IP.
4. **Documented exceptions:** `signInWithCredentials` and `signUp` skip `requireUserId()` (there's no session yet, by definition). Sign-up shows "email already exists", which is unavoidable for a signup form, while sign-in errors never show whether an account exists.
5. **Cache Components:** `auth()` is dynamic, so `HeaderAuth` stays inside `<Suspense>` and the landing page keeps its static shell. Nothing calls `auth()` inside `'use cache'`. No tags are cleared, because nothing cached depends on users yet.

## Out of scope
- Picking or claiming a handle (onboarding), the profile, and a real dashboard UI.
- Email verification, password reset, OAuth providers, and changing email or password.
- Security headers/CSP, `instrumentation.ts` logging, and `error.tsx` files (separate tasks in `docs/security.md` / `docs/errors-and-validation.md`).

## QA Scenarios
1. **Happy path:** at `/sign-up`, enter `jane@example.com` / `correct-horse-9` → land on `/dashboard`. The header shows a "J" avatar, and the dropdown shows "jane" and `jane@example.com`. Sign out → back on `/`, where the header shows "Log in" / "Sign up free".
2. **Auth boundary:** signed out, open `/dashboard` → redirected to `/sign-in?callbackUrl=%2Fdashboard`, and after signing in you land on `/dashboard`. `callbackUrl=https://evil.com` → you land on `/dashboard` instead.
3. **Validation:** sign up with `jane@` and `short` → inline "Enter a valid email" and "Use at least 8 characters", and nothing is created. Sign in with the wrong password → "Email or password is incorrect", the same text as for an unknown email.
4. **Duplicate:** sign up again with `JANE@example.com` → "An account with this email already exists" (the email is lowercased before the unique check).
5. **Rate limit:** six wrong sign-in attempts for one email within 15 minutes → the 6th shows "Too many attempts. Try again later.", even with the correct password.
6. **Session hygiene:** the session cookie is `httpOnly`, and the decoded session (`/api/auth/session`) has only `user.id` and `expires`, with no password hash.
