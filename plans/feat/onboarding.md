# Plan: Onboarding — claim a username

**Branch:** feat/onboarding
**Goal:** Right after sign-up, the user picks a unique username (3–30 chars, `a-z 0-9 - _`) on the Welcome page from the design. Until they have one, every signed-in route sends them to `/onboarding`. Once it's saved they land on `/dashboard`, and the username becomes their `/user/[handle]` URL.

## Docs followed
- `docs/routing.md`: new routes are protected by default. `/onboarding` stays off `PUBLIC_PATHS`, and only Server Actions write data.
- `docs/auth.md`: proxy as the first gate, `requireUserId()` in every action, a session that holds almost nothing.
- `docs/database.md`: `handle` is optional, with a **partial unique index** (already in place). Validation lives in the schema as well.
- `docs/data-mutations.md` + `docs/errors-and-validation.md`: the five steps, a shared Zod schema, `ActionResult`, and duplicate key 11000 → field error.
- `docs/data-fetching.md`: `server-only` queries in `lib/db/queries/`, and clear `profile:<handle>` after a handle write.
- `docs/ui.md` "App: welcome / onboarding", `docs/design-system.md`: two-column layout with a live preview. Reuse `Input`, `Button`, `Avatar`, `LinkButton`.

## Files
| Action | Path | Purpose |
|---|---|---|
| Create | `src/lib/validation/handle.ts` | `handleSchema` (trim, lowercase, 3–30 chars, `/^[a-z0-9_-]+$/`, not a reserved name), `HANDLE_PATTERN`, `RESERVED_HANDLES` (admin, linkbase, support, help, api, dashboard, onboarding, settings, sign-in, sign-up, user …), `handleCandidates(base)` (a pure function that turns a display name into sanitized candidates like `nia`, `nia-brooks`, `nia_7`) |
| Change | `src/lib/db/models/user.ts` | `handle`: add `minlength: 3` and `match: HANDLE_PATTERN`. Keep the existing partial unique `{ handle: 1 }` index, which serves `/user/[handle]` lookups |
| Change | `src/lib/db/queries/users.ts` | `getOnboardingState(userId)` → `{ displayName, handle }`, and `findAvailableHandles(candidates, limit)` (one `$in` query, returns the free ones) |
| Change | `src/lib/auth/config.ts` | Export `unstable_update`. The JWT carries a boolean `onboarded`: while it's falsy, the `jwt` callback re-reads `handle` from the DB (self-healing). On `trigger === "update"` it re-reads too, and never trusts the client payload. The `session` callback exposes `user.onboarded` |
| Change | `src/lib/auth/next-auth.d.ts` | `Session.user: { id: string; onboarded: boolean }` and a `JWT.onboarded` augmentation |
| Change | `src/proxy.ts` | Signed in and not onboarded → any non-public path other than `/onboarding` redirects to `/onboarding`. Onboarded + `/onboarding` → `/dashboard`. Guest-only paths send signed-in users to `/onboarding` or `/dashboard` based on the flag |
| Change | `src/app/(auth)/actions.ts` | `signUp` signs in with `redirectTo: "/onboarding"` (skips a proxy hop) |
| Create | `src/app/onboarding/page.tsx` | A static shell (wordmark, heading, copy) plus a `<Suspense>` section that runs `requireUserId()` → `getOnboardingState`. If a handle is already set → `redirect("/dashboard")`. Prefills the first available candidate. `metadata` title "Welcome · Linkbase" |
| Create | `src/app/onboarding/actions.ts` | `checkHandleAvailability(handle)` → `{ available, suggestions[] }` (session, Zod, rate limit 60/min per user via `checkRateLimit`). `claimHandle(_prev, formData)`: session → Zod → `updateOne({ _id: userId, handle: { $exists: false } }, { $set: { handle } }, { runValidators: true })`. 11000 → `fieldErrors.handle: ["That username is taken"]`. 0 matched → already onboarded. Then `updateTag(\`profile:${handle}\`)`, `unstable_update({})`, `redirect("/dashboard")` |
| Create | `src/components/onboarding/onboarding-flow.tsx` | Client: holds the `username` state and lowercases it as you type. A debounced (~400 ms) availability check in `startTransition`, with status `empty/short/invalid/checking/available/taken`. Suggestion chips. `useActionState(claimHandle)` form with `Input prefix="linkbase.me/"` and a full-width lg `Button` that's disabled unless available or pending. Errors use `aria-invalid`/`aria-describedby`, and status sits in `aria-live="polite"` |
| Create | `src/components/onboarding/profile-preview.tsx` | Presentational right column: tangerine panel, a rotated butter card with `Avatar` (the user's display name), `@{handle or "yourname"}`, 3 static `LinkButton`s, decorative social circles (Lucide `Youtube`/`Instagram`/`Music2`) and a white URL pill. `role="img"` with a descriptive label |
| Change | `docs/routing.md`, `docs/auth.md`, `docs/database.md` | Add `/onboarding` to the route map. Document the onboarding gate and the `onboarded` claim. Document the handle rules |

## Approach
1. **Validation first**: one `handleSchema` shared by the form, both actions and (later) the `/user/[handle]` param check. The Mongoose `match`/`minlength` rules are the second line of defence.
2. **Gate = JWT flag, not a DB hit per request.** The proxy reads `req.auth.user.onboarded`. A falsy flag makes the `jwt` callback re-check the DB (an indexed `_id` read, only for not-yet-onboarded users), so stale cookies can't loop between `/onboarding` and `/dashboard`. After claiming, `unstable_update` rewrites the cookie. **This deviates from the documented "session holds only the user id" rule**, but the extra field is a non-sensitive boolean, and I'll update `docs/auth.md`.
3. **Defence in depth**: the page redirects to `/dashboard` itself if the DB has a handle. `claimHandle` only writes when `handle` doesn't exist yet, so this flow can't overwrite a handle (changing it later is a settings feature).
4. **Uniqueness**: the existing partial unique index is the source of truth. The live check is a convenience only, and a race shows up as the 11000 field error.
5. **Design deltas**: the design allows `.`, but the requirement doesn't, so dots are rejected (the requirement wins). The layout uses `flex flex-wrap`, so the preview stacks under the form on mobile. I'll keep the "By continuing…" consent line as written. No new `UrlPill`/`IconButton` primitives yet: the preview uses decorative inline markup.
6. **Perf** (vercel rules): the client boundary stays at `OnboardingFlow`. The page shell is static and only the user-dependent part streams behind `<Suspense>`. Lucide icons are imported per name.

## Out of scope
- Changing a username after onboarding (settings), and the `/user/[handle]` page itself.
- Display name, avatar and bio editing. OAuth sign-ups.

## Open questions
- Is the reserved-name list above OK? Should it also block route-like words you plan to use later?

## QA Scenarios
1. **Happy path:** sign up as a new user → land on `/onboarding` with a prefilled available name. Type `nia_brooks-1` → "linkbase.me/nia_brooks-1 is available" → Continue → `/dashboard`. Reloading `/onboarding` now redirects to `/dashboard`.
2. **Auth boundary:** signed out, open `/onboarding` → `/sign-in?callbackUrl=/onboarding`. Signed in without a handle, open `/dashboard` → redirected to `/onboarding`.
3. **Validation:** type `ab` → "Use at least 3 characters"; `Nia Brooks!` → invalid-characters error; a 31-character name is rejected; `admin` → "not available". Continue stays disabled throughout.
4. **Duplicate:** user B types user A's handle → "That username is taken" plus 3 clickable suggestions. Clicking one fills it in and shows it as available.
5. **Edge (race/stale):** two tabs claim the same free handle → the second gets the field error, not a crash. An already-onboarded user posting `claimHandle` again is sent to `/dashboard` and the handle doesn't change.
