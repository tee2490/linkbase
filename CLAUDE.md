# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (also runs type checking)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, using `eslint-config-next` core-web-vitals + typescript)

No test framework is set up yet.

## Stack and architecture

Freshly bootstrapped with `create-next-app`, so it has no app-specific code yet. The versions are newer than most training data: Next.js 16.4, React 19.3, Tailwind CSS v4, TypeScript (strict).

- **App Router under `src/app/`.** The path alias `@/*` maps to `./src/*`. `layout.tsx` loads the Geist fonts through `next/font` as CSS variables and types its props with the global `LayoutProps<"/">` helper. Use the generated `PageProps<...>`/`LayoutProps<...>` route types rather than hand-written prop types.
- **Cache Components is on** (`cacheComponents: true` in `next.config.ts`). Data fetching is dynamic by default. Cache explicitly with the `use cache` directive plus `cacheLife`/`cacheTag`. Partial Prerendering is the default: a static shell is served, and dynamic parts stream in behind `<Suspense>`. Do not add a `runtime` route segment export, since Cache Components requires Node. Older route segment configs like `dynamic`/`revalidate` don't apply. See `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`.
- **`partialPrefetching: true`** means `<Link>` prefetches one shared App Shell per route. Use `<Link prefetch={true}>` only when a link needs its params/searchParams data prefetched.
- **Tailwind v4 is CSS-first.** There is no `tailwind.config` file. `globals.css` does `@import "tailwindcss"` and defines theme tokens in `@theme inline`, with light/dark values set as CSS variables on `:root`. CSS goes through the `@tailwindcss/turbopack` loader configured under `turbopack.rules` in `next.config.ts`, not PostCSS.

## Doc Convention

Project reference docs live in `docs/`. Whenever a new file is created in `docs/`, add it to the Project Docs list below with one line on what it covers and when to read it.

## Project Docs

- `docs/architecture.md` — Rendering model (Server Components by default), folder layout for `app/`, `components/` and `lib/`, and naming conventions for files, components and Server Actions. Read before creating new files, folders, components or Server Actions.
- `docs/auth.md` — NextAuth setup and security practices, route protection with `proxy.ts` (dashboard protected by default, `/user/[handle]` public), and per-action identity checks with `requireUserId()`. Read before adding a route, a Server Action, or anything that reads the session.
- `docs/coding-standards.md` — TypeScript strict mode, Prettier and ESLint, import order, component style (function declarations, typed props, named exports), async/await, error handling, and the no-`any`/`@ts-ignore` rules. Read before writing or reviewing any code.
- `docs/data-fetching.md` — Reads in Server Components through `server-only` query functions in `lib/db/queries/`, user/handle scoping, DTOs as props for Client Components, and caching with `'use cache'` + `cacheTag`, cleared by `updateTag`/`revalidateTag` after mutations. Read before writing a query, a page that loads data, or a mutation that changes cached data.
- `docs/data-mutations.md` — The five steps of every Server Action (session, Zod validation, `userId` scoping, write, `updateTag`/`revalidateTag`/`revalidatePath`), the `ActionResult` type with data or errors, and a pre-merge checklist. Read before writing or changing any Server Action that writes data.
- `docs/database.md` — MongoDB with Mongoose: the cached connection helper in `lib/db/`, models in `lib/db/models/`, schema rules (strict mode, timestamps, `userId`/`handle` indexes) and scoping every query to the signed-in user. Read before writing a model, a query or a Server Action that touches the database.
- `docs/design-system.md` — Design foundations: color, typography, spacing, radius, shadow, breakpoint and motion tokens with their Tailwind v4 keys. Read before adding theme tokens to `globals.css` or choosing colors, type sizes or spacing.
- `docs/errors-and-validation.md` — Zod validation at the Server Action boundary with shared schemas in `lib/validation/`, the typed `ActionResult` returned for inline field errors, thrown unexpected errors caught by `error.tsx`, logging via `onRequestError`, and never exposing raw errors to the client. Read before writing a Server Action, a form, or an `error.tsx`.
- `docs/routing.md` — Route map, the `(auth)` and `(dashboard)` route groups, public vs. protected routes, when to add `layout.tsx`/`loading.tsx`/`error.tsx`, and the rule that Route Handlers are only for webhooks and third-party callbacks. Read before adding a route, a route file, or a Route Handler.
- `docs/ui.md` — Component specs (Button, IconButton, Input, LinkCard, Tabs, etc.), layout patterns for the dashboard, public profile, onboarding and marketing pages, plus accessibility notes. Read before building or changing any UI component or page layout.
