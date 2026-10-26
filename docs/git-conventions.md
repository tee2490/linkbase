# Git Conventions

How Linkbase uses git: commit messages, branch names and the pull request flow into `main`. The repo is hosted on GitHub (`origin`), and `main` is the default branch.

## Rules

- **Never commit straight to `main`.** Every change is made on its own branch and merged through a pull request.
- **One feature per branch.** Don't mix unrelated changes on one branch.
- **Commits follow Conventional Commits** with a short imperative subject.
- **Every PR needs a human review** and approval before it is merged.
- **History stays clean.** PRs are squash-merged, so each merged PR becomes one commit on `main`.

## Commit messages

```
<type>(<optional scope>): <subject>

<optional body: what changed and why>

<optional footer>
```

| Type | Use for |
| --- | --- |
| `feat` | A new feature or user-visible behavior |
| `fix` | A bug fix |
| `docs` | Documentation only (`/docs`, `README.md`, `CLAUDE.md`) |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `test` | Adding or changing tests only |
| `chore` | Tooling, config, dependencies and other maintenance |

Use only these six types. If a change seems to need two types, it is probably two commits.

**Subject line**

- Imperative mood: "add", "fix", "remove". Not "added" or "adds".
- Lowercase after the colon, no full stop at the end, 72 characters or fewer.
- Say what the commit does, not how: `feat: add link reordering`, not `feat: update link-list.tsx`.

**Scope** is optional. When you use one, name the feature area in kebab-case, e.g. `links`, `auth`, `profile`.

**Body** is optional. Use it when the reason for the change isn't obvious from the subject. Wrap lines at 72 characters.

**Breaking changes** add `!` after the type (`feat!: …`) and a `BREAKING CHANGE:` footer explaining what changed.

```
feat(links): add drag-and-drop reordering
fix(auth): redirect to sign-in when the session expires
docs: add security guide
refactor(profile): extract handle validation into a schema
test(links): cover not-found case in deleteLink
chore: upgrade next to 16.4.3
```

Commits written with an AI assistant may end with a `Co-Authored-By:` trailer. Keep it in the footer, after a blank line.

## Branch names

```
<type>/<feature>
```

- `<type>` is one of the six commit types.
- `<feature>` is a short kebab-case description: 2 to 4 words, lowercase, no issue numbers or personal names.

```
feat/add-links
feat/public-profile
fix/session-redirect
docs/security-guide
refactor/link-queries
chore/claude-code-setup
```

Delete a branch once its PR is merged.

## Workflow

1. **Start from an up-to-date `main`:**

   ```bash
   git switch main
   git pull
   git switch -c feat/add-links
   ```

2. **Commit in small, focused steps**, each with a Conventional Commit message.

3. **Keep the branch current.** Rebase on `main` rather than merging `main` into it, so the branch has no merge commits:

   ```bash
   git fetch origin
   git rebase origin/main
   git push --force-with-lease
   ```

   Only force-push your own feature branch, always with `--force-with-lease`. Never force-push `main`.

4. **Open a pull request** into `main` (see below).

5. **A human reviews and approves**, then squash-merges.

## Pull requests

**Title.** The PR title follows the commit format (`feat(links): add drag-and-drop reordering`), because it becomes the squash commit's subject on `main`.

**Description** covers:

- **What** changed, in a few bullets
- **Why**, or a link to the issue
- **How to test**: steps to check the change by hand
- Screenshots for UI changes
- Any docs updated in `/docs`, or why none were needed

**Before requesting review**

- [ ] The branch is rebased on the latest `main`
- [ ] `npm run lint` and `npm run build` pass
- [ ] The PR does one thing. Unrelated fixes go in their own PR
- [ ] `/docs` is updated if a convention changed, and `CLAUDE.md` lists any new doc
- [ ] No secrets, `.env.local` or generated files (`.next/`, `node_modules/`) are committed (`docs/security.md`)

## Review and merge

- **At least one human approval is required before merge.** An AI assistant may write code, commit on a feature branch and open a PR. It never approves or merges one, and it never pushes to `main`.
- The reviewer checks the change against the relevant `/docs` guides, not just whether it works.
- Address feedback with new commits on the branch. They are squashed on merge, so there's no need to rewrite history during review.
- Merge with **Squash and merge** only. Check that the squash commit message is a clean Conventional Commit before confirming.
- Delete the branch after merging.

### GitHub settings

These rules are enforced in the repository settings, not just by convention:

- Branch protection (or a ruleset) on `main`:
  - Require a pull request before merging, with at least 1 approval
  - Dismiss stale approvals when new commits are pushed
  - Require the branch to be up to date before merging
  - Block force pushes and deletions
- Merge options: allow **squash merging** only. Turn off merge commits and rebase merging.
- Turn on **Automatically delete head branches**.
