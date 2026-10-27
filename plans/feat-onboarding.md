# Onboarding: pick your username

**Branch:** feat/onboarding
**Docs followed:** docs/architecture.md, docs/database.md, docs/auth.md, docs/routing.md, docs/data-fetching.md, docs/data-mutations.md, docs/errors-and-validation.md, docs/security.md, docs/ui.md, docs/design-system.md

## Goal
Right after sign-up, the user picks a unique username (their public `handle`) on a welcome screen, which follows the "Welcome — pick your handle" design. Until they have one, every signed-in page sends them to `/onboarding`. After they save it, they go to `/dashboard`.

## Files
### Create
- `lib/validation/handle.ts`: `handleSchema` (trim, lowercase, 3–30 chars, `/^[a-z0-9_-]+$/`, not in `RESERVED_HANDLES`), plus `claimHandleSchema` (`{ handle }`) and the inferred types. `RESERVED_HANDLES`: admin, linkbase, support, help, settings, api, dashboard, onboarding, sign-in, sign-up, user. One schema shared by the client (instant format errors) and the server.
- `lib/validation/handle.test.ts`: covered later by `write-tests` (listed here so the file is accounted for).
- `lib/handles/suggest-handles.ts`: pure `handleSuggestionCandidates(handle)`. It returns variants such as `${h}hq`, `the${h}`, `${h}_official`, `${h}-links` and `${h}1`, keeping only those that pass `handleSchema`.
- `lib/db/queries/tags.ts`: `profileTag(userId)` and `handleTag(handle)`, as in docs/data-fetching.md. This is the first use of the tags.
- `app/onboarding/page.tsx`: `/onboarding`. A sync page with metadata ("Pick your username · Linkbase") and a `<Suspense>` skeleton around an async `OnboardingGate`. The gate runs `getCurrentUser()`. With no user it redirects to `/sign-in?session=expired`. If the user already has a handle, it redirects to `/dashboard`. Otherwise it renders `<ClaimHandle />`.
- `app/onboarding/actions.ts`:
  - `claimHandle(_prev, formData)`: session → `claimHandleSchema.safeParse` → `UserModel.updateOne({ _id: userId, handle: { $exists: false } }, { $set: { handle } })`. A duplicate key (`isDuplicateKeyError(err, "handle")`) returns `fieldErrors.handle = ["That username is taken"]`. `matchedCount === 0` means the handle is already set, so it redirects to `/dashboard`. On success it calls `revalidateTag(handleTag(handle), "max")` and then `redirect("/dashboard")`.
  - `checkHandle(input: unknown)`: session → rate limit `check-handle:{userId}` (120 per 10 min; over the limit returns a `formError`) → `handleSchema.safeParse` → one `UserModel.find({ handle: { $in: [handle, ...candidates] } }).select("handle").lean()`. Returns `ActionResult<{ available: boolean; suggestions: string[] }>`, with up to 3 free suggestions when the name is taken. A reserved name comes back as taken (with suggestions), not as a format error.
- `components/onboarding/claim-handle.tsx` (`"use client"`): the screen. It holds the `handle` state and lowercases and strips spaces as the user types. Format is checked live with `handleSchema`, and `checkHandle` runs 300ms after typing stops (stale responses are ignored). Saving goes through `useActionState(claimHandle)`. It renders the form half and passes `handle` to the preview half.
  - Form half: "Linkbase" wordmark, H1 "Welcome to Linkbase!", the subcopy, and `Input` (`variant="field"`, `prefix="linkbase/"`, label "Your username").
  - Below the field, one of three things:
    - the hint "3–30 characters: lowercase letters, numbers, hyphens and underscores." while the field is empty;
    - a `text-success` check line, "linkbase/x is available";
    - "Try one of these:" with suggestion chips (`h-control-xs rounded-full bg-surface-muted`) that fill the field when clicked.
  - Then an inline "Your page: linkbase/x" pill (below `lg` only), and a full-width Continue button (`variant="app" size="md"`, "Saving…" while pending). Continue is disabled until the format is valid and the name isn't known to be taken.
- `components/onboarding/handle-preview.tsx`: the cobalt "Live preview" panel. It has the decorative lime, orchid and forest shapes (`aria-hidden`), a profile card (orchid initial avatar, `@handle`, "Your bio goes here", three `LinkButton`s) and a floating `linkbase/handle` URL pill with the lucide `Link` icon. It falls back to `yourname` when the handle is empty or invalid. Decorative and `inert`, like `ProfilePreview`.

