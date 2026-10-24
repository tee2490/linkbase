# Plan: Public profile

**Branch:** feat/public-profile
**Goal:** Anyone, signed in or not, can open `/user/<handle>` and see that user's `@handle` and their links in dashboard order. Each link opens in a new tab. An unknown or invalid handle returns a real 404.

**Design:** Claude Design `Public Profile Responsive.dc.html`. It uses the same tokens as `globals.css`, so there are no theme changes.
- **Built:** grey backdrop, a centred `max-w-profile` stage card (rounded top, at least 600px wide) and a wide-screen header with the wordmark and "Sign up free". Inside the card: the `lb` mark plus a Share button, Avatar, `@handle`, the LinkButton stack, a footer and the bottom sign-up nudge.
- **Left out:** the bio (there's no field for it), per-link thumbnails (there's no data for them), the "Report · Privacy" links (those pages don't exist yet) and the nudge's ✕ dismiss. The nudge pill links to `/sign-up` instead.

## Docs followed
- `docs/routing.md` + `docs/auth.md`: `/user/[handle]` sits outside both route groups and is already in `PUBLIC_PATHS` in `src/proxy.ts`, so there's no proxy change. It needs no session, and the page never calls `auth()`.
- `docs/data-fetching.md`: a separate public query, `getPublicProfile(handle)` in `lib/db/queries/profiles.ts`. It is `server-only`, cached with `'use cache'`, `cacheTag("profile:<handle>")` + `cacheTag("links:<userId>")` and `cacheLife("hours")`, and returns public fields only (handle, display name, visible links). It's never the private dashboard query.
- `docs/data-mutations.md`: no new tags to clear. The existing `addLink`/`updateLink`/`deleteLink` already call `updateTag("links:<userId>")`, and `claimHandle` already clears `profile:<handle>`, so edits show up on the profile straight away.
- `docs/auth.md` "Public profile": `handle` is user input, so it's validated with the existing `handleSchema` (`lib/validation/handle.ts`) before any query. If it fails, the page calls `notFound()`.
- `docs/security.md`: titles render as JSX text. Each URL goes through `getSafeHref` (`lib/url.ts`) and links without a safe URL are skipped. Outbound links use a plain `<a target="_blank" rel="noopener noreferrer nofollow ugc">`.
- `docs/ui.md` (App: public profile, LinkButton, Avatar, IconButton float, UrlPill white) + `docs/design-system.md`.
- `docs/architecture.md` / `docs/coding-standards.md`: Server Components by default. The only client leaf is the Share button.

## Files
| Action | Path | Purpose |
|---|---|---|
| Create | `src/lib/db/queries/profiles.ts` | `getPublicProfile(handle)` → `{ handle, displayName, links: { id, title, url }[] } \| null`. It looks the user up with `{ handle }`, then `LinkModel.find({ userId, visible: true }).sort({ position: 1, createdAt: -1 })`, the same order as the dashboard |
| Create | `src/app/user/[handle]/page.tsx` | `export const instant = false`. Awaits `params` → `handleSchema.safeParse` → `getPublicProfile`, and calls `notFound()` **before anything streams** so the status is a real 404 (see Approach). `generateMetadata` sets the title to "@handle · Linkbase" and is `noindex` on 404 automatically. Renders `PublicProfile` |
| Create | `src/app/user/[handle]/not-found.tsx` | "This Linkbase doesn't exist yet", plus a "Claim this username" link to `/sign-up` and a home link, styled on the same backdrop |
| Create | `src/components/profile/public-profile.tsx` | Server component with the design's layout: wide-screen header (`hidden min-[900px]:flex`, wordmark + `Sign up free` link-button), stage card (`bg-surface-profile`, `sm:mt-12 sm:rounded-t-[32px]`, shadow), `lb` mark + `ShareButton`, Avatar 96, `<h1>@handle</h1>`, a `<nav aria-label="Links">` holding a `<ul>` of `LinkButton`s (gap 12–14px), an empty state ("No links yet."), a footer ("More from Linkbase" → `/`) and the fixed bottom gradient nudge (white pill "linkbase.me/you" → `/sign-up`, "Join {handle} on Linkbase today") |
| Create | `src/components/profile/share-button.tsx` | Client: IconButton `float`/`square` 44 with Lucide `Share`. Uses `navigator.share({ url })` when available, otherwise copies the URL to the clipboard and announces "Link copied" in an `aria-live` region |
| Change | `src/components/ui/link-button.tsx` | Add `nofollow ugc` to the external link `rel` (`docs/security.md` "Outbound links") |
| Change | `docs/routing.md` | Add `user/[handle]/not-found.tsx` to the route map, and note why the profile page sets `instant = false` |

## Approach
1. **Query:** one cached, public-only query per handle. Its tags mean any link edit or handle claim refreshes it, and visitors get cached HTML data after the first hit.
2. **A real 404:** with Cache Components, a `notFound()` that runs inside `<Suspense>` happens after streaming starts, so the status stays 200 (bundled `not-found.md` and `streaming.md`). The page therefore awaits `params` and the cached profile *outside* any Suspense, with no `loading.tsx`, and sets `export const instant = false`. That opts this one route out of static-shell validation (bundled `route-segment-config/instant.md`), which would otherwise reject the blocking `params` read. **Trade-off:** no instant App Shell for this route. A miss blocks on one cached DB read, and every hit after that is served from the `use cache` entry. `generateStaticParams` isn't used, because it needs at least one real handle at build time and so a seeded database.
3. **Handle input:** `handleSchema` trims and lowercases, so `/user/Gabbas` resolves the same user as `/user/gabbas`. Reserved names, bad characters and wrong lengths are rejected with `notFound()` before any DB call.
4. **Client code** is just the Share button. Everything else is server-rendered with no JS (`bundle-` rules). Lucide icons are imported by name.

## Out of scope
- Bio, avatar photos, per-link thumbnails, link styles (fill/outline), and social icons.
- Click tracking, the Report and Privacy pages, the nudge dismiss, and hiding the nudge for signed-in owners (that would need the session and make the page dynamic).
- A visibility toggle in the dashboard. `visible: true` is already filtered on, and every link defaults to visible.

## QA Scenarios
1. **Happy path:** user A (`nia`) adds "Portfolio" → `https://example.com` and then "YouTube" in the dashboard. Signed out, open `/user/nia`: "@nia" is shown with "YouTube" above "Portfolio" (dashboard order). Clicking "Portfolio" opens `https://example.com` in a new tab, and the original tab stays on the profile.
2. **Auth boundary:** signed out, `/user/nia` loads with no redirect to `/sign-in`. Signed in as user B, `/user/nia` shows A's links only and no edit controls. A signed-in user without a handle can still view it (no `/onboarding` redirect).
3. **Live update:** A renames "Portfolio" to "Work" on `/dashboard` → reloading `/user/nia` shows "Work" straight away, with no stale cache.
4. **404:** `/user/nobody-here` (no such user), `/user/ab` (too short), `/user/admin` (reserved) and `/user/bad%20name` all show the not-found page with HTTP status 404 (check it in the network panel).
5. **Edge case:** a user with a handle and no links sees "@handle" and "No links yet.". On a 375px viewport the card is full-bleed with no wide header and the nudge doesn't cover the last link. At 1280px the header shows "Sign up free" and the card has rounded top corners.
