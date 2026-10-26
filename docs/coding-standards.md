# Coding standards

How Linkbase code is written: language settings, tooling, imports, components, async code and error handling. File and symbol naming lives in `docs/architecture.md`.

## TypeScript

- Everything is TypeScript with `strict: true` (set in `tsconfig.json`). Don't turn strict checks off, globally or per file.
- **No `any`.** Use a real type, a generic, or `unknown` and narrow it. Data from outside the app (form input, JSON, query params) arrives as `unknown` and is validated before use.
- **No `@ts-ignore` without a comment explaining why.** Prefer `@ts-expect-error`, which fails once the error goes away. Put the reason on the same line:

```ts
// @ts-expect-error -- library types miss the `cause` option (lib@2.1); remove after upgrade
```

## Formatting and linting

- **Prettier** formats all code. Don't hand-format or argue style in review; run Prettier. (Prettier is not installed yet. Add it with `eslint-config-prettier` so ESLint and Prettier don't fight over formatting.)
- **ESLint** uses the Next.js config (`eslint-config-next` core-web-vitals and TypeScript presets in `eslint.config.mjs`). Run `npm run lint`. Code is merged with zero lint errors.
- Don't disable a lint rule inline without a comment saying why.

## Imports

Three groups in this order, separated by a blank line:

1. External packages
2. Internal aliases (`@/lib`, `@/components`)
3. Relative imports

```ts
import { redirect } from "next/navigation";
import mongoose from "mongoose";

import { getSession } from "@/lib/auth/get-session";
import { Button } from "@/components/ui/button";

import { LinkRow } from "./link-row";
```

Use the `@/` alias for anything outside the current folder. Relative imports are for siblings and children only, never `../../`.

## Components

- Components are **function declarations** with **typed props**. Don't use arrow-function components or `React.FC`.
- Name the props type `<Component>Props`.
- **Named exports only.** The one exception is Next.js route files, which must default-export: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx` and `default.tsx`.

```tsx
type LinkCardProps = {
  title: string;
  url: string;
  onEdit?: () => void;
};

export function LinkCard({ title, url, onEdit }: LinkCardProps) {
  return (/* … */);
}
```

```tsx
// app/(dashboard)/links/page.tsx: route file, default export allowed
export default async function LinksPage() {
  /* … */
}
```

## Async code

Always `async`/`await`. **Never `.then()` chains.** Run independent work in parallel with `Promise.all`, not sequential `await`s.

```ts
// ✗
getLinks(userId).then((links) => render(links));

// ✓
const [links, profile] = await Promise.all([getLinks(userId), getProfile(userId)]);
```

Don't leave promises floating. Either `await` them or make it explicit with `void` when fire-and-forget is intended.

## Errors

- **Throw real `Error` objects, never strings** or plain objects. Strings lose the stack trace.
- Pass the original error as `cause` when wrapping one.
- In a `catch`, the error is `unknown`. Narrow it (`err instanceof Error`) before reading properties.

```ts
// ✗
throw "Link not found";

// ✓
throw new Error("Link not found");

try {
  await connectDb();
} catch (err) {
  throw new Error("Database connection failed", { cause: err });
}
```
