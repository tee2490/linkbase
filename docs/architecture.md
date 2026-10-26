# Architecture

How Linkbase is structured: the rendering model, where code lives, and how files and symbols are named. Styling and components are covered in `docs/design-system.md` and `docs/ui.md`.

## Rendering model

The app uses the Next.js App Router (`/app`).

- **Server Components are the default.** Every component is a Server Component unless it needs interactivity. Fetch data and call `/lib` code directly from them.
- **Client Components only where interactivity is needed**, meaning state, effects, event handlers or browser APIs. Mark them with `"use client"` at the top of the file.
- Keep Client Components small and as low in the tree as possible. Pass server-fetched data into them as props rather than turning a whole page into a Client Component.
- Mutations go through Server Actions (`"use server"`).

## Folder structure

```
app/                 Routes, layouts and pages (App Router)
components/
  ui/                UI primitives (Button, Input, Card…), no feature logic
  [feature]/         Feature components, one folder per feature (e.g. components/links/)
lib/
  db/                Database client
  auth/              Auth helpers
  types/             Shared TypeScript types
  validation/        Shared Zod schemas (see docs/errors-and-validation.md)
docs/                Project documentation
```

- **`/lib`** holds shared code. The database client, auth helpers and types each get their own folder, so don't put them loose in `/lib`.
- **`/components/ui`** holds reusable primitives that know nothing about a feature.
- **`/components/[feature]`** holds components belonging to one feature. They may compose `ui` primitives. A `ui` primitive never imports from a feature folder.

## Naming

| What | Convention | Example |
| --- | --- | --- |
| Files and folders | kebab-case | `link-card.tsx`, `lib/auth/get-session.ts` |
| Components | PascalCase | `export function LinkCard()` |
| Server Actions | verb-first camelCase | `createLink`, `updateProfile`, `deleteCollection` |
