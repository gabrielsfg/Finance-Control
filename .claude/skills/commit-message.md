# Skill: Write a commit message

Write a commit message for the current changes, following
[Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

## Format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footers]
```

### Allowed types

| Type | When to use |
|------|-------------|
| `feat` | Introduces a new feature (MINOR in semver) |
| `fix` | Fixes a bug (PATCH in semver) |
| `refactor` | Restructures code without changing behaviour |
| `perf` | Improves performance |
| `docs` | Documentation only |
| `style` | Formatting, whitespace, semicolons — no logic change |
| `test` | Adds or adjusts tests |
| `build` | Build system, dependencies, packaging |
| `ci` | Pipelines and CI configuration |
| `chore` | Maintenance that fits none of the above |
| `revert` | Reverts a previous commit |

### Scope

A noun in parentheses naming the part of the codebase affected. In this
monorepo, prefer the app when the change is local (`api`, `web`, `mobile`) and
the domain when it spans apps (`transactions`, `investments`, `auth`,
`analytics`, `budgets`, `goals`, `recurrences`, `theme`, `ui`).

Combine both with a slash when it helps: `feat(mobile/transactions):`.
Drop the scope when the change really is global.

### Description

- Imperative mood: "add", "fix", "remove" — never "added"/"fixing"
- Starts lowercase, no trailing period
- The whole subject line (`type(scope): description`) fits in **72 characters**

### Body

- Separated from the description by **one blank line**
- Bullet points explaining the **why** and the **what**
- Omit the body when the description already says enough
- If the change touches both frontend and backend, mention both

### Footers

- Separated from the body by one blank line
- Token uses hyphens instead of spaces (`Reviewed-by:`, `Refs:`), except `BREAKING CHANGE`
- Breaking change: `!` before the colon **and/or** a `BREAKING CHANGE: <description>`
  footer (`BREAKING CHANGE` is always uppercase)
- Never add `Co-Authored-By` — the user adds it manually if they want it

## Steps

1. Run in parallel:
   - `git diff --cached` for staged changes
   - `git diff` for unstaged changes
   - `git status` to list modified/new/deleted files
   - `git log --oneline -10` to pick up the project's commit style

2. Analyse every change, classify the main type and identify the scope.

3. Check for a **breaking change** (changed API contract, removed DTO/field,
   changed public signature) and flag it with `!` and/or a footer.

4. **Before** the message, write a short summary of what changed, in the
   language the user is speaking (Portuguese):
   - 3 to 6 bullet points, grouped by area (API, Web, Mobile) or by theme
   - Focus on impact and reasoning, not on listing files
   - It is a recap for the user to check before committing, not the message itself

5. Present the final message in a code block so it is easy to copy.

6. If the changes are clearly independent of each other, suggest at the end how
   to split them into separate commits — without running anything.

## Rules

- Never run `git commit` — only write the message
- If nothing is staged or unstaged, tell the user
- The recap is written in the user's language; the commit message is **always in English**

## Examples

```
feat(mobile/transactions): paginate the transactions feed

- Replace the load-everything-then-filter-locally list with a paged feed
- Totals come from the server so they stay correct mid-scroll
```

```
fix(api): break sort ties by id to stop duplicated rows across pages
```

```
feat(api)!: return paged results from GET /transactions

BREAKING CHANGE: the endpoint now returns `{ items, totalPages }` instead of
a bare array. Clients reading the response as a list must be updated.
```
