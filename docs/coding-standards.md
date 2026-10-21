# Linkbase Coding Standards

Language, tooling and code-style rules for everything under `src/`. File and folder naming is in `docs/architecture.md`.

---

## Tooling

| Tool | Setup | Run |
|---|---|---|
| TypeScript | `strict: true` in `tsconfig.json` | `npm run build` (type-checks) |
| ESLint | `eslint.config.mjs`, using `eslint-config-next` (`core-web-vitals` + `typescript`) | `npm run lint` |
| Prettier | **Not installed yet.** Add `prettier` as a dev dependency with a `.prettierrc`, plus `eslint-config-prettier` so ESLint doesn't fight Prettier over formatting | `npx prettier --write .` |

- All code is TypeScript (`.ts`/`.tsx`). No `.js` files in `src/`.
- Don't hand-format. Let Prettier decide, and don't argue with it in review.
- Code must pass `npm run lint` and `npm run build` with no errors before it's committed.

## Imports

Three groups, in this order, separated by a blank line:

1. External packages (`react`, `next/*`, `mongoose`, `lucide-react`, ...)
2. Internal aliases (`@/lib/...`, then `@/components/...`)
3. Relative imports (`./`, `../`)

```ts
import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { requireUserId } from "@/lib/auth";
import { LinkModel } from "@/lib/db/models/link";
import { Button } from "@/components/ui/button";

import { LinkRow } from "./link-row";
```

- Use the `@/` alias for anything outside the current feature folder. Don't use deep relative paths like `../../../lib`.
- Use `import type` for type-only imports.

## Components

- **Function declarations**, not arrow functions assigned to a const.
- **Typed props** through a named `Props` type (or `<Component>Props` when it's exported).
- **Named exports only.** The exception is Next.js files that require a default export.

```tsx
type LinkRowProps = {
  title: string;
  url: string;
  onDelete?: () => void;
};

export function LinkRow({ title, url, onDelete }: LinkRowProps) {
  return (/* ... */);
}
```

Files that use a default export, because the framework requires it:

- Route files in `app/`: `page.tsx`, `layout.tsx`, `template.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `default.tsx`, and metadata image files.
- `src/proxy.ts` and config files (`next.config.ts`, `eslint.config.mjs`).

`route.ts` files use named exports (`GET`, `POST`), not a default. Pages and layouts type their props with the generated `PageProps<"/route">` and `LayoutProps<"/route">` helpers rather than hand-written types.

## Async code

- Use `async`/`await`. Never chain `.then()`/`.catch()`.
- Run independent work in parallel with `await Promise.all([...])` instead of awaiting one at a time.
- Don't leave a promise floating. Either `await` it or `void` it deliberately with a comment saying why.

```ts
// Good
const [user, links] = await Promise.all([getUser(userId), getLinks(userId)]);

// Bad
getUser(userId).then((user) => /* ... */);
```

## Errors

- Throw real `Error` objects (or subclasses), never strings or plain objects. They carry a stack trace and `instanceof` checks work.
- Write messages that say what failed: `new Error("Link not found")`, not `new Error("error")`.
- In a `catch`, the error is `unknown`. Narrow it with `instanceof Error` before reading `.message`.
- Don't swallow errors. Handle them, or rethrow with context using `cause`.

```ts
// Good
throw new Error("Link not found");

try {
  await connectToDatabase();
} catch (error) {
  throw new Error("Database connection failed", { cause: error });
}

// Bad
throw "Link not found";
```

## Type safety

- **No `any`.** Use `unknown` and narrow it, a generic, or a precise type. For data from outside (form data, params, JSON), validate it and derive the type from the validated value.
- **No `@ts-ignore` without a comment explaining why.** Prefer `@ts-expect-error`, which fails once the error goes away, and put the reason on the same line:

  ```ts
  // @ts-expect-error -- library types are missing `foo` (upstream issue #123)
  ```

- Avoid non-null assertions (`!`) and `as` casts. If one is unavoidable, add a comment saying why it's safe.
- Prefer `type` aliases for props and object shapes; use `interface` only when you need declaration merging.
