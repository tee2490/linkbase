# Plan: Dashboard — manage links

**Branch:** feat/dashboard
**Goal:** On `/dashboard` a signed-in user sees their links. They can add one through a dialog (title + URL), edit a row inline, and delete one after confirming. A live phone preview beside the list shows the links as their profile will. Every change shows up right away.

**Design:** Claude Design `Dashboard.dc.html`. Its tokens match `globals.css` already, so there are no new theme tokens. Scope is **links + preview**. The rail, Shop tab, Enhance, New collection, socials, visibility switch, click counts, footer toggle and announcement bar are left out, so the page has no dead controls. Row actions sit in the design's ⋮ kebab, which opens a menu with Edit and Delete.

## Docs followed
- `docs/architecture.md`: Server Components by default. Client leaves (`add-link-dialog`, `link-row`) live in `components/links/` and primitives in `components/ui/`. Files are kebab-case and actions are verb-first.
- `docs/database.md`: `Link` model with `strict`, `timestamps` and an index on `userId`. Every filter includes `userId`, and documents are looked up with `{ _id, userId }`, never `findById`.
- `docs/auth.md` + `docs/data-mutations.md`: every action runs session → Zod → scoped write → `updateTag`, and returns `ActionResult`. A write that matches nothing returns "Link not found".
- `docs/errors-and-validation.md`: one shared `linkInputSchema`, `safeParse`, field errors shown inline with `aria-invalid`/`aria-describedby`, and `error.tsx` for anything unexpected.
- `docs/data-fetching.md`: `server-only` `getLinksForUser` returns DTOs, cached with `'use cache'` + `cacheTag("links:<userId>")` so that `updateTag` refreshes the list after each write.
- `docs/security.md`: `addLink` limited to 30 per hour per user. Titles render as JSX text, and URLs are re-checked for http/https before going into an `href`, with `target="_blank" rel="noopener noreferrer nofollow ugc"`.
- `docs/ui.md` (LinkCard, IconButton, Input, LinkButton, Avatar, App: dashboard) and `docs/design-system.md`: tokens and specs.
- `docs/routing.md`: actions sit next to the route, and `/dashboard` is already protected by `proxy.ts` with no change needed.

## Files
| Action | Path | Purpose |
|---|---|---|
| Create | `src/lib/validation/link.ts` | `linkInputSchema`: `title` trimmed, 1–100 chars ("Enter a title" / "Keep it under 100 characters"). `url` trimmed, at most 2048 chars, then piped into `z.url({ protocol: /^https?$/ })` ("Enter a valid http(s) URL"). `linkIdSchema` validates an ObjectId hex string. Exports `LinkInput` |
| Create | `src/lib/url.ts` | Pure helpers: `getSafeHref(url)` returns the URL only if it parses as http/https, otherwise `null`. `getDomain(url)` returns the hostname without `www.` |
| Create | `src/lib/db/models/link.ts` | `userId` (ObjectId, required), `title` (trimmed, maxlength 100), `url` (required, maxlength 2048), `position` (min 0), `visible` (default true, for the future public profile). Compound index `{ userId: 1, position: 1 }`. Registered with `models.Link ?? model(...)` |
| Create | `src/lib/db/queries/links.ts` | `getLinksForUser(userId)` runs `'use cache'`, `cacheTag(\`links:${userId}\`)` and `cacheLife("hours")`, then `find({ userId }).sort({ position: 1 }).lean()`. Returns `LinkItem` DTOs `{ id, title, url }` |
| Create | `src/app/(dashboard)/dashboard/actions.ts` | `addLink(_prev, formData)`: session, rate limit `link-create:<userId>` (30/h → formError), Zod, `updateMany({ userId }, { $inc: { position: 1 } })`, `create({ ...data, userId, position: 0 })` so new links go on top, `updateTag`. `updateLink(_prev, formData)`: session, Zod on `linkId` + title + URL, `updateOne({ _id, userId }, …, { runValidators: true })`, a 0 match returns "Link not found", `updateTag`. `deleteLink(linkId)`: session, Zod, `deleteOne({ _id, userId })`, a 0 deleted returns not found, `updateTag` |
| Change | `src/app/(dashboard)/dashboard/page.tsx` | Replace the placeholder. Static shell (`SiteHeader`, layout grid) plus a `<Suspense>` section that runs `requireUserId()` and then `Promise.all([getOnboardingState, getLinksForUser])` to render the editor and preview |
| Create | `src/app/(dashboard)/error.tsx` | Client error boundary: "Something went wrong", the digest, and a Try again button that calls `retry()` |
| Create | `src/components/ui/icon-button.tsx` | IconButton from `docs/ui.md` (soft/float/plain/dark, circle/square, required `label`, focus ring) |
| Create | `src/components/ui/dialog.tsx` | Native `<dialog>` wrapper (`open` → `showModal`/`close`, `onClose`, a title wired to `aria-labelledby`). The modal gives focus trapping and Esc for free. Styled `rounded-xl shadow-pop` like the design's "Add link" card |
| Change | `src/components/ui/input.tsx` | Add an `invalid` prop that turns the ring `ring-2 ring-danger`, per the `docs/ui.md` Input error state |
| Create | `src/components/links/link-editor.tsx` | Server: avatar 64 + display name, the `grid-cols-2` row becomes one full-width **Add** button (the client dialog trigger), then the row stack (`gap-3.5`), or an empty state ("No links yet. Add your first one.") |
| Create | `src/components/links/add-link-dialog.tsx` | Client: Add button plus `Dialog` with a `useActionState(addLink)` form (Title and URL labelled inputs, field errors, formError). Closes and resets on success |
| Create | `src/components/links/link-row.tsx` | Client: LinkCard styles (48px thumb with Lucide `Link2`, title, domain meta). The ⋮ menu (Edit / Delete, `aria-label="More options for {title}"`, closes on Esc or outside click). **Edit** swaps the row for an inline form (`useActionState(updateLink)`, hidden `linkId`, Save/Cancel, autofocus title, Esc cancels). **Delete** opens a confirm `Dialog` ("Delete “{title}”? This can't be undone.", Cancel / Delete) that calls `deleteLink` in `startTransition` and shows formError if the delete fails |
| Create | `src/components/links/phone-preview.tsx` | Server: the design's 300×620 phone (`rounded-[36px] bg-surface-profile shadow-panel`), Avatar 76, name, `LinkButton` stack using `getSafeHref`, or "Your links will appear here." Shown at `lg` and up, sticky beside the editor |
| Change | `docs/routing.md`, `docs/database.md` | Add `dashboard/actions.ts` (addLink, updateLink, deleteLink) to the route map. Note the `{ userId, position }` index and that new links take position 0 |

