# Linkbase Architecture — Structure and Conventions

How the app is organized and how files are named. All paths are under `src/` (the `@/*` alias maps to `./src/*`).

---

## Rendering model

- **App Router.** Routes live in `src/app/`.
- **Server Components by default.** Every component is a Server Component unless it needs interactivity.
- **Client Components only where needed.** Add `"use client"` only for state, effects, event handlers or browser APIs. Keep the client boundary as low in the tree as possible: render a small client leaf inside a server parent rather than marking a whole page as client.

## Folder layout

```
src/
├── app/                  # Routes, layouts, route handlers
├── components/
│   ├── ui/               # UI primitives (Button, Input, Switch, ...)
│   └── [feature]/        # Feature components, one folder per feature
└── lib/
    ├── db/               # Database client
    ├── auth/             # Auth helpers
    └── types/            # Shared types
```

- **`lib/`** holds shared, non-UI code. The database client, auth helpers and types each get their own folder.
- **`components/ui/`** holds generic primitives with no feature knowledge. Specs are in `docs/ui.md`.
- **`components/[feature]/`** holds components tied to one feature, for example `components/links/`.

## Naming

| What | Convention | Example |
|---|---|---|
| Files | kebab-case | `link-card.tsx`, `get-session.ts` |
| Components | PascalCase | `LinkCard`, `IconButton` |
| Server Actions | verb-first camelCase | `createLink`, `updateProfile`, `deleteLink` |
