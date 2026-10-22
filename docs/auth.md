# Linkbase Auth — Sign-in, Sessions and Access Control

How users sign in, which routes are protected and how ownership is enforced. All paths are under `src/`.

---

## Overview

- **NextAuth (Auth.js v5)** handles sign-in, sessions and the security defaults that come with them.
- **Dashboard routes are protected by default.** Everything under `app/(dashboard)/` requires a signed-in session, and `proxy.ts` enforces it.
- **The public profile at `/user/[handle]` is open to everyone.**
- **Users only read and write their own links.** Identity is checked on the server in every Server Action, and every query filters on `userId` (see `docs/database.md`).

Authorization is enforced in three layers. Each layer must hold on its own, so never drop one because another exists:

| Layer | Where | Checks |
|---|---|---|
| Proxy | `src/proxy.ts` | A session exists before a protected page renders |
| Server Action | every `"use server"` function | A session exists, and the user id comes from it |
| Database | every query | The filter includes `userId`, so other users' documents never match |

## Layout

```
src/
├── proxy.ts                          # Route protection (was middleware.ts before Next.js 16)
├── app/
│   ├── api/auth/[...nextauth]/route.ts   # NextAuth route handlers
│   ├── (dashboard)/                  # Protected
│   └── user/[handle]/                # Public profile
└── lib/auth/
    ├── config.ts                     # NextAuth() setup: providers, session, callbacks
    └── index.ts                      # Server helpers: getSession, requireUserId
```

## NextAuth setup

`lib/auth/config.ts` calls `NextAuth()` and exports `handlers`, `auth`, `signIn` and `signOut`. The route handler re-exports `handlers` as `GET` and `POST`.

Security practices to follow:

- **Secret:** set `AUTH_SECRET` (generate with `npx auth secret`) and never commit it. Provider credentials also live in environment variables.
- **Cookies:** keep NextAuth's defaults. Session cookies are `httpOnly`, `SameSite=Lax`, and `Secure` with the `__Secure-` prefix over HTTPS.
- **CSRF:** NextAuth protects its own sign-in and sign-out endpoints. Server Actions are POST-only and Next.js checks their `Origin` header, so don't add extra GET endpoints that change data.
- **Session contents:** put only the user id in the session, never secrets, tokens or the full user document. Add it in the `session` callback (`session.user.id = token.sub`).
- **Expiry:** keep a bounded session lifetime (`session.maxAge`) and let NextAuth rotate it on activity.
- **Redirects:** only redirect to relative, same-site callback URLs after sign-in.
- **Providers:** **TBD**. Prefer OAuth or email magic links over storing passwords. If credentials are ever added, hash with a slow algorithm (argon2 or bcrypt) and rate-limit sign-in.
- **Adapter:** if NextAuth stores users in MongoDB, `@auth/mongodb-adapter` uses its own `MongoClient`, separate from the Mongoose connection. Both should point at the same `MONGODB_URI`.

## Route protection (proxy)

Next.js 16 renamed `middleware.ts` to `proxy.ts`. It runs on the Node.js runtime, so don't set `runtime`.

**Route groups don't appear in URLs.** `app/(dashboard)/links/page.tsx` is served at `/links`, not `/(dashboard)/links`, so the proxy can't match on the group name. To keep dashboard routes protected by default, the proxy runs on every page and lets through only an allowlist of public paths. A new dashboard route is then protected without any config change.

```ts
// src/proxy.ts
import { auth } from "@/lib/auth/config";

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/user\/[^/]+$/,
  /^\/sign-in$/,
  /^\/api\/auth\//,
  /^\/api\/webhooks\//, // no session; handlers verify signatures
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((re) => re.test(pathname))) return;
  if (!req.auth) {
    const signIn = new URL("/sign-in", req.nextUrl.origin);
    signIn.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signIn);
  }
});

export const config = {
  // Skip static files and image optimization
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
```

The proxy is a first gate for pages, not the security boundary. Server Actions are POST requests to whatever page uses them, so a matcher change or a moved action can silently skip the proxy. That's why every Server Action checks the session again.

## Server-side identity

`lib/auth/index.ts` is `server-only` and gives Server Components and Server Actions the current user:

```ts
// src/lib/auth/index.ts
import "server-only";
import { auth } from "./config";

export async function getSession() {
  return auth();
}

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
```

Rules for every Server Action:

1. Call `requireUserId()` first, before validating input or touching the database. A page-level check doesn't extend to the actions defined in it.
2. Take the user id only from the session. Never accept `userId` from arguments, form data or the URL.
3. Validate every argument with Zod; actions are public HTTP endpoints (see `docs/errors-and-validation.md`).
4. Scope every query with `userId`, and look documents up with `{ _id, userId }`, never by `_id` alone. If a write matches nothing, treat it as not found rather than revealing that the document belongs to someone else.
5. Return only the fields the client needs.

```ts
"use server";

import { requireUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { LinkModel } from "@/lib/db/models/link";
import type { ActionResult } from "@/lib/types/action-result";

export async function updateLink(linkId: string, title: string): Promise<ActionResult> {
  const userId = await requireUserId();
  // validate linkId and title with Zod here
  await connectToDatabase();
  const result = await LinkModel.updateOne({ _id: linkId, userId }, { title });
  if (result.matchedCount === 0) {
    return { status: "error", fieldErrors: {}, formError: "Link not found" };
  }
  // clear caches here (see docs/data-mutations.md)
  return { status: "success", data: null };
}
```

The full step-by-step pattern is in `docs/data-mutations.md`.

## Public profile

`/user/[handle]` needs no session. It looks the user up by `handle` and returns only public fields (display name, avatar, bio, visible links). It never exposes emails, internal ids beyond what's needed, or hidden links. `handle` is user input, so validate it before querying.

## Cache Components

`auth()` reads cookies, so anything that calls it is dynamic. Render session-dependent UI inside `<Suspense>`. Never call `auth()` inside a `use cache` function; Next.js throws. A cached user-scoped query must take `userId` as an argument so each user gets their own cache entry. Without it, one user's data would be shared with others (see `docs/data-fetching.md`).