### Change
- `lib/db/models/user.ts`: keep `handle: { unique: true, sparse: true, lowercase: true, trim: true }`, because the unique sparse index is the lookup index `/user/[handle]` will use. Add `minlength: 3, maxlength: 30, match: /^[a-z0-9_-]+$/` as a second guard. Never write `handle: null`: sparse only skips missing fields, so `null` values would collide.
- `lib/auth/get-current-user.ts`: select `email handle`, and add `handle: string | null` to `CurrentUser`.
- `lib/auth/require-onboarded-user.ts` (new helper, next to `get-current-user.ts`): `requireOnboardedUser()` calls `getCurrentUser()`. With no user it redirects to `/sign-in?session=expired`. With no handle it redirects to `/onboarding`. Otherwise it returns the user with `handle: string`.
- `app/(dashboard)/dashboard/page.tsx`: `DashboardWelcome` uses `requireOnboardedUser()` instead of its inline check.
- `app/(auth)/sign-up/actions.ts`: `redirectTo: "/onboarding"`, which saves a hop through `/dashboard`.
- `components/ui/button.tsx`: add the `app` variant (`rounded-full bg-ink-app text-ink-inverse`) and the `md` size (`h-control-md px-6`, 18/24 · 500) from docs/ui.md. Check that `h-control-md` exists in `globals.css` and add it if it doesn't.
- `docs/auth.md`: add `/onboarding` to the route table and document the onboarding gate (`requireOnboardedUser()` in every `(dashboard)` page).
- `docs/routing.md`: add `/onboarding` to the route map.
- `docs/data-mutations.md`: add revalidation rows for `claimHandle` and `checkHandle`.
- `docs/security.md`: add the `check-handle` rate-limit row.
- `docs/database.md`: add the handle format rule.

## Notes
- **Where the gate lives.** Pages check, not the proxy or the layout. The proxy reads only the JWT, and the session holds only the user id (docs/auth.md: "Only put the user id in the session"; "Don't check auth in `layout.tsx`"). So the proxy keeps redirecting signed-out users, and every `(dashboard)` page calls `requireOnboardedUser()`. Today that is only `/dashboard`, and docs/auth.md will require it for new pages. Sign-in still lands on `/dashboard`, which forwards to `/onboarding` while the handle is missing. `/onboarding` is protected by default because it isn't in the public allowlist.
- **Route placement.** `app/onboarding/` sits outside `(dashboard)`, because the screen has its own full-bleed layout with no app header (docs/routing.md: one route group per shell).
- **Set-once write.** The `{ handle: { $exists: false } }` filter makes `claimHandle` set the handle only once. Changing it later belongs to a future `updateProfile`. The unique index is what decides a race, and the duplicate-key error becomes a `fieldError` (docs/data-mutations.md, step 5).
- **`checkHandle` is a read-only Server Action**, which departs from "reads happen in Server Components". Live availability needs a client-triggered round trip, and docs/routing.md rules out a Route Handler for this. It only ever returns booleans and handle strings, so no other user's data leaks (the same exception as the public profile lookup by `handle`). It is rate-limited per user, so it can't be used to enumerate handles cheaply.
- **Revalidation.** `claimHandle` uses `handleTag(new)` with `"max"`, per the `updateProfile` row in docs/data-mutations.md, so a cached 404 for that handle clears once `/user/[handle]` exists. Nothing on `/dashboard` is cached, so the redirect is enough there.
- **Departures from the design:**
  - Dots are not allowed and hyphens are, per your rule.
  - "Step 1 of 3" is dropped, since there is only one step.
  - The Terms/Privacy line is dropped, since no such pages exist.
  - The label reads "Your username".
  - Container queries become Tailwind `lg:` (1024px) and `sm:` breakpoints. At desktop the form and the cobalt preview sit side by side. Below `lg` the form is a card on cobalt with the preview below it. Below `sm` it is a full-width sheet.
- **Performance** (vercel rules `async-suspense-boundaries`, `server-serialization`): the page shell is static, and the user read streams inside `<Suspense>`. Only the client component ships JS, and it receives no props beyond what it needs.
- Out of scope: carrying the landing page's `?handle=` through sign-up into this field.

## QA Scenarios
1. **Happy path:** a new user signs up → lands on `/onboarding` → types `maya-runs` → sees "linkbase/maya-runs is available" and the preview updates → Continue → lands on `/dashboard`, and the user record has `handle: "maya-runs"`.
2. **Auth boundary:** a signed-out visit to `/onboarding` → `/sign-in?callbackUrl=/onboarding`. A signed-in user without a handle who opens `/dashboard` → redirected to `/onboarding`. A user with a handle who opens `/onboarding` → redirected to `/dashboard`.
3. **Validation:** typing `ab`, `my.name`, `Hello World` (shown as `helloworld`) or 31 characters → an inline error for the bad ones and Continue disabled. A direct `claimHandle` call with `ab` → `fieldErrors.handle`, and nothing is saved.
4. **Taken or reserved:** a handle another user owns, or `admin` → "taken" message plus up to 3 suggestion chips → clicking one fills the field and shows "available".
5. **Edge case (race):** two accounts submit the same free handle at nearly the same time → one saves, the other gets "That username is taken" inline and its record keeps no handle.
