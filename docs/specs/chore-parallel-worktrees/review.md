# Review: Parallel feature worktrees

## Round 1

### Must-fix

1. `docs/skills/ship.md:89-119` and `docs/workflow.md:23` — The ship and
   cleanup commands cannot complete from the worktree model introduced by this
   PR. `docs/skills/ship.md:3` now requires the ship run to operate from the
   linked worktree, but line 95 runs `git switch main`; Git rejects that when
   `main` is already checked out in the main worktree. The later cleanup also
   hard-codes `../tallyhold-NNN-name` and `feature/NNN-name`, while the
   acceptance criteria require maintenance worktrees based on the full branch
   slug (the current case is `../tallyhold-chore-parallel-worktrees` on
   `chore/parallel-worktrees`). `docs/workflow.md:23` has the same maintenance
   path ambiguity and incorrectly identifies Step 11 as the merge step. Update
   the merge and cleanup procedure so it operates explicitly against the main
   worktree and uses the actual worktree path and branch for both feature and
   maintenance branches.

### Should-fix

None.

### Nit

None.

### Evidence

- PR #16 is documentation-only and does not modify
  `docs/agents/reviewer.md`, application code, schema, or the constitution.
- Acceptance criteria 1-3 require branch-slug worktree naming and a usable
  post-merge removal, branch deletion, and main-pull procedure.
- `gh pr checks 16` reports backend, frontend, and security passing.
- The PR patch passes the whitespace check.

VERDICT: CHANGES_REQUESTED
