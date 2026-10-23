# Linkbase Routing — Routes, Groups and Route Files

How routes are organized under `src/app/`, which are public, and where mutations go. Access control details are in `docs/auth.md`.

---

## Route map

```
src/app/
├── layout.tsx                    # Root layout (html, body, fonts)
├── page.tsx                      # /                  Landing page        public
├── user/[handle]/page.tsx        # /user/[handle]     Public profile      public
├── (auth)/
│   ├── layout.tsx                # Shared auth layout
│   ├── actions.ts                # signInWithCredentials, signUp, signOutUser
│   ├── sign-in/page.tsx          # /sign-in           Sign-in             public
│   └── sign-up/page.tsx          # /sign-up           Sign-up             public
├── (dashboard)/
│   ├── layout.tsx                # Shared dashboard shell
│   ├── dashboard/page.tsx        # /dashboard         Dashboard           protected
│   └── add-links/page.tsx        # /add-links         Add links           protected
└── api/
    ├── auth/[...nextauth]/route.ts   # NextAuth handlers and OAuth callbacks
    └── webhooks/[provider]/route.ts  # Third-party webhooks
```

| URL | Group | Access |
|---|---|---|
| `/` | — | Public |
| `/user/[handle]` | — | Public |
| `/sign-in` | `(auth)` | Public (signed-in users go to `/dashboard`) |
| `/sign-up` | `(auth)` | Public (signed-in users go to `/dashboard`) |
| `/dashboard` | `(dashboard)` | Signed in |
| `/add-links` | `(dashboard)` | Signed in |
| `/api/auth/*` | — | Public (NextAuth) |
| `/api/webhooks/*` | — | Public, verified by signature |

## Route groups

Folders in parentheses organize routes and share a layout **without adding a URL segment**. `(dashboard)/add-links/page.tsx` is served at `/add-links`.

- **`(dashboard)`** holds every authenticated page and the dashboard shell layout. New signed-in pages go here.
- **`(auth)`** holds sign-in, sign-up and any future auth pages (verify email), sharing a minimal layout without the dashboard chrome. Signed-in users who open `/sign-in` or `/sign-up` are redirected to `/dashboard` by the proxy.
- Public pages (`/`, `/user/[handle]`) sit outside both groups.

## Protection

`src/proxy.ts` protects the `(dashboard)` routes and redirects unauthenticated users to `/sign-in?callbackUrl=<path>`. Next.js 16 renamed `middleware.ts` to `proxy.ts`.

Because group names don't appear in URLs, the proxy can't match `(dashboard)` by name. It runs on every page and allows only a list of public paths, so **a new route is protected unless it's added to that list**. When you add a public route, update `PUBLIC_PATHS` in `proxy.ts`. See `docs/auth.md` for the proxy code and the session checks every Server Action still has to do.

## Route files

Each route owns its route files, added only where needed:

| File | Use when | Notes |
|---|---|---|
| `layout.tsx` | Several pages share UI (nav, shell) | Persists across navigation, doesn't re-render. Don't rely on it for auth checks |
| `loading.tsx` | The page awaits data | Wraps the page in `<Suspense>`, so the shell shows instantly |
| `error.tsx` | The page can fail at runtime | Must be a Client Component (`"use client"`). Offer a retry with `retry()`. See `docs/errors-and-validation.md` |
| `not-found.tsx` | The page calls `notFound()` | For example an unknown `/user/[handle]` |

Put a file at the lowest level that needs it. A `loading.tsx` in `(dashboard)/` covers every dashboard page; one in `add-links/` overrides it for that page only. All route files use a default export and the generated `PageProps`/`LayoutProps` types (see `docs/coding-standards.md`).

## Mutations: Server Actions, not Route Handlers

- **All app mutations go through Server Actions**: creating, editing, reordering and deleting links, updating the profile, and so on. Keep them next to the route that uses them (for example `(dashboard)/add-links/actions.ts`) or in a feature folder, and follow the rules in `docs/auth.md`.
- **Route Handlers in `app/api/` are only for callers outside the app**: webhooks and third-party callbacks, such as NextAuth's OAuth callbacks at `/api/auth/*`.
- Don't add a Route Handler for something the app's own UI calls. Use a Server Action or fetch the data in a Server Component.
- Webhook handlers have no user session. They must verify the provider's signature before doing anything, and they're on the proxy's public list.
