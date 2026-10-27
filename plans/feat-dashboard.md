# Dashboard: manage links

**Branch:** feat/dashboard
**Docs followed:** docs/architecture.md, docs/database.md, docs/auth.md, docs/routing.md, docs/data-fetching.md, docs/data-mutations.md, docs/errors-and-validation.md, docs/security.md, docs/ui.md, docs/design-system.md

## Goal
`/dashboard` becomes the link editor from the "Dashboard — editor with live phone preview" design. The user adds a link (title and URL) through a dialog and edits it inline on its row. Deleting goes through a confirm dialog. A live phone preview shows their links as they change. Each change is scoped to the signed-in user and shows up straight away.

Scope (your choice): the top bar, the Content panel with a profile row and the link list, and the live preview. Left out because nothing backs them yet: the upgrade banner, section rail, Links/Shop tabs, show/hide toggles, click counts, "New collection", social icons, "Enhance" and the footer toggle.

## Files
### Create
- `lib/db/models/link.ts`: `Link` model. Fields: `userId` (ObjectId, ref User, required, `index: true`), `title` (String, required, trim, maxlength 100) and `url` (String, required, trim, maxlength 2048). `strict`, `timestamps`. Registered with the `models.Link ??` pattern (docs/database.md).
- `lib/validation/link.ts`:
  - `linkInputSchema`: `title` is trimmed, needs at least 1 character ("Add a title") and at most 100 ("Keep it under 100 characters"). `url` is trimmed, at most 2048 characters ("Keep the URL under 2,048 characters"), and must pass `z.httpUrl("Enter a valid http(s) URL")`.
  - `objectIdSchema`.
  - `updateLinkSchema` = `linkInputSchema.extend({ linkId })`. Every field is required: edit uses the same rules as add, as you asked, unlike the docs' `.partial()` example.
  - `deleteLinkSchema` = `{ linkId }`.
  - The inferred types for each.
- `lib/links/display-host.ts`: pure `displayHost(url)`. Returns the hostname without `www.` (`https://www.strava.com/x` → `strava.com`), or the raw string if it can't be parsed. The row's meta line uses it.
- `lib/types/link.ts`: `LinkItem = { id: string; title: string; url: string }`.
- `lib/db/queries/links.ts`: `import "server-only"`. `getMyLinks()` reads the user id from the session, runs `LinkModel.find({ userId }).sort({ createdAt: -1 }).lean()`, and maps the result to `LinkItem[]`. Uncached (docs/data-fetching.md).
- `app/(dashboard)/dashboard/actions.ts` (`"use server"`), following the five steps in docs/data-mutations.md:
  - `createLink(_prev, formData)`: session → rate limit `create-link:{userId}` 30 per hour → `linkInputSchema` → `LinkModel.create({ ...parsed.data, userId })`.
  - `updateLink(_prev, formData)`: session → `updateLinkSchema` → `updateOne({ _id: linkId, userId }, { $set: { title, url } }, { runValidators: true })`. `matchedCount === 0` returns "Link not found".
  - `deleteLink(input: unknown)`: session → `deleteLinkSchema` → `deleteOne({ _id: linkId, userId })`. `deletedCount === 0` returns "Link not found".
  - After a successful write, each one calls `revalidatePath("/dashboard")` and `revalidateTag(profileTag(userId), "max")`, then returns `ActionResult`.
