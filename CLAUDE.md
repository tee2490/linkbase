@AGENTS.md

## Doc Convention

Project documentation lives in `/docs`. Whenever a new file is created in `/docs`, add it to the Project Docs section below with one line on what it covers and when to read it.

## Project Docs

- `docs/architecture.md` — App Router rendering model (Server vs Client Components), folder structure for `/app`, `/components` and `/lib`, and naming conventions. Read before creating new files, routes, components or Server Actions.
- `docs/auth.md` — NextAuth setup, protected-by-default routing via `proxy.ts`, the public `/user/[handle]` exception, and server-side identity and ownership checks. Read before adding a route, a Server Action or anything that touches sessions.
- `docs/coding-standards.md` — TypeScript strictness, Prettier/ESLint, import order, component and export rules, async/await and error handling. Read before writing or reviewing any code.
- `docs/data-fetching.md` — Reads in Server Components via `/lib/db/queries` (no fetches to our own API routes), `userId` scoping for private data and `handle` scoping for public profiles, `"use cache"` with `cacheTag`/`cacheLife` for the public profile only, how mutations revalidate it, and passing data to Client Components as props. Read before writing a query, a page that loads data, or a Server Action that changes data.
- `docs/data-mutations.md` — Server Action write flow (session → Zod validation → `userId`-scoped write → `revalidatePath`/`revalidateTag` → typed `ActionResult`), per-action revalidation table, and calling actions from forms and buttons. Read before writing or changing any Server Action that writes data.
- `docs/database.md` — MongoDB + Mongoose setup: cached connection helper, model location, schema rules (strict, timestamps, `userId`/`handle` indexes) and per-user query scoping. Read before writing a model, query or Server Action that touches data.
- `docs/design-system.md` — Design tokens (colors, typography, spacing, radii) with their CSS variables and Tailwind classes, plus the Tailwind config wiring. Read before styling anything or adding or changing a token.
- `docs/errors-and-validation.md` — Zod validation at the Server Action boundary, shared schemas in `/lib/validation`, the `ActionResult` type for inline form errors, and how unexpected errors are thrown, logged and kept from the client. Read before writing a Server Action, a form or an `error.tsx`.
- `docs/routing.md` — Route map, `(auth)` and `(dashboard)` route groups, per-route `layout`/`loading`/`error` files, and when to use Route Handlers vs Server Actions. Read before adding a page, route or API endpoint.
- `docs/ui.md` — Every component with its variants and states, page layouts, and accessibility rules. Read before building or changing a component or page layout.
