# Data Fetching

How Linkbase reads data: where reads happen, how they are scoped, what is cached and how caches are invalidated after a mutation. Connection and schema rules are in `docs/database.md`. Session and ownership rules are in `docs/auth.md`.

The app runs Next.js 16 with `cacheComponents: true` (see `next.config.ts`), so caching uses `"use cache"`, `cacheTag` and `cacheLife` from `next/cache`, with `revalidatePath` and `revalidateTag` after writes. The older `unstable_cache`, `fetch` cache options and route segment config like `export const revalidate` don't apply here.

## Rules

- **Reads happen in Server Components**, which call query functions in `/lib/db/queries` directly.
- **Never `fetch` our own API routes** to load data for a page. Route Handlers are for webhooks and third-party callbacks only (`docs/routing.md`). A fetch to `/api/...` from the server is an extra HTTP round trip and skips the session checks below.
- **Client Components never query the database.** They never import `/lib/db`, and they don't fetch data on mount. A Server Component reads the data and passes it down as props.
- **Private data is scoped by `userId`** from the session and is **uncached** by default.
- **Public profile data is scoped by `handle`**, returns public fields only, and is cached with tags.
- **Every mutation revalidates** the paths and tags it affects (`docs/data-mutations.md`).

## Layout

```
lib/db/queries/
  links.ts           getMyLinks(), getMyLink(id): private, uncached
  profile.ts         getMyProfile(): private, uncached
                     getPublicProfile(handle): public, cached
lib/types/
  profile.ts         PublicProfile and other shapes returned to components
```

- Every query file starts with `import "server-only";`, so importing it from a Client Component fails the build.
- Query functions return plain objects (`.lean()` plus mapping), never Mongoose documents. Convert `ObjectId` and `Date` fields to strings. Cached results and props for Client Components must be serializable, and class instances like `ObjectId` aren't.
- Return only the fields the caller needs. Don't pass a whole document to a component.

## Private data: scoped by `userId`, uncached

Private queries get the user id from the session themselves. They never accept a `userId` argument, so a caller can't ask for someone else's data.

```ts
// lib/db/queries/links.ts
import "server-only";
import { connectDb } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import { getSession } from "@/lib/auth/get-session";

export async function getMyLinks() {
  const { userId } = await getSession();
  await connectDb();
  const links = await LinkModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return links.map((link) => ({
    id: link._id.toString(),
    title: link.title,
    url: link.url,
  }));
}

export async function getMyLink(linkId: string) {
  const { userId } = await getSession();
  await connectDb();
  const link = await LinkModel.findOne({ _id: linkId, userId }).lean(); // never { _id: linkId }
  if (!link) return null; // "not found", even if it belongs to someone else
  return { id: link._id.toString(), title: link.title, url: link.url };
}
```

**Private reads are not cached.** Don't add `"use cache"`, `"use cache: private"` or `"use cache: remote"` to them. They run on every request, so the dashboard always shows the current state. If a private read becomes a measured bottleneck, discuss caching it first. Any cache for it must be keyed and tagged by `userId` and must resolve the user inside the exported function, as in the Next.js guide `authentication-with-cache-components.md`.

To avoid reading the session more than once per request, wrap `getSession` in React's `cache()`. That dedupes calls within one render only and is not a data cache.

### Rendering private data

