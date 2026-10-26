---
name: plan-feature
description: Plan a new Linkbase feature before any code is written. Use whenever the user starts, scopes, designs or plans a new feature, page, route, component, Server Action or data model ("let's build...", "I want to add...", "plan the X feature", "how should we implement..."). Enters Plan Mode, produces a short file-level plan grounded in /docs with QA scenarios, waits for approval, then saves it to ./plans/<branch>.md.
---

# Plan a feature

Run this at the start of every new feature. No code is written until the user approves the plan.

## 1. Enter Plan Mode

Call `EnterPlanMode` before doing anything else. Stay read-only until the plan is approved: no edits, no new files, no installs.

## 2. Read the relevant docs

Always read:

- `docs/architecture.md`: folder structure, naming, Server vs Client Components
- `docs/database.md`: models, schema rules, `userId`/`handle` scoping

Then read the docs for the feature area. Use the Project Docs list in `CLAUDE.md` to pick them:

| Feature touches | Read |
| --- | --- |
| New page, route or API endpoint | `docs/routing.md` |
| Sessions, protected routes, ownership | `docs/auth.md` |
| Loading data in a page | `docs/data-fetching.md` |
| Server Actions that write data | `docs/data-mutations.md`, `docs/errors-and-validation.md` |
| Forms and validation | `docs/errors-and-validation.md` |
| Components or layouts | `docs/ui.md`, `docs/design-system.md` |
| Env vars, user content, abusable actions | `docs/security.md` |

Look at the existing code in the affected folders so the plan matches what's already there.

If the feature loads data or adds components, pages or Server Actions, skim the CRITICAL and HIGH rule names in the `vercel-react-best-practices` skill (`async-`, `bundle-`, `server-`). Then plan the server/client split and any parallel data loading up front. Put any notable choice in the plan's Notes.

## 3. Write the plan

Keep it short. Use this structure:

```markdown
# <Feature name>

**Branch:** <current branch>
**Docs followed:** docs/architecture.md, docs/database.md, <feature-area docs>

## Goal
One or two sentences on what the feature does for the user.

## Files
### Create
- `path/to/file.ts`: what it holds and why
### Change
- `path/to/file.ts`: what changes

## Notes
Only decisions that need a reason: data shape, auth/ownership checks, revalidation, anything that departs from a doc. Cite the doc for each convention it follows.

## QA Scenarios
1. **Happy path:** user does X → Y happens.
2. **Auth boundary:** signed-out user or another user's data → expected redirect or rejection.
3. **Validation:** invalid input → inline error, nothing saved.
4. **Edge case:** ...
```

QA Scenarios must have 3 to 6 entries. Cover at least the happy path, an auth boundary, validation and one edge case. Each one is a single line: what the user does → what should happen.

## 4. Get approval

Present the plan with `ExitPlanMode`. Wait for explicit approval. If the user asks for changes, revise and present it again. Write no code until the plan is approved.

## 5. Save the plan

After approval, and before writing any feature code:

1. Run `git branch --show-current` to get the branch name.
2. Replace `/` in the name with `-` so `feat/link-editor` becomes `feat-link-editor`.
3. Write the approved plan to `./plans/<branch>.md`, creating `plans/` if needed.
4. Tell the user where the plan was saved, then hand off to the `create-feature` skill to build it.

If `git branch --show-current` prints nothing (detached HEAD) or you're on `main`, stop and ask the user to create a feature branch first. `docs/git-conventions.md` requires one branch per feature.
