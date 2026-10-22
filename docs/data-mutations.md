# Linkbase Data Mutations — Server Actions

How every write works, step by step. All paths are under `src/`. Reads are in `docs/data-fetching.md`; validation and error details are in `docs/errors-and-validation.md`.

---

## Rules

- **All writes go through Server Actions.** Never through Route Handlers. `app/api/` is only for webhooks and third-party callbacks (see `docs/routing.md`).
- **Every action follows the same five steps, in order:** check the session, validate input, scope the query, write, refresh affected views.
- **Actions return a typed result** with either data or validation errors. They don't throw for expected failures.
- **Unexpected failures are thrown** and handled by `error.tsx` (see `docs/errors-and-validation.md`).

## Where actions live

- In an `actions.ts` file next to the route that uses them, for example `app/(dashboard)/add-links/actions.ts`.
- Or, when several routes share them, in the feature folder, for example `components/links/actions.ts`.
- Every file starts with `"use server"`. Names are verb-first: `addLink`, `updateLink`, `reorderLinks`, `deleteLink`, `updateProfile` (see `docs/architecture.md`).

## The five steps

```ts
// src/app/(dashboard)/add-links/actions.ts
"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import type { ActionResult } from "@/lib/types/action-result";
import { linkInputSchema, type LinkInput } from "@/lib/validation/link";

export type AddLinkResult = ActionResult<{ id: string }, keyof LinkInput>;

export async function addLink(_prev: AddLinkResult, formData: FormData): Promise<AddLinkResult> {
  // 1. Session
  const userId = await requireUserId();

  // 2. Validate
  const parsed = linkInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  // 3 + 4. Scope and write
  await connectToDatabase();
  const link = await LinkModel.create({ ...parsed.data, userId });

  // 5. Refresh
  updateTag(`links:${userId}`);

  return { status: "success", data: { id: link._id.toString() } };
}
```

### 1. Check the session

Call `requireUserId()` first, before anything else. It reads the session on the server and throws if there isn't one. A page being protected doesn't protect the actions it uses, since every action is a public POST endpoint (see `docs/auth.md`).

### 2. Validate input

Parse every input with the matching Zod schema from `lib/validation/` using `safeParse`. Return validation failures as a result; don't throw. Use only `parsed.data` from here on.

Actions called with arguments instead of a form validate those too:

```ts
const deleteLinkSchema = z.object({ linkId: objectIdSchema }); // objectIdSchema in lib/validation/common.ts
```

### 3. Scope the query

The filter of every write includes the session's `userId`. Look documents up with `{ _id, userId }`, never by `_id` alone, and set `userId` from the session on create. If a scoped update or delete matches nothing, return a "not found" result, so a user can't tell whether another user's document exists.

### 4. Perform the write

- Write through Mongoose models so schema validation runs as a second check.
- For multi-step writes that must succeed or fail together (for example reordering links), use one `bulkWrite` or a transaction.
- Turn known, user-fixable database errors into results. A duplicate-key error (code `11000`) on `handle` becomes `fieldErrors: { handle: ["That handle is taken"] }`. Anything else is thrown.

### 5. Refresh affected views

After a successful write, clear every cache the write affects, before returning:

| Function | Use when | Notes |
|---|---|---|
| `updateTag(tag)` | The data is cached with `cacheTag` (see the tag table in `docs/data-fetching.md`) | **Default in Server Actions.** Expires the tag immediately, so the user sees their own change |
| `revalidateTag(tag, "max")` | Cached data where a short delay is fine, such as other visitors' view of a public profile | Serves stale content while it refreshes. Always pass the second argument; the one-argument form is deprecated |
| `revalidatePath(path)` | The page shows uncached data and you want that path re-rendered | Only refreshes that path, not other pages using the same data |

Most link mutations call `updateTag(`links:${userId}`)`, which refreshes both the dashboard and the public profile. A handle change clears `profile:<oldHandle>` and `profile:<newHandle>`.

## Action results

Actions return the shared `ActionResult` type from `lib/types/action-result.ts`:

```ts
export type ActionResult<TData = null, TField extends string = string> =
  | { status: "idle" }
  | { status: "success"; data: TData }
  | {
      status: "error";
      fieldErrors: Partial<Record<TField, string[]>>;
      formError?: string;
    };
```

- `TData` is what the caller needs back, such as the new link's id. Use `null` when there's nothing to return.
- `TField` is the union of the form's field names, so the form knows which fields can have errors.
- `idle` is the initial state for `useActionState`.

| Situation | What the action does |
|---|---|
| Invalid input | Returns `{ status: "error", fieldErrors }` |
| Document not found or not owned by the user | Returns `{ status: "error", fieldErrors: {}, formError: "Link not found" }` |
| User-fixable conflict (handle taken) | Returns a field error |
| No session | Throws (`requireUserId`). The proxy should have redirected first |
| Database down, bug, broken invariant | Throws. Caught by `error.tsx` and logged |

Messages in a result are ones you wrote. Never put `error.message` from a caught exception in a result (see `docs/errors-and-validation.md`).

## Calling actions

- **Forms:** pass the action to `useActionState` and render `fieldErrors` next to each field. See the form example in `docs/errors-and-validation.md`.
- **Buttons and other interactions** (delete, reorder, toggle visibility): call the action from a Client Component inside `startTransition`, then check `result.status`.
- Never call a Route Handler from the app's own UI to change data.

## Checklist

Before merging an action, check that it:

- [ ] Lives in a `"use server"` file and has a verb-first name
- [ ] Calls `requireUserId()` first
- [ ] Validates every input with a Zod schema from `lib/validation/`
- [ ] Includes `userId` in every query filter
- [ ] Clears every affected tag or path after the write
- [ ] Returns an `ActionResult` for expected failures and throws only for unexpected ones
- [ ] Returns only the data the client needs