Reading the session is request-time work. With Cache Components it must sit inside a `<Suspense>` boundary, otherwise Next.js reports a blocking route. Keep the page itself sync, and read data in a child component inside the boundary (or rely on the route's `loading.tsx`).

```tsx
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from "react";
import { getMyLinks } from "@/lib/db/queries/links";
import { LinkList } from "@/components/links/link-list";
import { LinkListSkeleton } from "@/components/links/link-list-skeleton";

export default function DashboardPage() {
  return (
    <main>
      <h1>Your links</h1>
      <Suspense fallback={<LinkListSkeleton />}>
        <MyLinks />
      </Suspense>
    </main>
  );
}

async function MyLinks() {
  const links = await getMyLinks();
  return <LinkList links={links} />; // LinkList may be a Client Component
}
```

Don't read the session or data at the top level of a `layout.tsx`. It blocks the whole segment, and layouts are not where auth is checked (`docs/auth.md`).

## Public profile: scoped by `handle`, cached

`/user/[handle]` is open to everyone and is the same for every visitor, so it is cached. The query looks up by `handle`, returns public fields only and never reads the session.

```ts
// lib/db/queries/profile.ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connectDb } from "@/lib/db/connect";
import { UserModel } from "@/lib/db/models/user";
import { LinkModel } from "@/lib/db/models/link";
import { handleTag, profileTag } from "@/lib/db/queries/tags";
import type { PublicProfile } from "@/lib/types/profile";
import { handleFormatSchema } from "@/lib/validation/handle";

export async function getPublicProfile(rawHandle: string): Promise<PublicProfile | null> {
  "use cache";
  cacheLife("hours");

  // Malformed handles never reach the database.
  const parsed = handleFormatSchema.safeParse(rawHandle);
  if (!parsed.success) return null;
  const handle = parsed.data;
  cacheTag(handleTag(handle));

  await connectDb();
  const user = await UserModel.findOne({ handle }).select("_id handle").lean();
  if (!user?.handle) return null;

  const userId = user._id.toString();
  cacheTag(profileTag(userId));
  const links = await LinkModel.find({ userId }).select("title url").sort({ createdAt: -1 }).lean();

  // Public fields only: no user id, email or link ids.
  return { handle: user.handle, links: links.map((link) => ({ title: link.title, url: link.url })) };
}
```

The page needs a real `404` for unknown handles. A `notFound()` inside `<Suspense>` runs after streaming has started and keeps a `200` status (Next.js docs: `not-found.md`, "Calling `notFound()` after streaming has started"). So `/user/[handle]` awaits `params` and the cached lookup at the top level, with no `<Suspense>`. Under Cache Components that is only allowed when `generateStaticParams` returns at least one param, so it returns a placeholder that fails the handle format check: the build never queries the database, and real handles render on first request and are cached.

```tsx
// app/user/[handle]/page.tsx
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/db/queries/profile";

export async function generateStaticParams() {
  return [{ handle: "__placeholder__" }];
}

export default async function UserPage({ params }: PageProps<"/user/[handle]">) {
  const { handle } = await params;
  const profile = await getPublicProfile(handle);
  if (!profile) notFound(); // before streaming, so the status is 404
  return <PublicProfileCard profile={profile} />;
}
```

Private pages keep the `<Suspense>` pattern above: they read the session, which is request-time data and can't be awaited at the top level.

- `"use cache"` functions can't read `cookies()` or `headers()`, which keeps session data out of the shared cache. Never call `getSession()` inside one.
- Pair every `"use cache"` with a `cacheLife` profile. `hours` is the default for the public profile, since tags handle freshness after edits.
- Never put private fields (email, internal settings) in a cached result. Everything returned from `getPublicProfile` is visible to anyone.
- Cache arguments and tags are stored in plain text. Tag on ids and handles only, never on emails, tokens or other secrets.

## Cache tags

Tag names come from helpers in `/lib/db/queries/tags.ts`, so readers and writers can't drift apart.

```ts
// lib/db/queries/tags.ts
export const profileTag = (userId: string) => `profile:${userId}`;
export const handleTag = (handle: string) => `handle:${handle.toLowerCase()}`;
```

| Tag | Set by | Invalidate when |
| --- | --- | --- |
| `profile:{userId}` | `getPublicProfile`, after the user is found | The user changes their profile or any of their links |
| `handle:{handle}` | `getPublicProfile`, for every lookup (including "not found") | A handle is claimed, changed or released |

The `profile:{userId}` tag lets a Server Action revalidate the public page using the `userId` it already has from the session, without looking up the handle. The `handle:` tag covers cached "not found" results, so a newly claimed handle doesn't keep returning 404.

## Invalidation after mutations

Writes are covered in `docs/data-mutations.md`. In short, after a successful write a Server Action:

- calls `revalidatePath("/dashboard")` (or whichever private page changed), which re-renders that uncached page immediately so the user sees their change
- calls `revalidateTag(profileTag(userId), "max")` when the public profile is affected, so visitors get the new version after a background re-render
- uses `revalidateTag(tag, { expire: 0 })` when stale content would be wrong, such as the `handle:` tag of a released handle

`revalidateTag` always takes the second argument. The one-argument form is deprecated. When you add a new cached query, add its tag to the table above and to the revalidation table in `docs/data-mutations.md`.

## Passing data to Client Components

Client Components get data only as props from a Server Component. They send changes back through Server Actions.

```tsx
// components/links/link-list.tsx
"use client";
import type { LinkItem } from "@/lib/types/link";

type LinkListProps = { links: LinkItem[] };

export function LinkList({ links }: LinkListProps) {
  /* render, reorder, call Server Actions on change */
}
```

- Props must be serializable: strings, numbers, booleans, plain objects, arrays, `Date`s. No Mongoose documents, `ObjectId`s or functions other than Server Actions.
- Pass the narrowest shape the component needs. Everything in props is sent to the browser.
- No `useEffect` + `fetch`, SWR or React Query for our own data. If a Client Component needs fresh data after a change, the Server Action calls `revalidatePath` or `revalidateTag` and the Server Component re-renders with new props.
