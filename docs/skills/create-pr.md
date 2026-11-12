# Open a pull request

Follow [commit and PR conventions](../conventions.md) and the [PR template](../../.github/pull_request_template.md).

1. Confirm the current branch is not `main` and targets `main`; stop if it is `main`.
2. Confirm all work is committed, the working tree is clean, and the branch is pushed and up to date with its remote. Push outstanding commits before proceeding.
3. Run the full checks available for this feature (lint, format, types, tests, coverage, build and relevant migration checks). Record commands, results and any unavailable checks. Fix failures before opening a PR.
4. Choose the type from `docs/conventions.md`; write a lowercase imperative title describing the whole PR, at most 72 characters.
5. Using the commits, approved feature spec and `tasks.md`, fill every template section: 3-7 Summary bullets; Changes grouped by area with key files; Linked issue and spec; Testing with commands, results and coverage; Next steps with follow-ups, open questions, limitations and the next feature when clear; and the Checklist.
6. Write the body to a temporary file outside the repository. If `gh` is installed and authenticated, run `gh pr create --title "<title>" --body-file <file> --base main`; output the PR URL.
7. If `gh` is missing or unauthenticated, do not open a PR; output the complete title and body for Zack to paste.

Never merge the PR.
