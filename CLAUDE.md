@AGENTS.md

## Doc Convention

Project documentation lives in `/docs`. Whenever a new file is created in `/docs`, add it to the Project Docs section below with one line on what it covers and when to read it.

## Project Docs

- `docs/architecture.md` — App Router rendering model (Server vs Client Components), folder structure for `/app`, `/components` and `/lib`, and naming conventions. Read before creating new files, routes, components or Server Actions.
- `docs/data-fetching.md` — Reads in Server Components via `/lib/db/queries` (no fetches to our own API routes), `userId` scoping for private data and `handle` scoping for public profiles, `"use cache"` with `cacheTag`/`cacheLife` for the public profile only, how mutations revalidate it, and passing data to Client Components as props. Read before writing a query, a page that loads data, or a Server Action that changes data.
- `docs/data-mutations.md` — Server Action write flow (session → Zod validation → `userId`-scoped write → `revalidatePath`/`revalidateTag` → typed `ActionResult`), per-action revalidation table, and calling actions from forms and buttons. Read before writing or changing any Server Action that writes data.
- `docs/database.md` — MongoDB + Mongoose setup: cached connection helper, model location, schema rules (strict, timestamps, `userId`/`handle` indexes) and per-user query scoping. Read before writing a model, query or Server Action that touches data.
- `docs/design-system.md` — Design tokens (colors, typography, spacing, radii) with their CSS variables and Tailwind classes, plus the Tailwind config wiring. Read before styling anything or adding or changing a token.
- `docs/ui.md` — Every component with its variants and states, page layouts, and accessibility rules. Read before building or changing a component or page layout.
