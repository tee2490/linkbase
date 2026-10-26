# Auth

How Linkbase signs users in, protects routes and makes sure each user only touches their own data. NextAuth (Auth.js v5) handles sign-in, sessions and security. Database scoping rules are in `docs/database.md`.

## Layout

```
lib/auth/
  auth.ts            NextAuth config; exports handlers, auth, signIn, signOut
  get-session.ts     getSession(): server-side helper returning the signed-in userId
app/api/auth/[...nextauth]/route.ts   Auth.js route handler (re-exports handlers)
proxy.ts             Route protection (Next.js 16 renamed middleware.ts to proxy.ts)
```

- Sign-in providers are **TBD**. Decide them before building the sign-in page.
- Sessions use the JWT strategy, so the proxy can check the session cookie without a database call.
- Add the user id to the session in the `jwt` and `session` callbacks. Auth.js only exposes `name`, `email` and `image` by default. Augment the `Session` type so `session.user.id` is typed.

## Route access

| Routes | Access |
| --- | --- |
| `app/(dashboard)/*` | Signed-in users only. Protected by default |
| `/` | Public landing page |
| `/user/[handle]` | Public profile, open to everyone |
| `/sign-in` (`app/(auth)/*`), `/api/auth/*` | Public, needed to sign in |
| `/api/webhooks/*` | No session. Each handler verifies the sender's signature instead |

The full route map is in `docs/routing.md`.

**Protected by default** means the proxy runs on every route and lets through only an explicit allowlist of public paths. Everything else needs a session, and a request without one is redirected to `/sign-in`. A new page is therefore protected unless someone deliberately adds it to the allowlist. Signed-in users who open `/sign-in` are sent to `/dashboard`.

`(dashboard)` is a route group, so it never appears in the URL. The proxy can't match on `/(dashboard)`. It has to work from the public allowlist instead.

```ts
// proxy.ts
import { auth } from "@/lib/auth/auth";

const publicPaths = [
  /^\/$/,
  /^\/sign-in$/,
  /^\/user\/[^/]+$/,
  /^\/api\/auth\//,
  /^\/api\/webhooks\//,
];

export const proxy = auth((req) => {
  const { pathname, origin } = req.nextUrl;
  if (req.auth && pathname === "/sign-in") {
    return Response.redirect(new URL("/dashboard", origin));
  }
  const isPublic = publicPaths.some((p) => p.test(pathname));
  if (!req.auth && !isPublic) {
    return Response.redirect(new URL("/sign-in", origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## Proxy is not the security boundary

The proxy is an optimistic check. It redirects users who obviously aren't signed in, but it only reads the cookie. Both Next.js and Auth.js advise against relying on it alone. Every Server Action and every data read verifies the session again on the server.

Server Actions are public HTTP endpoints. Anyone can call one directly, bypassing the proxy and the UI, so each one must check identity itself.

## Identity in Server Actions

Every Server Action starts by getting the user id from the session:

```ts
// lib/auth/get-session.ts
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  return { userId: session.user.id };
}
```

```ts
"use server";
export async function updateLink(linkId: string, input: unknown): Promise<ActionResult> {
  const { userId } = await getSession();                    // 1. identity from the session
  const parsed = linkInputSchema.safeParse(input);           // 2. validate input
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  await connectDb();
  const { matchedCount } = await LinkModel.updateOne({ _id: linkId, userId }, parsed.data); // 3. ownership in the query
  if (matchedCount === 0) return { ok: false, formError: "Link not found" };
  return { ok: true, data: undefined };
}
```

Validation and the `ActionResult` type are covered in `docs/errors-and-validation.md`.

- Never accept a `userId` from the client, form data or URL params.
- Don't check auth in `layout.tsx`. Layouts don't re-render on client navigation, so the check can be skipped. Check in pages, Server Actions and data functions.

## Ownership at the database level

Users can only read and write their own links. Every query on user-owned data includes `userId` from the session in its filter, as described in `docs/database.md`. A query that matches nothing is treated as "not found", so it never reveals whether another user's record exists.

The public profile at `/user/[handle]` is the one exception. It reads a profile and its links by `handle` without a session. That path is **read-only** and returns only public fields, never emails, ids of other records or internal settings.

## Security practices

- Set `AUTH_SECRET` in the environment. It is required in production and is never committed.
- Keep Auth.js defaults for cookies (`httpOnly`, `secure` in production, `sameSite=lax`) and its built-in CSRF protection on `/api/auth/*`.
- Server Actions only accept POST from the same origin. Don't loosen `serverActions.allowedOrigins` without a reason.
- Only put the user id in the session. Load anything else on the server when it's needed.
- Sign-out goes through `signOut()`. Never clear cookies by hand.
