# Routing

The route map for Linkbase: which routes exist, who can reach them, how route groups and special files are organised, and when to use a Route Handler instead of a Server Action. Access control details are in `docs/auth.md`.

## Route map

```
app/
  layout.tsx                    Root layout (html, body, fonts, globals.css)
  page.tsx                      /                  Landing page: public
  user/[handle]/page.tsx        /user/[handle]     Public profile: public
  (auth)/
    layout.tsx                  Shared auth shell
    sign-in/page.tsx            /sign-in           Sign-in: public
    sign-up/page.tsx            /sign-up           Sign-up: public
  (dashboard)/
    layout.tsx                  Shared app shell (nav, sidebar)
    dashboard/page.tsx          /dashboard         Signed-in only
    add-links/page.tsx          /add-links         Signed-in only
  api/
    auth/[...nextauth]/route.ts Auth.js callbacks (third-party)
    webhooks/…                  Webhooks only
```

| Route | Group | Access |
| --- | --- | --- |
| `/` | — | Public |
| `/user/[handle]` | — | Public |
| `/sign-in` | `(auth)` | Public. Signed-in users are redirected to `/dashboard` |
| `/sign-up` | `(auth)` | Public. Signed-in users are redirected to `/dashboard` |
| `/dashboard` | `(dashboard)` | Signed-in only |
| `/add-links` | `(dashboard)` | Signed-in only |

## Route groups

Route groups (`(name)`) organise routes and share a layout **without adding a URL segment**: `app/(dashboard)/dashboard/page.tsx` is served at `/dashboard`, not `/(dashboard)/dashboard`.

- **`(dashboard)`** holds every authenticated route. New signed-in pages go here.
- **`(auth)`** holds sign-in and sign-up, plus any future auth pages (password reset is **TBD**).
- Two routes in different groups must not resolve to the same URL, because Next.js errors on that.

## Protection

`proxy.ts` (Next.js 16 renamed middleware to proxy) redirects unauthenticated users to `/sign-in`. It protects by default: only the public routes above are allowlisted, so anything new in `(dashboard)` is protected automatically. Because the group name isn't in the URL, the proxy works from the public allowlist, not a `/(dashboard)` match.

The proxy is only the first check. Pages and Server Actions still verify the session on the server. See `docs/auth.md`.

## Special files per route

Each route owns its own `layout.tsx`, `loading.tsx` and `error.tsx` **where needed**. Add them at the level they apply to, not globally by default.

| File | Add it when | Notes |
| --- | --- | --- |
| `layout.tsx` | Several pages share UI (nav, shell) | Persists across navigation and doesn't re-render. **Never check auth here** |
| `loading.tsx` | The route awaits data before rendering | Shown instantly as a Suspense fallback while the page streams |
| `error.tsx` | The route can fail at runtime (data, network) | Must be a Client Component (`"use client"`). Receives `error: unknown` and `retry()` |
| `not-found.tsx` | The route can call `notFound()` | e.g. an unknown handle on `/user/[handle]` |

```tsx
// app/(dashboard)/dashboard/error.tsx
"use client";

type DashboardErrorProps = {
  error: unknown;
  retry: () => void;
};

export default function DashboardError({ error, retry }: DashboardErrorProps) {
  /* show a message; call retry() from a button */
}
```

Route files are the only place default exports are allowed (`docs/coding-standards.md`).

## Route Handlers vs Server Actions

**Route Handlers (`app/api/**/route.ts`) are reserved for webhooks and third-party callbacks only.** They exist because an outside service needs a URL to call.

- ✓ Payment or email-provider webhooks under `app/api/webhooks/`
- ✓ Auth.js OAuth callbacks at `app/api/auth/[...nextauth]` (third-party callbacks)
- ✗ CRUD for links, profiles or settings. Use Server Actions
- ✗ Data fetching for our own pages. Read data in Server Components

Everything else, meaning every create, update and delete our own UI triggers, goes through **Server Actions** (verb-first names like `createLink`).

Webhook handlers have no user session. They must verify the sender's signature before doing anything.