- `components/ui/icon-button.tsx`: IconButton primitive from docs/ui.md. Variants `muted`, `ghost` and `surface`; sizes `sm` (32px) and `md` (40px). `label` is required and becomes `aria-label`. It forwards ref and button props.
- `components/ui/dialog.tsx`: modal primitive on the native `<dialog>`. It is controlled by an `open` prop: an effect calls `showModal()` or `close()`. It takes `onClose` (Esc, Cancel, or a click on the backdrop) and a `title` rendered as `<h2>` and wired to `aria-labelledby`. Styling: `bg-surface rounded-lg p-8 shadow-phone w-[min(480px,calc(100%-32px))]`, backdrop `bg-scrim`. The native element gives us the focus trap, Esc, and focus returning to the trigger.
- `components/ui/external-link.tsx`: exactly as in docs/security.md (scheme check, `target="_blank" rel="noopener noreferrer"`).
- `components/ui/url-pill.tsx`: a muted pill, `h-icon-btn rounded-full bg-surface-muted text-label`, with the lucide `Link` icon and `linkbase/{handle}`. Display only.
- `components/ui/panel.tsx`: Panel primitive (`bg-surface rounded-lg shadow-card p-10`, `max-sm:p-5`) with a `text-title-sm` `<h2>` title.
- `components/links/link-list.tsx` (`"use client"`): takes `links: LinkItem[]`. It holds `editingId`, so only one row is in edit mode at a time. When there are no links it shows the empty state "No links yet. Add your first one."
- `components/links/link-row.tsx` (`"use client"`), in two modes:
  - **View:** LinkRow look from docs/ui.md (`rounded-lg` with a 1px inset `border` ring, p-4, min-h 72px). It has a 40px thumb with the `Link` icon, a truncated title, and a meta line: `displayHost(url)` as an `ExternalLink` to the URL. Then the `LinkRowMenu`.
  - **Edit (inline):** the same card holds a form with `Input` Title and `Input` URL (`variant="field"`), a hidden `linkId`, and Cancel / Save buttons (`app`, `sm`). It uses `useActionState`, with a wrapper that leaves edit mode when the result is `ok`. Errors show inline, and Esc cancels.
- `components/links/link-row-menu.tsx` (`"use client"`): a ⋮ `ghost` IconButton ("More options for {title}") that opens a menu with Edit and Delete. It uses the same keyboard pattern as `components/auth/user-menu.tsx`: arrow keys, Home/End, Esc returns focus to the trigger, and a click outside closes it. Delete opens `DeleteLinkDialog`.
- `components/links/add-link-dialog.tsx` (`"use client"`): a full-width "Add" button (`app`, `sm`, `Plus` icon) that opens a `Dialog` titled "Add a link". Inside: a Title input, a URL input with `type="url"` and placeholder `https://`, a `FormError`, and Cancel / "Add link". It uses `useActionState(createLink)` through a wrapper. On `ok` it closes and resets, so the new link is at the top of the list. On failure the dialog stays open with inline errors and the values kept.
- `components/links/delete-link-dialog.tsx` (`"use client"`): `Dialog` titled "Delete this link?", with the text "“{title}” will be removed from your page." and Cancel / Delete buttons. Delete calls `deleteLink({ linkId })` inside `startTransition`, shows "Deleting…" while pending, and closes on `ok`. A `formError` shows in the dialog.
- `components/links/phone-preview.tsx`: the live preview. "Live preview" in mono caption, then a phone frame per docs/ui.md (10px `ink-app` bezel, 44px radius, `shadow-phone`, screen `bg-profile-canvas` 34px radius, 620px tall with scrolling). Inside: orchid initial avatar, `@handle`, and a `LinkButton` for each link title, `aria-hidden` and `inert` like `ProfilePreview`. With no links it shows "Add a link to show it here." It is a Server Component that receives `handle` and `links`.

### Change
- `app/(dashboard)/dashboard/page.tsx`: keeps a sync page with a `<Suspense>` skeleton around an async `DashboardEditor`. The editor runs `Promise.all([requireOnboardedUser(), getMyLinks()])` and renders the grid from the design:
  - `<main>`: Panel "Content", then the profile row (64px orchid initial, the handle, and a `text-muted-app` line `linkbase/{handle}`), then `AddLinkDialog`, then `LinkList`.
  - `<aside aria-label="Live preview of your page">`: `PhonePreview`.
  - Columns: `md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_380px]`, preview `md:sticky md:top-6`. On mobile everything stacks, with the preview below on `bg-profile-canvas`.
