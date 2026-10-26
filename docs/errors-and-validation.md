# Errors and validation

How Linkbase validates input and handles failures. There are two kinds of failure and they are handled differently:

| Kind | Examples | Handling |
| --- | --- | --- |
| **Expected** | Invalid field, handle already taken, link not found | **Returned** as a typed result. The form renders it inline. Never thrown |
| **Unexpected** | Database down, bug, broken invariant | **Thrown**, caught by the nearest `error.tsx`, logged on the server |

## Layout

```
lib/validation/
  link.ts            linkInputSchema, LinkInput
  profile.ts         profileInputSchema, ProfileInput
lib/types/
  action-result.ts   ActionResult<T>
```

Shared Zod schemas live in `/lib/validation`, one file per domain. Export the schema and its inferred type together:

```ts
// lib/validation/link.ts
import { z } from "zod";

export const linkInputSchema = z.object({
  title: z.string().trim().min(1, "Add a title").max(100, "Keep it under 100 characters"),
  url: z.httpUrl("Enter a valid http(s) URL"), // never z.url(): it accepts javascript: (docs/security.md)
});

export type LinkInput = z.infer<typeof linkInputSchema>;
```

Write error messages for the user. They are shown next to the field as-is.

## Validate at the Server Action boundary

**Every Server Action validates its input with Zod before touching the database.** Types don't exist at runtime, and Server Actions can be called directly with any payload (`docs/auth.md`), so client-side validation is a UX nicety, never a guarantee.

- Use `safeParse`, never `parse`, so validation failures come back as data instead of exceptions.
- Use only `result.data` after validation, never the raw input.
- The same schema can run on the client for instant feedback, but the server always re-validates.

## The result type

Every Server Action called from a form returns an `ActionResult`:

```ts
// lib/types/action-result.ts
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };
```

- `fieldErrors` holds messages keyed by field name and is rendered next to each input.
- `formError` holds one message for the whole form, such as "Link not found", rendered above the submit button.

```ts
"use server";
import { z } from "zod";

import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { getSession } from "@/lib/auth/get-session";
import type { ActionResult } from "@/lib/types/action-result";
import { linkInputSchema } from "@/lib/validation/link";

export async function createLink(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { userId } = await getSession();

  const parsed = linkInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await connectDb();
  await LinkModel.create({ ...parsed.data, userId });
  return { ok: true, data: undefined };
}
```

Other expected failures follow the same shape. An ownership-scoped query that matches nothing returns `{ ok: false, formError: "Link not found" }`. A MongoDB duplicate-key error (`code 11000`) on `handle` returns `{ ok: false, fieldErrors: { handle: ["That handle is taken"] } }`.

## Rendering errors in the form

The form is a Client Component using React's `useActionState`:

```tsx
"use client";
import { useActionState } from "react";

import { createLink } from "@/app/(dashboard)/add-links/actions";

export function AddLinkForm() {
  const [state, formAction, pending] = useActionState(createLink, null);
  const fieldErrors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction}>
      <input name="title" aria-invalid={!!fieldErrors?.title} aria-describedby="title-error" />
      <p id="title-error">{fieldErrors?.title?.[0]}</p>
      {/* … */}
      {state?.ok === false && state.formError && <p role="alert">{state.formError}</p>}
      <button disabled={pending}>Add link</button>
    </form>
  );
}
```

Error styling (2px `danger` ring, 14px `danger` message) is defined in `docs/ui.md`.

## Unexpected errors

- **Throw them.** Don't return them as results. They are thrown as real `Error` objects (`docs/coding-standards.md`) and bubble to the nearest `error.tsx` (`docs/routing.md`).
- Don't wrap whole actions in `try/catch` to swallow errors. Only catch when you can add context or turn a known case into an expected result, such as the duplicate-key case above. Rethrow everything else.
- When wrapping, keep the original as `cause`:

```ts
throw new Error(`createLink failed for user ${userId}`, { cause: err });
```

## Logging

Log unexpected errors on the server with enough context to debug:

- What failed: the action or route name, e.g. `createLink`.
- Who and on what: `userId` and the record id (e.g. `linkId`).
- The error itself, including `cause` and the stack.
- The `digest` Next.js attaches, which is how a user-reported error is matched to its log line.

Never log secrets or sensitive input: passwords, tokens, session cookies, full form payloads. The logging library is **TBD**. Until it's chosen, use `console.error` with a structured object on the server.

## Never expose internals to the client

- **Never send raw error messages or stack traces to the client.** Error messages in results are written for users, never `err.message`.
- In production, Next.js already replaces errors from the server with a generic message and an `error.digest` id. Don't rely on that alone, and never pass server error details through props or results.
- `error.tsx` shows a friendly, fixed message and a retry button. It may show `error.digest` as a reference code, never `error.message` or `error.stack`.
