# Linkbase Data Fetching — Reads, Scoping and Caching

How pages read data, how reads are scoped, and how cached reads are cleared after a write. All paths are under `src/`. Writes are covered in `docs/errors-and-validation.md` and `docs/auth.md`.

---

## Rules

1. **Reads happen in Server Components**, which call query functions that talk to the database directly.
2. **No `fetch` to internal API routes.** A Server Component calling `/api/...` on its own server adds a network hop and skips type safety. Route Handlers are only for webhooks and third-party callbacks (see `docs/routing.md`).
3. **Every query is scoped.** Private data by the signed-in user's id, public profile data by `handle`.
4. **Client Components never query the database.** They receive data as props from a Server Component.
5. **Cache where it helps, always with tags,** and clear those tags after every mutation that changes the data.

## Query functions

Reads live in `server-only` query functions in `lib/db/queries/`, one file per domain. Pages and components call these, never Mongoose models directly.

```
src/lib/db/queries/
├── links.ts          # getLinksForUser
└── profiles.ts       # getPublicProfile
```

Query functions:

- Start with `import "server-only"`, so importing one into a Client Component fails the build.
- Take the scope (`userId` or `handle`) as an argument. Callers get `userId` from `requireUserId()`, never from the client.
- Use `.lean()` and return plain **DTOs** (data transfer objects): only the fields the caller needs, with `ObjectId`s converted to strings. Mongoose documents and `ObjectId`s aren't serializable, so they can't be cached or passed to Client Components.

## Scoping

| Data | Scope | Filter | Who can call it |
|---|---|---|---|
| Dashboard links, settings | Signed-in user | `{ userId }` | Dashboard pages, after `requireUserId()` |
| Public profile | Handle | `{ handle }`, then `{ userId: profile.id, visible: true }` | Anyone |

Public queries return only public fields. Never reuse a private query for a public page; write a separate one that selects public fields.

## Caching

The project runs with **Cache Components** on (`cacheComponents: true`), so reads are dynamic by default and run on every request until you cache them.

**Use `'use cache'` with `cacheTag` and `cacheLife`.** Not the older options:

- **`unstable_cache`** has been replaced by `'use cache'` in Next.js 16. Don't use it.
- **The `fetch` cache** (`next: { tags }`) only caches `fetch` calls. Mongoose doesn't use `fetch`, so it doesn't apply to our queries. Use it only if the app ever calls an external HTTP API.

### What to cache

| Query | Cache? | Why |
|---|---|---|
| `getPublicProfile(handle)` | **Yes** | Read often by anyone, changes rarely |
| `getLinksForUser(userId)` | Optional | Only the owner reads it, so the hit rate is low. Start uncached and add caching if it's slow |

### Rules for cached functions

- **Never read `cookies()`, `headers()`, `searchParams` or call `auth()` inside `'use cache'`.** Next.js throws. Read the session outside and pass `userId` in as an argument.
- **Arguments are the cache key.** A function cached with `userId` as an argument gets one entry per user, which is safe. A cached function that reads private data without the user in its arguments would share one user's data with everyone.
- **Tag every cached function** so mutations can clear it.
- **Return DTOs**, since return values must be serializable.

### Tags

| Tag | Covers |
|---|---|
| `links:<userId>` | A user's links, in the dashboard and on their public profile |
| `profile:<handle>` | Public profile data for one handle |

The public profile tags itself with both, so editing a link refreshes it too. `cacheTag` can be called after the user has been looked up:

```ts
// src/lib/db/queries/profiles.ts
import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { UserModel } from "@/lib/db/models/user";

export type PublicProfile = {
  handle: string;
  displayName: string;
  links: { id: string; title: string; url: string }[];
};

export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheTag(`profile:${handle}`);
  cacheLife("hours");

  await connectToDatabase();
  const user = await UserModel.findOne({ handle }).select("handle displayName").lean();
  if (!user) return null;

  cacheTag(`links:${user._id.toString()}`);
  const links = await LinkModel.find({ userId: user._id, visible: true })
    .sort({ position: 1 })
    .select("title url")
    .lean();

  return {
    handle: user.handle,
    displayName: user.displayName,
    links: links.map((l) => ({ id: l._id.toString(), title: l.title, url: l.url })),
  };
}
```

### Clearing caches after mutations

- **In Server Actions, use `updateTag(tag)`.** It expires the tag immediately, so the user sees their own change on the next render instead of stale data.
- **In Route Handlers (webhooks), use `revalidateTag(tag, "max")`.** `updateTag` only works in Server Actions. The one-argument `revalidateTag(tag)` is deprecated.
- Clear every tag the write affects:

| Mutation | Tags to clear |
|---|---|
| Add, edit, reorder, delete or hide a link | `links:<userId>` |
| Change display name or bio | `profile:<handle>` |
| Change handle | `profile:<oldHandle>` and `profile:<newHandle>` |

```ts
// end of addLink in src/app/(dashboard)/add-links/actions.ts
const link = await LinkModel.create({ ...parsed.data, userId });
updateTag(`links:${userId}`);
return { status: "success", data: { id: link._id.toString() } };
```

## Rendering

- **Pages fetch, components display.** A Server Component page or layout calls the query functions and passes results down as props.
- **Fetch in parallel.** Independent queries go in one `Promise.all` (see `docs/coding-standards.md`).
- **Stream dynamic data.** Uncached reads, and anything that depends on the session, render inside `<Suspense>` or under a `loading.tsx`, so the static shell shows first.
- **Pass only what the client needs.** Client Components get DTOs as props, not whole records. Everything passed to a Client Component is sent to the browser.

```tsx
// src/app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react";

import { requireUserId } from "@/lib/auth";
import { getLinksForUser } from "@/lib/db/queries/links";
import { LinkList } from "@/components/links/link-list";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading links…</p>}>
      <Links />
    </Suspense>
  );
}

async function Links() {
  const userId = await requireUserId();
  const links = await getLinksForUser(userId);
  return <LinkList links={links} />; // LinkList can be a Client Component
}
```

When a Client Component needs fresh data after an interaction, it calls a Server Action. The action writes, clears the tags, and the server re-renders with new props. Client Components don't fetch data themselves.
