# Data Mutations

How Linkbase writes data: every create, update and delete goes through a Server Action that follows the same five steps and returns a typed result. Reads and cache tags are in `docs/data-fetching.md`. Zod schemas and `ActionResult` are defined in `docs/errors-and-validation.md`. Session and ownership rules are in `docs/auth.md`.

## Rules

- **All writes go through Server Actions** (`"use server"`). Never add a Route Handler (`app/api/**/route.ts`) for CRUD. Route Handlers are for webhooks and third-party callbacks only (`docs/routing.md`).
- **Every action runs the same steps, in order:** session → validate → scoped write → revalidate → return.
- **Actions return `ActionResult`** for expected failures (invalid input, not found, handle taken). They never throw for those.
- **Unexpected failures are thrown** (database down, bugs) and reach the nearest `error.tsx`.

## Layout

Actions live next to the route that uses them, in an `actions.ts` file:

```
app/(dashboard)/
  add-links/actions.ts    createLink
  dashboard/actions.ts    updateLink, deleteLink, reorderLinks, updateProfile
```

- One file per route, `"use server"` at the top of the file, named exports only.
- Name actions verb-first in camelCase (`docs/architecture.md`).
- If two routes need the same action, move it to `app/(dashboard)/_actions/` rather than importing across route folders.

## The five steps

```ts
// app/(dashboard)/dashboard/actions.ts
"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/auth/get-session";
import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { profileTag } from "@/lib/db/queries/tags";
import type { ActionResult } from "@/lib/types/action-result";
import { updateLinkSchema } from "@/lib/validation/link";

export async function updateLink(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  // 1. Session first. Redirects to /sign-in if there is none.
  const { userId } = await getSession();

  // 2. Validate with the matching Zod schema.
  const parsed = updateLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { linkId, ...changes } = parsed.data;

  // 3. Write, scoped to the signed-in user's id.
  await connectDb();
  const { matchedCount } = await LinkModel.updateOne({ _id: linkId, userId }, changes);
  if (matchedCount === 0) return { ok: false, formError: "Link not found" };

  // 4. Revalidate the affected views.
  revalidatePath("/dashboard");
  revalidateTag(profileTag(userId), "max");

  // 5. Return a typed result.
  return { ok: true, data: undefined };
}
```

### 1. Check the session

- Call `getSession()` on the first line, before reading any input. Server Actions are public HTTP endpoints, and the proxy doesn't protect them (`docs/auth.md`).
- `userId` always comes from the session. Never read it from form data, arguments or URL params.
- Rate-limited actions (e.g. `createLink`) check the limit right after the session and return a `formError` when it's hit (`docs/security.md`).

### 2. Validate input

- Use the matching schema from `/lib/validation` with `safeParse`, never `parse`. Return failures as `fieldErrors`.
- Validate everything the client sends, including record ids. Use a shared `objectIdSchema` for ids, so a malformed id fails validation instead of throwing a Mongoose `CastError`.
- Use only `parsed.data` after this point, never `formData` or the raw arguments.

```ts
// lib/validation/link.ts (excerpt)
import { isValidObjectId } from "mongoose";

export const objectIdSchema = z.string().refine(isValidObjectId, "Invalid id");

export const updateLinkSchema = linkInputSchema.partial().extend({ linkId: objectIdSchema });
export const deleteLinkSchema = z.object({ linkId: objectIdSchema });
```

### 3. Write, scoped by `userId`

- **Create:** set `userId` from the session. Never spread input that could contain `userId`. Strict schemas drop unknown fields, but `parsed.data` is the real guard.
- **Update and delete:** put `userId` in the filter, never `_id` alone (`docs/database.md`).
- Check the result. `matchedCount === 0` or `deletedCount === 0` means "not found", and the action returns `{ ok: false, formError: "… not found" }` without saying whether the record belongs to someone else.
- Writes that touch several documents (e.g. reordering) use one `bulkWrite` with `userId` in every filter.

### 4. Revalidate affected views

Call `revalidatePath` and/or `revalidateTag` after the write succeeds and before returning. Never revalidate on a failed write.