- `app/(dashboard)/layout.tsx`: the background becomes `bg-surface`, as in the design. The top bar becomes: wordmark on the left, then `UrlPill` centred (inside `<Suspense>`, reading the handle with `getCurrentUser()`; hidden when there's no handle), then `HeaderAccount` on the right. Below `sm` the pill wraps onto its own row.
- `components/ui/button.tsx`: add an optional `icon` slot (a leading node, 8px gap), as in docs/ui.md. Add the `muted` variant if `Cancel` needs it.
- `app/globals.css`: add a `--scrim: rgba(20, 20, 20, 0.45)` token and `--color-scrim`.
- `docs/design-system.md`: document the scrim token, which the docs list as TBD.
- `docs/ui.md`: add the Dialog component (native `<dialog>`, scrim, focus behaviour) and the row ⋮ menu. Mark menu/dialog focus management as defined.
- `docs/data-mutations.md`: the Layout section says the link actions all live in `dashboard/actions.ts`, because adding happens in a dialog.
- `docs/routing.md`: remove the planned `/add-links` route, since adding is a dialog on `/dashboard`.

## Notes
- **Ownership.** Every write filters on `userId` from the session. `linkId` is validated with `objectIdSchema`, so a bad id fails validation instead of throwing a `CastError`. A miss returns "Link not found" without saying whether the link exists (docs/auth.md, docs/database.md).
- **"Appears immediately".** `revalidatePath("/dashboard")` in the action re-renders the page in the same round trip, so the new or edited link arrives as fresh props. The dialog or edit mode closes when the result is `ok`. No client refetch or optimistic copy (docs/data-fetching.md).
- **Revalidation.** `profile:{userId}` is tagged now, so the future `/user/[handle]` page refreshes too (docs/data-mutations.md table, which already lists these rows).
- **User content** (docs/security.md): `z.httpUrl()` rejects `javascript:`, `data:` and `ftp:`. Titles render as JSX text. The only outbound link is through `ExternalLink`. The preview's LinkButtons are inert and point to `#`, never to user URLs.
- **Where actions live.** `createLink` sits in `dashboard/actions.ts`, not `add-links/actions.ts` as the docs sketch, because the add form is a dialog on `/dashboard`. The docs will be updated to match.
- **Performance** (vercel `async-parallel`, `server-serialization`): the user and links load in parallel, and only `{ id, title, url }` and the handle cross to the client. The client components (list, rows, menus, dialogs) sit below the Server Component page.
- **Menu.** A second menu with the same keyboard handling as `UserMenu`. Extracting a shared `ui/menu` is left for when a third one appears.

## QA Scenarios
1. **Happy path (add):** an onboarded user clicks Add → fills "Training plans" and `https://mayaruns.com/plans` → Add link → the dialog closes, the row appears at the top of the list with meta `mayaruns.com`, and it shows in the phone preview. The DB has the link with this user's `userId`.
2. **Happy path (edit + delete):** ⋮ → Edit → change the title to "Training plans 2026" → Save → the row and preview update, and the DB is updated. Then ⋮ → Delete → the confirm dialog opens. Cancel keeps the link. Delete removes it from the list, the preview and the DB.
3. **Auth boundary:** a signed-out visit to `/dashboard` → `/sign-in?callbackUrl=%2Fdashboard`. User B submits the edit form, and then a delete, with user A's `linkId` (changed in the DOM) → "Link not found", and A's link is unchanged in the DB.
4. **Validation:** in the add dialog: an empty title, 101 characters, an empty URL, `javascript:alert(1)`, `ftp://example.com` and `notaurl` → inline errors with exact messages, the dialog stays open and nothing is saved. Clearing the title in inline edit and saving → "Add a title", and the old title stays in the DB.
5. **Edge case:** a new user sees "No links yet. Add your first one." and the preview's empty message. A title `<script>alert(1)</script>` is saved and shows as literal text, with no script running and no console errors.
