---
name: create-feature
description: Build a Linkbase feature from its approved plan in ./plans/<current-branch>.md, following the project docs and live library docs from Context7. Writes code only, with no tests, no QA and no commits, then reports in 2–3 lines and hands back. Use whenever the user starts building, implementing or coding an approved or planned feature, for example "build it", "go ahead", "implement the plan", "start coding" or "let's build X" after a plan has been approved.
---

# Create a feature

Build the feature exactly as the approved plan describes. **Write code only.** Don't write tests, don't run QA, and don't commit. The user triggers `write-tests` and `run-qa-suite` separately, when they're ready.

## 1. Load the approved plan

1. Get the branch: `git branch --show-current`.
2. Read `./plans/<branch>.md` (for `feat/add-links`, that's `plans/feat/add-links.md`).
3. If there's no plan file, or the plan wasn't approved, stop. Suggest running `plan-feature` first. Don't build from a conversation summary.
4. If the branch is `main`, stop. Features are built on their own branch (see `docs/git-conventions.md`).

The plan's **Files** table is the scope of work. Its **Out of scope** section lists what not to build.

## 2. Read the docs

Before writing any code, read:

- Every doc listed under the plan's **Docs followed**.
- `docs/coding-standards.md` and `docs/architecture.md`, always.
- Any other doc in `CLAUDE.md`'s Project Docs list that covers what you're about to touch, even if the plan missed it. For example, read `docs/data-mutations.md` before writing a Server Action and `docs/ui.md` before building a component.

## 3. Pull live library docs

Follow the "Live Docs (Context7)" rule in `CLAUDE.md`. Before writing code that uses a library API (Next.js, React, Mongoose, NextAuth, Zod, Tailwind and so on):

1. Resolve the library with `resolve-library-id`, then query the specific API with `query-docs`.
2. Match the version in `package.json`. For Next.js, the bundled docs in `node_modules/next/dist/docs/` win if they disagree with Context7.
3. If Context7 has no entry for a library, say so and name the source used instead.

Don't write library calls from memory.

## 4. Build

- **Follow the plan's file list.** Create and change only the files it names, in a sensible order: types and validation schemas, models, query functions, Server Actions, then pages and components.
- **Follow the docs.** In particular:
  - Every Server Action follows the five steps in `docs/data-mutations.md`.
  - Every query is scoped by `userId` or `handle`.
  - Client Components get data only as props.
  - User content is rendered safely and external links use `rel="noopener noreferrer"`.
- **Install only the dependencies the plan names.** If another package seems necessary, ask first.
- **Don't edit `.env` or `.env.local`.** If the feature needs a new env var, add it to `.env.example` and tell the user to set the real value.
- **Stay in scope.** If the build needs a file or decision the plan doesn't cover, stop and ask. When the user agrees, update `plans/<branch>.md` to match before continuing. Don't refactor unrelated code.
- **Make sure it compiles.** Run `npm run lint` and `npm run build` and fix any errors in the code you wrote. This is a build check, not QA: don't start the dev server or click through scenarios.

## 5. Stop and hand back

When the plan's files are built and lint and build pass:

- **Don't** write tests, run the QA scenarios, start the app, commit or push.
- Report in **2–3 lines**: what was built, any deviation from the plan or anything left for the user (such as an env var to set), and that it's ready for `write-tests` or `run-qa-suite`.

Example:

> Built link creation: `addLink` action, `linkInputSchema`, `/add-links` page and `AddLinkForm`, per `plans/feat/add-links.md`. Lint and build pass; no deviations from the plan.
> Ready for `write-tests` or `run-qa-suite` when you are.

If lint or build still fail after a reasonable attempt, report the failure and the error output in those lines instead. Don't claim the build is done.
