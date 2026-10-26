# Authentication (email + password)

**Branch:** feat/auth. This replaces the MongoDB-setup plan in `plans/feat-auth.md`; that part is already built and committed in `650bab6`.
**Docs followed:** docs/architecture.md, docs/database.md, docs/auth.md, docs/routing.md, docs/errors-and-validation.md, docs/data-mutations.md, docs/data-fetching.md, docs/security.md, docs/ui.md, docs/design-system.md, docs/coding-standards.md. Also the Next 16 guides `authentication.md`, `authentication-with-cache-components.md` and `proxy.md`, and the `vercel-react-best-practices` rules `server-auth-actions`, `server-cache-react`, `server-serialization`, `async-suspense-boundaries` and `bundle-barrel-imports`.

## Goal
Visitors can create an account with **email, password and confirm password** (no username or handle) and sign in with email and password, using Auth.js v5 Credentials. Signed-in users see their account in the header: an initial avatar and their email, with a dropdown for Dashboard and Sign out, on the landing page and in the app shell. `/dashboard` is protected.

## Files
### Create
**Auth core (`lib/auth/`)**
- `lib/auth/auth.ts`: `NextAuth({...})` exports `handlers`, `auth`, `signIn` and `signOut`. Credentials provider, JWT session strategy, `pages: { signIn: "/sign-in" }`. The `jwt` and `session` callbacks put only `user.id` in the token and session (docs/auth.md → "Only put the user id in the session"). `authorize()` does the following:
  1. Rate-limits by client IP: 10 per 15 min, from the first `x-forwarded-for` entry.
  2. Validates with `signInSchema`.
  3. Looks the user up by email with `+passwordHash`.
  4. Verifies the password.

  It returns `{ id }` or `null`. A rate-limited attempt throws a `CredentialsSignin` subclass with `code = "rate_limited"`.
- `lib/auth/password.ts`: `hashPassword()` and `verifyPassword()` using Node's built-in `crypto.scrypt` (random 16-byte salt, 64-byte key, stored as `scrypt$N$r$p$salt$hash`) and `timingSafeEqual`. `server-only`.
- `lib/auth/get-session.ts`: `getSession()` exactly as in docs/auth.md. It redirects to `/sign-in` when there's no session and returns `{ userId }`.
- `lib/auth/get-current-user.ts`: `getCurrentUser()`, wrapped in React `cache()` so the header and page share one lookup per request. It returns `{ id, email } | null` and never the hash. `server-only`.
- `app/api/auth/[...nextauth]/route.ts`: `export const { GET, POST } = handlers;`.
- `proxy.ts`: the protected-by-default proxy from docs/auth.md. Public paths are `/`, `/sign-in`, `/sign-up`, `/user/*`, `/api/auth/*` and `/api/webhooks/*`. A signed-in visitor on `/sign-in` or `/sign-up` goes to `/dashboard`, and a signed-out visitor elsewhere goes to `/sign-in?callbackUrl=…`.
- `lib/types/next-auth.d.ts`: module augmentation so `session.user.id` is typed as `string`.

**Data**
- `lib/db/models/user.ts`: `UserModel`.
  - `email`: String, required, unique, lowercase, trim, max 254.
  - `passwordHash`: String, required, `select: false`.
  - `handle`: String, lowercase, trim, `unique: true, sparse: true`. Optional, so many users can have none.
  - `{ strict: true, timestamps: true }`, registered with `models.User || model(...)` (docs/database.md).
- `lib/db/models/rate-limit.ts`: `{ key (unique), count, expiresAt }` with a TTL index on `expiresAt` (docs/security.md).
- `lib/rate-limit/rate-limit.ts`: `rateLimit(key, limit, windowMs)` does one atomic `findOneAndUpdate` with `$inc` and `upsert` on `key:windowStart` and returns `{ allowed, retryAfterMs }` (docs/security.md).
- `lib/db/errors.ts`: `isDuplicateKeyError(err, field)` for `code 11000` (docs/data-mutations.md).

