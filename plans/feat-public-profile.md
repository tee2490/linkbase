# Public profile

**Branch:** feat/public-profile
**Docs followed:** docs/architecture.md, docs/database.md, docs/auth.md, docs/routing.md, docs/data-fetching.md, docs/security.md, docs/ui.md, docs/design-system.md

## Goal
Anyone can open `/user/[handle]` without signing in. They see that user's `@handle` and links, in the same order as the dashboard, styled like the design's profile card. Each link opens in a new tab. An unknown handle returns a real 404.

Scope: the design's card, top bar (wordmark plus share button with "Link copied"), avatar, `@handle`, link buttons and the "Join {handle} on Linkbase" footer. Left out because there is no data for them yet: the featured course card, bio/display name, per-link brand icons and the Report/Privacy links.

## Files
### Create
- `lib/types/profile.ts`: `PublicProfile = { handle: string; links: { title: string; url: string }[] }`. Public fields only. No user id, email or link ids (docs/auth.md).
- `lib/db/queries/profile.ts`: `import "server-only"`. `getPublicProfile(handle)` with `"use cache"`, `cacheLife("hours")` and `cacheTag(handleTag(handle))`.
  - It first checks the handle against `handleFormatSchema` and returns `null` for invalid input without querying the database.
  - It looks up `UserModel.findOne({ handle }).select("_id handle")`, then adds `cacheTag(profileTag(user._id))`.
  - It loads `LinkModel.find({ userId }).select("title url").sort({ createdAt: -1 })`, the same order as `getMyLinks()`.
  - It returns plain objects (docs/data-fetching.md).
- `app/user/[handle]/page.tsx`: the public page.
  - `generateStaticParams()` returns `[{ handle: "__placeholder__" }]`.
  - The page awaits `params` and `getPublicProfile()` at the top level, with no `<Suspense>`, and calls `notFound()` before streaming. See Notes.
  - `generateMetadata` sets the title to `@{handle} · Linkbase`.
  - It renders `PublicProfileCard`.
- `app/user/[handle]/not-found.tsx`: the same backdrop and card. It says "This page doesn't exist", with "Claim your link" (`ink` Button → `/sign-up`) and "Go home" (→ `/`).
- `components/profile/public-profile-card.tsx` (Server Component): the layout from the design.
  - Ground and card: a `bg-backdrop` page with a centred `max-w-profile` card (`bg-profile-canvas rounded-xl shadow-phone`, padding 24/32/32, at least the full viewport height minus 80px). Below `sm` it goes edge to edge, with no backdrop, radius or shadow (docs/ui.md "Public profile").
  - Top bar: a "Linkbase" wordmark pill (`bg-surface`, links to `/`) and `ShareButton`.
  - Header: a 96px `bg-cobalt text-ink-inverse` initial avatar and `<h1>@handle</h1>` (`text-title-sm`).
  - Links: `<nav aria-label="Links">` holding a `LinkButton external` for each link, 14px apart. With no links: "No links yet."
  - Footer: "Join {handle} on Linkbase" (`surface` Button → `/sign-up`).
- `components/profile/share-button.tsx` (`"use client"`): a `surface` `md` IconButton ("Share this page", lucide `Share`). It copies `window.location.href` with `navigator.clipboard.writeText`, then shows a "Link copied" chip with `role="status"` for 1.8s. The timer is cleared on unmount.

### Change
- `components/ui/link-button.tsx`: new optional `external` prop. When set, it renders through `ExternalLink` (new tab, `rel="noopener noreferrer"`, scheme check) and adds a visually hidden "(opens in a new tab)". The internal and preview uses (`href="#"`) are unchanged.
- `docs/data-fetching.md`: update the `getPublicProfile` example to the real fields (handle and links, no display name, bio or avatar). Document the `generateStaticParams` placeholder, which gives a true 404.
- `docs/routing.md`: `/user/[handle]` has a `not-found.tsx` and the placeholder `generateStaticParams`.
- `docs/ui.md`: `LinkButton` gains the `external` prop.

## Notes
- **Real 404** (`node_modules/next/dist/docs` → `not-found.md` and `loading.md` "Status codes"):
  - A `notFound()` inside `<Suspense>` runs after streaming starts and keeps a 200 status. The docs' Suspense pattern (docs/data-fetching.md) would therefore give a soft 404.
  - With Cache Components, a page can await `params` outside `<Suspense>` only when `generateStaticParams` returns at least one param. The documented placeholder (`__placeholder__`) fails the handle format check, so the build never touches the database.
  - Real handles render on their first request and are then cached. Because the lookup is `"use cache"`, the page has no request-time data.
- **Caching and freshness:** the dashboard's link actions already call `revalidateTag(profileTag(userId), "max")`, and `claimHandle` calls `revalidateTag(handleTag(handle), "max")`. So edits, and a newly claimed handle that used to 404, show up after a background re-render: the first visitor after a change may still see the previous version. No new revalidation is needed.
- **Auth:** `/user/[^/]+` is already in the proxy's public allowlist. The page never reads the session, and `"use cache"` couldn't anyway (docs/data-fetching.md).
- **Safe rendering** (docs/security.md): titles render as JSX text. URLs only go into `href` through `ExternalLink`, which re-checks the `http(s)` scheme on render.
- **Handle case:** the URL handle is lowercased by `handleFormatSchema`, so `/user/Maya-Runs` shows `maya-runs`.
- **Order:** "in order" means the dashboard's order, newest first. There is no reordering feature yet.

## QA Scenarios
1. **Happy path:** a user with a handle and 3 links → signed out, open `/user/{handle}` → status 200, `@handle` heading, 3 link buttons in dashboard order, each `target="_blank"` with `rel="noopener noreferrer"`. Clicking one opens its URL in a new tab.
2. **Auth boundary:** the page loads with no session cookie (no redirect to sign-in) and shows no email, user id or edit controls. A different signed-in user sees the same page.
3. **Not found / invalid handle:** `/user/nobody-here` and `/user/bad.handle!` → HTTP 404 with the "This page doesn't exist" card. "Claim your link" goes to `/sign-up`.
4. **Freshness:** the owner adds, edits and deletes a link in the dashboard → reloading the public page shows each change (within two loads, because of stale-while-revalidate). A handle that returned 404 renders once someone claims it.
5. **Edge case:** a user with no links sees "No links yet." A title `<script>alert(1)</script>` shows as literal text. Share shows "Link copied", and the clipboard holds the page URL.
