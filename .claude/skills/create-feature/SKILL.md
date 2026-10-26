---
name: create-feature
description: Build a Linkbase feature from its approved plan. Use whenever the user starts building, implementing or coding a feature that has an approved plan ("build it", "implement the plan", "start coding the X feature", "go ahead" after plan approval). Reads the plan in ./plans/<branch>.md and the relevant /docs, pulls live library docs through Context7, writes the code, then stops and reports. Does not write tests, run QA or commit.
---

# Build a feature

Run this after a plan is approved. Its only job is to write the feature code.

**Out of scope:** writing tests, running QA, committing, pushing or opening PRs. The user triggers `write-tests` and `run-qa-suite` separately when ready.

## 1. Load the approved plan

1. Run `git branch --show-current` and replace `/` with `-` to get the plan name.
2. Read `./plans/<branch>.md`.
3. If there's no plan file, stop and suggest running `plan-feature` first. Don't build without an approved plan.

The plan is the scope. Build the files it lists and nothing more. If something in the plan turns out to be wrong or incomplete while you build, stop and ask before departing from it.

## 2. Read the docs

Read every doc listed under **Docs followed** in the plan. Always include `docs/coding-standards.md`, plus `docs/architecture.md` and `docs/database.md` if the plan didn't list them.

This project uses a Next.js version with breaking changes. Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/`, as `AGENTS.md` requires, and follow its deprecation notices.

## 3. Pull live library docs with Context7

For each library API the feature uses (Next.js, React, Mongoose, NextAuth, Zod, Tailwind and so on):

1. Call `mcp__context7__resolve-library-id` with the library name and what you need.
2. Call `mcp__context7__query-docs` with the chosen ID, one concept per query.

Do this even for APIs you think you know. If the project docs and the library docs disagree, follow the version installed in `package.json` and mention the conflict in the report.

## 4. Build

Work through the plan's **Create** and **Change** lists in order: models and validation schemas first, then queries and Server Actions, then components and pages.

Follow `/docs` exactly: folder locations, naming, `userId` scoping, Zod at the Server Action boundary, `ActionResult` returns, revalidation and safe rendering of user content. Match the style of the code around each change.

When the code is written, run the project's typecheck and lint scripts from `package.json` and fix any errors in the files you touched. This is a compile check, not QA.

## 5. Stop and report

Report in 2 to 3 lines: what was built, which files were created or changed, and anything that departed from the plan or needs the user's attention. Then hand back. Don't start tests, QA or a commit.