**Validation and types**
- `lib/validation/auth.ts`:
  - `signInSchema`: email (trimmed, lowercased, `z.email`) and a non-empty password.
  - `signUpSchema`: email; password of 8–128 chars with at least one letter and one number; `confirmPassword`; and a `.refine` for a match that puts its error on `confirmPassword`.
  - Both export their inferred types.
- `lib/types/action-result.ts`: `ActionResult<T>` (docs/errors-and-validation.md).

**Routes (`(auth)` group, docs/routing.md)**
- `app/(auth)/layout.tsx`: the auth shell (docs/ui.md → Onboarding). On the left, a wordmark linking to `/` and the form card on `surface` (max 480px). On the right, a lime panel with the existing `ProfilePreview`, hidden below `lg`. No auth check in the layout (docs/auth.md).
- `app/(auth)/sign-up/page.tsx` + `actions.ts`: `signUp(prev, formData)`. The steps are:
  1. Rate-limit by IP: 5 per hour.
  2. Validate with `signUpSchema` and `safeParse`.
  3. `connectDb`.
  4. `UserModel.create({ email, passwordHash })`. A duplicate key becomes `fieldErrors.email: ["An account with this email already exists"]`.
  5. `signIn("credentials", { email, password, redirectTo: "/dashboard" })`, outside any try/catch, because `redirect` throws.
- `app/(auth)/sign-in/page.tsx` + `actions.ts`: `signInWithPassword(prev, formData)`. It validates, then calls `signIn("credentials", { …, redirectTo: callbackUrl })`. It catches only `AuthError`: `CredentialsSignin` becomes the `formError` "Email or password is incorrect", and `rate_limited` becomes "Too many attempts. Try again in a few minutes." Everything else is rethrown. `callbackUrl` is accepted only if it's a same-origin relative path.
- `app/_actions/auth.ts`: `signOutUser()` (`"use server"`, `signOut({ redirectTo: "/" })`). It's shared by the landing header and the app header, so it lives in a shared `_actions` folder. That folder is a private Next.js folder and adds no route.

**Dashboard (protected landing spot after sign-in)**
- `app/(dashboard)/layout.tsx`: the app shell, with a header bar (wordmark plus a `<Suspense>`-wrapped `HeaderAccount`) and `{children}`. No auth check.
- `app/(dashboard)/dashboard/page.tsx`: calls `getSession()` and shows a minimal "You're signed in as {email}" placeholder inside `<Suspense>`. The real editor comes in a later feature.

**Components**
- `components/auth/sign-up-form.tsx`, `components/auth/sign-in-form.tsx` (`"use client"`): `useActionState` forms. They keep the typed email on error, show inline `fieldErrors` with `aria-invalid`/`aria-describedby`, show a `formError` with `role="alert"`, and disable the submit button and show "Creating account…" / "Signing in…" while pending. Each links to the other page.
- `components/auth/header-account.tsx` (Server): calls `getCurrentUser()`. With no user it renders the existing "Log in" (soft) and "Sign up free" (ink) buttons; with a user it renders `<UserMenu email={...} />`. Only the email string crosses to the client (`server-serialization`).
- `components/auth/user-menu.tsx` (`"use client"`): the trigger is a 44px pill with an orchid initial avatar and the email, truncated and hidden below `sm`. It's a `<button aria-haspopup="menu" aria-expanded>`. The menu is a white `rounded-lg shadow-float` panel with the full email (muted), a "Dashboard" link and a "Sign out" button in a `<form action={signOutUser}>`. It closes on Escape (focus returns to the trigger), on an outside click and after a choice. Arrow keys move between items.
- `components/ui/input.tsx` **(change)**: add `variant` (`surface` | `field`), `error?: string` (2px inset danger ring plus a 14px danger message with `role="alert"`, per docs/ui.md → Input), and a visible label option (`hideLabel`, default `false`). The landing claim form passes `hideLabel`, so it looks the same as now.