| Function | Use it for | Notes |
| --- | --- | --- |
| `revalidatePath(path)` | Private dashboard pages (uncached) | In a Server Action it re-renders the current page immediately, so the user sees their change. Use the literal URL, e.g. `"/dashboard"` (route groups aren't part of the path) |
| `revalidateTag(tag, "max")` | Cached public data (`profile:{userId}`, `handle:{handle}`) | Marks the entry stale. The next visitor gets the old page while the new one renders in the background |
| `revalidateTag(tag, { expire: 0 })` | Cached data that must never be served stale | The next request waits for fresh data. Use when stale content would be wrong, e.g. a released handle |

- Always pass the second argument to `revalidateTag`. The one-argument form is deprecated in Next.js 16.
- Use the tag helpers from `/lib/db/queries/tags.ts`, never hand-written strings.
- For a route pattern, pass `type`: `revalidatePath("/user/[handle]", "page")`. Prefer tags over pattern revalidation for the public profile.

What each action revalidates:

| Action | `revalidatePath` | `revalidateTag` |
| --- | --- | --- |
| `createLink`, `updateLink`, `deleteLink`, `reorderLinks` | `/dashboard` | `profile:{userId}`, `"max"` |
| `updateProfile` (no handle change) | `/dashboard` | `profile:{userId}`, `"max"` |
| `updateProfile` (handle changed) | `/dashboard` | `profile:{userId}` and `handle:{old}`, `{ expire: 0 }`; `handle:{new}`, `"max"` |
| `claimHandle` | — (redirects to `/dashboard`) | `handle:{new}`, `"max"` |
| `checkHandle` | — (read-only availability check for `/onboarding`, rate-limited) | — |
| `signUp`, `signInWithPassword`, `signOutUser` | — (they redirect) | — |

Auth actions are the exception to step 1: they run without a session, because they create one. They still validate with Zod, are rate-limited (`docs/security.md`) and return `ActionResult`.

When you add an action, add a row here. When you add a cached query, check which actions must revalidate its tag.

### 5. Return a typed result

```ts
// lib/types/action-result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };
```

- Success returns `{ ok: true, data }`. Return only what the UI needs, such as the new record's id, never the whole document.
- Expected failures return `{ ok: false, ... }`:
  - invalid input → `fieldErrors`
  - not found, or not the user's record → `formError`
  - duplicate `handle` (MongoDB `code 11000`) → `fieldErrors: { handle: ["That handle is taken"] }`
- Don't throw for expected failures, and don't wrap the whole action in `try/catch`. Catch only around the write to turn a known error, like duplicate key, into a result. Rethrow everything else.

```ts
// app/(dashboard)/dashboard/actions.ts (updateProfile excerpt)
try {
  await UserModel.updateOne({ _id: userId }, parsed.data);
} catch (err) {
  if (isDuplicateKeyError(err, "handle")) {
    return { ok: false, fieldErrors: { handle: ["That handle is taken"] } };
  }
  throw err;
}
```

## Calling actions

- **Forms** call actions through `useActionState`, so the action takes `(prevState, formData)` (`docs/errors-and-validation.md`).
- **Buttons outside a form** (delete, reorder) call the action with arguments inside `startTransition`. The arguments are still untrusted input and go through step 2.

```tsx
// components/links/delete-link-button.tsx
"use client";
import { useTransition } from "react";

import { deleteLink } from "@/app/(dashboard)/dashboard/actions";

export function DeleteLinkButton({ linkId }: { linkId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => void (await deleteLink({ linkId })))}
    >
      Delete
    </button>
  );
}
```

- Don't refetch after an action. Revalidation re-renders the Server Components, which pass fresh props down (`docs/data-fetching.md`).
- To navigate after success (e.g. back to `/dashboard` from `/add-links`), call `redirect()` from `next/navigation` after revalidating. `redirect()` throws, so call it outside any `try/catch`.

## Checklist

- [ ] Lives in the route's `actions.ts`, `"use server"`, verb-first name
- [ ] `getSession()` is the first line
- [ ] Input validated with the matching Zod schema, ids included, using `safeParse`
- [ ] Every filter includes `userId`. Creates set `userId` from the session
- [ ] No match returns "not found", not an error
- [ ] Revalidates every affected path and tag, after a successful write only
- [ ] Returns `ActionResult`. Expected failures are returned, not thrown