## Approach
1. **Validation:** a single `linkInputSchema` is shared by add and edit, so the rules match exactly. The Mongoose `maxlength`/`required` checks are the second line of defence. There's no "https://" auto-prefix, because the requirement asks for a valid http/https URL as typed.
2. **Actions:** they follow the five steps in `docs/data-mutations.md`. `linkId` is validated with Zod before any query. `userId` always comes from `requireUserId()`, never from the form.
3. **"Appears immediately":** each action calls `updateTag(\`links:${userId}\`)`. Because `getLinksForUser` is tagged, Next.js re-renders the page with fresh props in the same round trip, so there's no client fetch and no optimistic state to keep in sync. The tag also covers the future public profile.
4. **Client boundaries stay small:** the page, editor and preview are Server Components. Only the add dialog and each row are client code. Lucide icons are imported by name (bundle rules), and the queries run in parallel with `Promise.all` (`async-parallel`).
5. **Layout:** `SiteHeader` stays because it holds sign-out. Below it, a white sheet with `grid lg:grid-cols-[minmax(0,560px)_auto] gap-10 justify-center`: the editor panel (`rounded-[28px] shadow-panel p-8`) and the sticky phone preview. On small screens it collapses to a single column with no preview.

## Out of scope
- The rail, the Header/Design/Settings sections, the Shop tab, Enhance, collections, social icons, the announcement bar and the footer toggle.
- The visibility switch (the field exists and defaults to true), click counts, reordering and drag.
- The public `/user/[handle]` page, and the mobile preview toggle.

## QA Scenarios
1. **Happy path:** on `/dashboard`, click Add → enter "My portfolio" + `https://example.com` → Add. The dialog closes and the row appears at the top with "example.com", plus a matching button in the phone preview. Edit it through ⋮ → Edit to "Portfolio" → Save: the row and preview update. Delete it through ⋮ → Delete → Delete: the row is gone, and it stays gone after a reload.
2. **Auth boundary:** signed out, open `/dashboard` → redirected to `/sign-in?callbackUrl=/dashboard`. Signed in as user B, call `updateLink`/`deleteLink` with user A's link id → "Link not found", and A's link is unchanged.
3. **Validation:** add with an empty title → "Enter a title". A 101-char title → "Keep it under 100 characters". `example.com`, `ftp://x.com` or `javascript:alert(1)` as the URL → "Enter a valid http(s) URL". Inline edit with the same bad values shows the same errors and keeps the row in edit mode.
4. **Confirm/cancel:** ⋮ → Delete → Cancel (or Esc) → the link is still there. ⋮ → Edit → Cancel → the original values come back.
5. **Edge case:** a new user with no links sees the empty-state text in both the editor and the preview. The 31st add within an hour shows "You're adding links too fast. Try again later." and nothing is saved.
