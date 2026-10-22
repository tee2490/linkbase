# Linkbase Errors and Validation

How input is validated, how validation errors reach forms, and how unexpected errors are handled and logged. All paths are under `src/`.

---

## Two kinds of failure

| Kind | Example | Handling |
|---|---|---|
| **Expected**: the user can fix it | Empty title, invalid URL, handle already taken | **Returned** as a typed result and rendered inline next to the field. Never thrown |
| **Unexpected**: a bug or outage | Database down, broken invariant, failed session lookup | **Thrown**, caught by the nearest `error.tsx`, and logged on the server |

The rule of thumb: if the user can fix it by changing what they typed, return it. Anything else, throw it.

## Validation with Zod

All input is validated with **Zod** at the Server Action boundary, before it touches the database. Zod isn't installed yet (`npm install zod`). Examples use Zod 4.

- **Validate everything that comes from the client**: form data, action arguments, route params and search params. TypeScript types don't exist at runtime, so a typed argument proves nothing.
- **Validate after `requireUserId()` and before `connectToDatabase()`.** The order in every action is: authenticate, validate, then query (see `docs/auth.md`).
- **Use `safeParse`**, not `parse`, so validation failures become a returned result instead of a thrown error.
- **Use only the parsed data** (`parsed.data`), never the raw input. Zod strips unknown keys, so extra fields like `userId` can't sneak in.
- Mongoose schema validation (`docs/database.md`) is a second line of defense, not a replacement.

### Shared schemas

Schemas live in `lib/validation/`, one file per domain, so the Server Action and the form use the same rules:

```
src/lib/validation/
├── link.ts
└── profile.ts
```

```ts
// src/lib/validation/link.ts
import { z } from "zod";

export const linkInputSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(100, "Keep it under 100 characters"),
  url: z.url({ protocol: /^https?$/, error: "Enter a valid http(s) URL" }),
});

export type LinkInput = z.infer<typeof linkInputSchema>;
```

Write error messages for the person filling in the form: say what to do, not what went wrong internally.

## Action results

Validation errors come back in a typed result the form renders next to each field. The shared type lives in `lib/types/`:

```ts
// src/lib/types/action-result.ts
export type ActionResult<TData = null, TField extends string = string> =
  | { status: "idle" }
  | { status: "success"; data: TData }
  | {
      status: "error";
      fieldErrors: Partial<Record<TField, string[]>>;
      formError?: string; // a problem with the form as a whole, not one field
    };
```

The Server Action returns it for every expected failure:

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
  const userId = await requireUserId();

  const parsed = linkInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await connectToDatabase();
  const link = await LinkModel.create({ ...parsed.data, userId });
  updateTag(`links:${userId}`); // see docs/data-mutations.md
  return { status: "success", data: { id: link._id.toString() } };
}
```

The form reads it with `useActionState` and shows each message next to its field:

```tsx
// src/components/links/add-link-form.tsx
"use client";

import { useActionState } from "react";

import { addLink, type AddLinkResult } from "@/app/(dashboard)/add-links/actions";

const initialState: AddLinkResult = { status: "idle" };

export function AddLinkForm() {
  const [state, formAction, pending] = useActionState(addLink, initialState);
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form action={formAction}>
      <input name="title" aria-invalid={!!errors.title} aria-describedby="title-error" />
      {errors.title && <p id="title-error">{errors.title[0]}</p>}
      {/* url field follows the same pattern */}
      {state.status === "error" && state.formError && <p role="alert">{state.formError}</p>}
      <button disabled={pending}>Add</button>
    </form>
  );
}
```

- Link each error to its input with `aria-describedby` and mark the input `aria-invalid`.
- Domain conflicts the user can fix are expected failures too. For example, catch MongoDB's duplicate-key error (code `11000`) on `handle` and return `fieldErrors: { handle: ["That handle is taken"] }`.

## Unexpected errors

Anything the user can't fix is thrown as a real `Error` (see `docs/coding-standards.md`) and left to propagate.

- **Don't catch to hide.** Catch only to add context, then rethrow with `cause`:

  ```ts
  try {
    await LinkModel.bulkWrite(ops);
  } catch (error) {
    throw new Error(`Failed to reorder links for user ${userId}`, { cause: error });
  }
  ```

- **`error.tsx` catches it.** The nearest boundary up the tree renders a fallback (see `docs/routing.md`). It's a Client Component that receives `error` (typed `unknown`) and `retry()`:

  ```tsx
  // src/app/(dashboard)/error.tsx
  "use client";

  export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
    const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;
    return (
      <div role="alert">
        <h2>Something went wrong</h2>
        <p>Please try again. If it keeps happening, contact support{digest && ` with code ${digest}`}.</p>
        <button onClick={() => retry()}>Try again</button>
      </div>
    );
  }
  ```

- Add `app/global-error.tsx` for errors in the root layout, which `error.tsx` doesn't cover.

## Logging

Every unexpected error is logged on the server with enough context to debug it.

- **One place:** export `onRequestError` from `src/instrumentation.ts`. Next.js calls it for every server error, including errors in Server Components, Server Actions and Route Handlers, with the request path and route type.
- **Log:** the message, the `cause` chain, the stack, the `digest`, the route and the user id when there is one.
- **Don't log:** passwords, tokens, session cookies, or full form payloads. Log ids, not personal data.
- The **`digest`** is the link between the two sides. The user sees it in the `error.tsx` message, and you search the logs for it.
- Logging provider: **TBD**. Until one is chosen, log structured JSON with `console.error`.

## Never expose internals

- **Never send raw error messages or stack traces to the client.** In production, Next.js already replaces errors from Server Components and Server Actions with a generic message and a `digest`. Don't undo that by copying `error.message` into an action result or a prop.
- `formError` and `fieldErrors` contain only messages you wrote, never text from a caught exception or from MongoDB.
- In development, the real message reaches `error.tsx` to help debugging. Don't rely on that for UI copy; production users won't see it.
- Route Handlers (webhooks) return a generic status and body, such as `400 Invalid signature` or `500 Internal error`, and log the details on the server.