### Change
- `components/landing/site-header.tsx`: replace the static Log in / Sign up buttons with `<Suspense fallback={<HeaderAccountSkeleton/>}><HeaderAccount /></Suspense>`, so the landing page stays a static shell and only the account slot streams (`authentication-with-cache-components.md`). "Sign up free" now goes to `/sign-up`.
- `components/landing/claim-form.tsx`: point the form at `/sign-up`. The `handle` query value is ignored for now. Handle selection comes in a later onboarding feature.
- `.env.example`: add `AUTH_SECRET=` with the `npx auth secret` comment (docs/security.md).
- `docs/database.md`: `handle` is optional, `unique` + `sparse`, set after sign-up.
- `docs/routing.md` and `docs/auth.md`: add `/sign-up` to the route map and the public allowlist, and replace "providers TBD" with Credentials (email + password).
- `docs/security.md`: add a sign-up row (IP, 5 per hour) to the rate-limit table, and note that the sign-in limit runs in `authorize()`.
- `docs/data-mutations.md`: add a revalidation table row for `signUp` (none; it redirects).
- `package.json`: add `next-auth@5.0.0-beta.32` (its peer range covers Next 16) and `zod@^4`. No bcrypt: hashing uses Node's built-in scrypt.

## Notes
- **Session holds only the id.** The JWT carries `sub`/`id`. The email comes from MongoDB through `getCurrentUser()`, deduped with React `cache()`, so a changed email shows up right away and nothing extra lives in the cookie.
- **Sign-in rate limit is in `authorize()`, not the proxy.** That one place covers both our Server Action and a direct `POST /api/auth/callback/credentials`. This departs from docs/security.md, which says to do it in the proxy, and docs are updated to match. Keys hold only IPs, never emails.
- **No account enumeration on sign-in.** The error is always "Email or password is incorrect". When the email is unknown, `authorize()` still runs a scrypt check against a dummy hash so the response time is the same. Sign-up has to say the email is taken. It is rate-limited.
- **Cache Components.** Anything that reads the session (`auth()`) sits inside `<Suspense>`, otherwise the build fails. Layouts never await the session (docs/auth.md, docs/routing.md).
- **Proxy isn't the boundary.** `getSession()` runs in the dashboard page and in any future action. `signOutUser` just signs out.
- **Open redirect guard.** `callbackUrl` must start with `/` and not `//`. Anything else falls back to `/dashboard`.
- **Unexpected errors** (DB down) are thrown and logged by Next.js. Raw messages never reach the form (docs/errors-and-validation.md). Passwords are never logged.
- **Before writing,** check the beta.32 Credentials, `signIn` and `AuthError` APIs and Zod 4 `refine`/`flattenError` with Context7.

## QA Scenarios
1. **Happy path:** a visitor signs up with a new email and a matching valid password → the account is created, they're signed in and land on `/dashboard`, and the header shows their initial avatar and email.
2. **Auth boundary:** a signed-out visitor opens `/dashboard` → redirected to `/sign-in?callbackUrl=%2Fdashboard`. After signing in they land back on `/dashboard`, and a signed-in user opening `/sign-in` is sent to `/dashboard`.
3. **Validation:** sign-up with mismatched passwords, a 5-character password or an invalid email → inline errors on the right fields, the typed email is kept and no user is created.
4. **Edge case (wrong credentials):** sign-in with a wrong password, or with an email that doesn't exist → the same "Email or password is incorrect" message, and no hint that the account exists.
5. **Edge case (duplicate / rate limit):** sign-up with an existing email → "An account with this email already exists". An 11th sign-in attempt within 15 minutes from one IP → "Too many attempts…".
6. **Edge case (menu):** a signed-in user opens the header menu with the keyboard → focus moves into the menu and Escape closes it and returns focus. Sign out ends the session and the visitor is back on `/`, where the header shows Log in / Sign up free.

## Verification
- `npx tsc --noEmit` and `npm run lint` pass. Don't run `npm run build` while the dev server is running.
- You add `MONGODB_URI` and `AUTH_SECRET` (`npx auth secret`) to `.env.local`.
- With `npm run dev`, walk through the QA scenarios. In MongoDB, check that the user document has `email`, `passwordHash` (scrypt format), no `handle` and timestamps, and that `rate_limits` documents expire.
