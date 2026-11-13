# Parallel feature worktrees

## Status

Approved maintenance scope by Zack's explicit request on 2026-11-13. This is a
documentation-only workflow change, not a product feature or application
architecture change. Gate 1 is not required.

Issue: [#15](https://github.com/donkey-king-kong/tallyhold/issues/15).

## Acceptance criteria

1. Feature and maintenance work starts in an isolated sibling worktree named
   `../tallyhold-<branch-slug>`.
2. Multiple branches may run concurrently in separate worktrees, but two tools
   never work on the same branch at the same time.
3. Workflow and ship instructions identify the worktree root as the working
   directory and document post-merge removal, local branch deletion, and a
   pull of `main`.
4. Ticket and run templates record the assigned worktree path.
5. Work recovery explains that concurrent tickets and runs have independent
   worktrees and Agent Flow sessions.
6. Each worktree uses its own git-ignored `.agent-flow/` directory and JSONL
   watch path.
7. `docs/agents/reviewer.md` remains unchanged.

## Out of scope

Application code, schema changes, feature implementation, constitution changes,
and Reviewer telemetry instructions.
