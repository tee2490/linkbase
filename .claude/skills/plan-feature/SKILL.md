---
name: plan-feature
description: Plan a new Linkbase feature before any code is written. Enters Plan Mode, produces a short technical plan (files to create or change, grounded in the project docs) ending with QA scenarios, waits for explicit approval, then saves the plan to ./plans/<current-branch>.md. Use whenever the user starts planning, scoping, designing or kicking off a new feature, page, route, Server Action or model, or asks "how should we build X", "let's add X", "plan X" or "what would it take to X", even if they don't say "plan".
---

# Plan a feature

Run this at the start of every new feature, before any code is written. The output is a short plan the user approves. **No code, no file edits and no installs until the user explicitly approves the plan.**

## 1. Enter Plan Mode

Call `EnterPlanMode` first, before reading files or researching. In Plan Mode you can read and search but not edit, which enforces the no-code rule.

If the request is too vague to plan (unclear what the feature does or who uses it), ask up to three short questions before going further.

## 2. Read the docs that apply

Read the docs before deciding anything, so the plan follows project conventions. Always read:

- `docs/architecture.md`: folder layout, Server vs. Client Components, naming
- `docs/database.md`: models, connection, `userId` scoping
- `docs/coding-standards.md`: TypeScript, imports, component style

Then read the docs for the feature's area:

| If the feature… | Read |
|---|---|
| Adds or changes a page, route, layout or Route Handler | `docs/routing.md` |
| Touches sign-in, sessions, protected routes or ownership | `docs/auth.md` |
| Loads data for a page | `docs/data-fetching.md` |
| Writes data (create, update, delete) | `docs/data-mutations.md`, `docs/errors-and-validation.md` |
| Has a form or user input | `docs/errors-and-validation.md` |
| Adds env vars, third-party resources, repeatable actions, or shows user content | `docs/security.md` |
| Builds UI | `docs/ui.md`, `docs/design-system.md` |

Also look at the existing code the feature will touch. Follow the "Live Docs (Context7)" rule in `CLAUDE.md` for any library API the plan depends on.

## 3. Write the plan

Keep it short: one screen if possible. Use this structure:

```markdown
# Plan: <feature name>

**Branch:** <current branch>
**Goal:** <one or two sentences on what the user can do when this ships>

## Docs followed
- `docs/<file>.md`: <the convention that shapes this plan>

## Files
| Action | Path | Purpose |
|---|---|---|
| Create | `src/...` | ... |
| Change | `src/...` | ... |

## Approach
- <key decisions, in order: model, validation, action, page, UI>
- <cache tags to clear, routes to protect, rate limits, where relevant>

## Out of scope
- <what this plan deliberately leaves out>

## Open questions
- <anything the user must decide; omit if none>

## QA Scenarios
1. **Happy path:** <what the user does> → <what should happen>
2. **Auth boundary:** <what the user does> → <what should happen>
3. **Validation:** <what the user does> → <what should happen>
4. **Edge case:** <what the user does> → <what should happen>
```

Rules for the plan:

- **Every file** is listed with its full path under `src/` and named per `docs/architecture.md` (kebab-case files, verb-first Server Actions).
- **Cite the docs** that shaped each decision. If the plan has to break a documented convention, say which one and why.
- **QA Scenarios: 3 to 6**, one line each, covering at least the happy path, an auth boundary (signed out, or another user's data), validation (bad or missing input) and one edge case (empty state, duplicate, limit reached). Make them concrete: real inputs and visible results, not "it works".

## 4. Get approval

Present the plan with `ExitPlanMode`. Then wait.

- Proceed only on explicit approval ("approved", "go ahead", "looks good, build it").
- If the user asks for changes, revise the plan and present it again. Don't start coding on a partial approval.
- Silence, a question, or a comment on one detail is not approval.

## 5. Save the plan

After approval and before writing any code:

1. Get the branch name: `git branch --show-current`.
2. If the branch is `main`, stop and suggest a feature branch per `docs/git-conventions.md` (for example `feat/add-links`). Create it only after the user agrees, then use the new name.
3. Write the approved plan, exactly as approved, to `./plans/<branch>.md`. Branch names contain a slash, so `feat/add-links` is saved as `plans/feat/add-links.md`; create the folder if needed.
4. Tell the user the path, then hand off to implementation.

When implementing, follow the plan's file list. If the work needs a file or decision that isn't in the plan, say so and update `plans/<branch>.md` before going further.
