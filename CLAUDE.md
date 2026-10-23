# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (also runs type checking)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, using `eslint-config-next` core-web-vitals + typescript)

- `npm test` — Vitest unit tests (watch mode; `npm test -- --run` for a single run). End-to-end QA runs through the `run-qa-suite` skill. See `docs/testing.md`.

## Stack and architecture

Freshly bootstrapped with `create-next-app`, so it has no app-specific code yet. The versions are newer than most training data: Next.js 16.4, React 19.3, Tailwind CSS v4, TypeScript (strict).

- **App Router under `src/app/`.** The path alias `@/*` maps to `./src/*`. `layout.tsx` loads the Geist fonts through `next/font` as CSS variables and types its props with the global `LayoutProps<"/">` helper. Use the generated `PageProps<...>`/`LayoutProps<...>` route types rather than hand-written prop types.
- **Cache Components is on** (`cacheComponents: true` in `next.config.ts`). Data fetching is dynamic by default. Cache explicitly with the `use cache` directive plus `cacheLife`/`cacheTag`. Partial Prerendering is the default: a static shell is served, and dynamic parts stream in behind `<Suspense>`. Do not add a `runtime` route segment export, since Cache Components requires Node. Older route segment configs like `dynamic`/`revalidate` don't apply. See `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md`.
- **`partialPrefetching: true`** means `<Link>` prefetches one shared App Shell per route. Use `<Link prefetch={true}>` only when a link needs its params/searchParams data prefetched.
- **Tailwind v4 is CSS-first.** There is no `tailwind.config` file. `globals.css` does `@import "tailwindcss"` and defines theme tokens in `@theme inline`, with light/dark values set as CSS variables on `:root`. CSS goes through the `@tailwindcss/turbopack` loader configured under `turbopack.rules` in `next.config.ts`, not PostCSS.

## Live Docs (Context7)

Before writing code that uses Next.js, React, Mongoose, NextAuth (Auth.js), Zod, Tailwind CSS or any other library, pull current docs through the Context7 MCP server first. Resolve the library with `resolve-library-id`, then query with `query-docs`. Don't rely on training data for API signatures, config options or version-specific behavior. These libraries change often, and several here are newer than most training data.

- Match the docs to the version in `package.json`. For Next.js, the docs bundled in `node_modules/next/dist/docs/` match the installed version exactly (see `AGENTS.md`). If they disagree with Context7, the bundled docs win.
- If Context7 has no entry for a library, say so before proceeding, and name the source used instead (bundled docs in `node_modules`, the package's own types, or its official site).

## React Performance (vercel-react-best-practices)

Load the `vercel-react-best-practices` skill (installed in `.agents/skills/`, linked into `.claude/skills/`) when you:

- Write or change a component, page, layout or `loading.tsx`.
- Write a Server Component or query that loads data. Check the `async-` and `server-` rules for waterfalls, `Promise.all` and serialization to Client Components.
- Add a `"use client"` boundary, an import of a heavy library, or a third-party script. Check the `bundle-` rules.
- Review, refactor or debug slow React/Next.js code, including in `plan-feature`, `create-feature` and `code-review`.

Read only the rule files in its `rules/` folder that match the task, not the whole set. The skill is general guidance, so where it conflicts with this project, the project wins:

- Project docs in `docs/` and the bundled Next.js docs override it. For example, cross-request caching uses `'use cache'` + `cacheTag` (see `docs/data-fetching.md`), not an LRU cache, and pages read data in Server Components, not with SWR.
- Don't add the packages its rules suggest (`swr`, `better-all`, `lru-cache` and so on) without asking first.
- The React Compiler is off here (no `reactCompiler` in `next.config.ts`), so the `rerender-` memoization rules apply. Use them only where a re-render problem is real, not by default.

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
- `docs/git-conventions.md` — Conventional Commits types and subject rules, `<type>/<feature>` branch names, one branch and PR per feature, no direct commits to `main`, squash merges, and required human review before merge. Read before creating a branch, writing a commit message, or opening a PR.
- `docs/routing.md` — Route map, the `(auth)` and `(dashboard)` route groups, public vs. protected routes, when to add `layout.tsx`/`loading.tsx`/`error.tsx`, and the rule that Route Handlers are only for webhooks and third-party callbacks. Read before adding a route, a route file, or a Route Handler.
- `docs/security.md` — Secrets in env vars (`.env.local` ignored, `.env.example` committed), security headers and CSP in `next.config.ts`, rate limits on sign-in and link creation, and safe rendering of user content and outbound links. Read before adding an env var, a header, a third-party resource, a repeatable action, or UI that shows user content.
- `docs/testing.md` — Vitest unit tests for pure functions and Zod schemas (`*.test.ts` next to the file), end-to-end QA through Playwright MCP and the `run-qa-suite` skill (no committed browser tests), the separate test database (`MONGODB_URI_TEST` in `.env.test`), no mocked Server Actions, and independent tests. Read before writing a test or running QA.
- `docs/ui.md` — Component specs (Button, IconButton, Input, LinkCard, Tabs, etc.), layout patterns for the dashboard, public profile, onboarding and marketing pages, plus accessibility notes. Read before building or changing any UI component or page layout.
