# PR auto-assignment maintenance plan

## Status and approvals
Zack requested this documentation-only maintenance task directly. No schema or architecture changes require plan approval.

## Approach
Update `docs/skills/create-pr.md` for creation, existing PRs, verification, retry, and handoff. Route PR updates in `docs/skills/ship.md` through that step. Add the convention in `docs/conventions.md`, and assign existing open PRs with `gh`.

## Verification
Inspect the docs diff, check whitespace and agent-flow tests, verify open PR assignees through `gh`, and use the ship review and merge gates.
