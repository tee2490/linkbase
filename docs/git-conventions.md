# Linkbase Git Conventions — Commits, Branches and Pull Requests

How changes get from a working tree into `main`.

---

## Workflow

1. Start from an up-to-date `main`: `git switch main && git pull`.
2. Create a branch for one feature or fix: `git switch -c feat/add-links`.
3. Commit in small, focused steps.
4. Push the branch and open a pull request into `main`.
5. A human reviews and approves the PR.
6. Squash-merge, then delete the branch.

**Never commit directly to `main`.** Every change, including docs and config, goes through a branch and a PR.

## Branches

Name branches `<type>/<short-description>`, using the commit types below and a kebab-case description of the feature:

| Branch | For |
|---|---|
| `feat/add-links` | A new feature |
| `fix/session-redirect` | A bug fix |
| `docs/auth-guide` | Documentation only |
| `refactor/link-queries` | Restructuring without changing behavior |
| `test/link-actions` | Adding or fixing tests |
| `chore/claude-code-setup` | Tooling, config, dependencies |

- One feature or fix per branch. If a branch starts covering two things, split it.
- Keep the description short (two to four words), lowercase, with hyphens.
- Keep branches short-lived. Rebase on `main` if it has moved on: `git fetch && git rebase origin/main`.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <subject>

<optional body: what and why>

<optional footer>
```

| Type | Use for |
|---|---|
| `feat` | A new feature or user-visible capability |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `test` | Adding or updating tests |
| `chore` | Tooling, config, dependencies, build, anything else |

Subject rules:

- **Imperative mood**: "add", not "added" or "adds". It should complete the sentence "This commit will…".
- **Short**: 50 characters or fewer is the target, 72 is the hard limit.
- Lowercase after the colon, no trailing period.
- The scope is optional and names the area: `auth`, `links`, `profile`, `db`, `ui`.

```
feat(links): add drag-to-reorder on dashboard
fix(auth): redirect to callback url after sign-in
docs: add data mutations guide
refactor(db): move link queries into lib/db/queries
test(links): cover addLink validation errors
chore: add zod and mongoose dependencies
```

- **Body:** explain *what* changed and *why* when the subject isn't enough. Wrap at 72 characters.
- **Breaking changes:** add `!` after the type (`feat(db)!: rename handle field`) and a `BREAKING CHANGE:` footer describing the migration.
- **One logical change per commit.** Don't mix a refactor with a feature, or formatting with a fix.
- Every commit should pass `npm run lint` and `npm run build` (see `docs/coding-standards.md`).
- Never commit secrets or `.env.local` (see `docs/security.md`).

## Pull requests

- **Title:** a Conventional Commit subject, such as `feat(links): add link creation`. With squash merging, it becomes the commit on `main`.
- **Description:** what changed, why, how it was tested, and screenshots for UI changes. Link the related issue if there is one.
- **Size:** small enough to review in one sitting. Split large features into stacked PRs.
- **Checks:** lint and build must pass before review.
- **Doc updates:** if the change affects a convention in `docs/`, update the doc in the same PR.

### Review and merge

- **Every PR needs approval from a human reviewer before merge.** No self-merging without review, and AI agents never merge PRs. They may open PRs and push to feature branches, but the merge is a human decision.
- Address review comments with new commits on the branch. They're squashed away on merge.
- **Merge with squash** so `main` keeps one clean, conventional commit per PR. Don't use merge commits, and don't force-push to `main`.
- Delete the branch after merging.

Recommended GitHub branch protection on `main`: require a pull request, require one approval, require status checks to pass, and block force pushes.
