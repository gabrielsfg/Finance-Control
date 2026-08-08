# Skill: Write a merge/PR message

Write a PR title and description for the current branch compared to main.
The **title follows [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)**,
same as the `commit-message` skill — it becomes the squash merge message.

## Steps

1. Run in parallel:
   - `git log main..HEAD --oneline` to list every commit on the branch
   - `git diff main...HEAD --stat` to see the files touched and the volume of change
   - `git rev-parse --abbrev-ref HEAD` to get the current branch name
   - `git log main..HEAD --pretty=format:"%s"` to list the commit subjects

2. Use the branch name to identify the overall context
   (e.g. `feat/connect-brapi` → Brapi API integration).

3. Group the commits by theme/area to build a coherent summary.

4. Write the **PR title** in Conventional Commits format:

   ```
   <type>[scope][!]: <description>
   ```

   - Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `style`, `test`, `build`,
     `ci`, `chore`, `revert`
   - Scope: app (`api`, `web`, `mobile`) or domain (`transactions`, `auth`,
     `analytics`, …); combine with a slash when it helps (`feat(mobile/transactions):`)
   - Description in English, imperative, lowercase, no trailing period
   - Whole subject within **72 characters**
   - Use the type that covers the branch **as a whole**: if it ships new
     functionality, it is `feat` even when it carries fixes and refactors along the way
   - Flag a breaking change with `!` in the title and a `BREAKING CHANGE:` footer in the body

5. Write the **PR description**:

   ```
   ## Summary

   <1-3 sentences describing the overall goal of the branch>

   ## Changes

   ### <Area/Theme 1>
   - <change>
   - <change>

   ### <Area/Theme 2>
   - <change>

   ## Test plan

   - <how to validate>
   ```

   - The Summary explains the **why** of the branch, not just the what
   - Group related changes into sections named by area or theme
   - The Test plan covers the areas actually affected by the changes
   - If there is a breaking change, close the body with a `BREAKING CHANGE: <description>` footer

6. **Before** all of it, write a short recap of what the branch delivers, in the
   language the user is speaking (Portuguese) — 3 to 6 bullet points focused on
   impact, so the user can check it at a glance.

7. Present title and body in separate code blocks so they are easy to copy.

## Rules

- Never run `git merge`, `git push` or `gh pr create` — only write the messages
- If the branch has no commits ahead of main, tell the user
- The recap is written in the user's language; the PR title and body are **always in English**

## Title example

```
feat(mobile/transactions): paginate the feed and filter server-side
```
