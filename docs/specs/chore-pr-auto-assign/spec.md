# PR auto-assignment maintenance

## Status
Approved by Zack's explicit request for this maintenance change.

## Acceptance criteria
1. Creating a PR assigns `donkey-king-kong`; updating an existing PR adds the assignee. Both paths verify the assignment, retry once if missing, and report a persistent failure.
2. If GitHub CLI is unavailable, the handoff reminds Zack to assign `donkey-king-kong`.
3. Ship invokes the create-pr assignee step for opened and updated PRs.
4. The PR convention requires the assignee; all open PRs are assigned.

## Out of scope
Application code, schema, and CI changes.
