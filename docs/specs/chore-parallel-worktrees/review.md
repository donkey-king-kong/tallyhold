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

## Round 2

### Must-fix

1. `docs/skills/ship.md:89-116` — The round 1 merge/cleanup finding is only
   partially resolved. The procedure now avoids `git switch main`, uses the
   actual worktree path and full branch name, and correctly runs final cleanup
   from the main worktree. However, line 94 still runs
   `gh pr merge <N> --merge --delete-branch` from the linked worktree.
   `--delete-branch` directs GitHub CLI to delete the local branch after the
   merge, but that branch remains checked out by the linked worktree until
   lines 115-116 remove the worktree and delete the branch. This makes the
   merge command conflict with the cleanup sequence it introduces. Merge
   without local branch deletion from the linked worktree, then remove the
   worktree before deleting the local branch from the main worktree; delete
   the remote branch separately if the ship procedure still requires it.

### Should-fix

None.

### Nit

None.

### Evidence

- The round 1 maintenance-path issue is fixed:
  `docs/skills/ship.md:110-121` parameterizes the actual worktree path and full
  branch name and includes both feature and maintenance examples.
- The round 1 workflow-step issue is fixed: `docs/workflow.md:23` now points
  cleanup to the Gate 2 merge at Step 10 and requires cleanup from the main
  worktree.
- `docs/skills/ship.md:94` retains `--delete-branch` while
  `docs/skills/ship.md:115-116` requires the linked worktree to be removed
  before its local branch is deleted.
- PR #16 remains documentation-only and does not modify
  `docs/agents/reviewer.md`, application code, schema, or the constitution.
- `gh pr checks 16` reports backend, frontend, and security passing.
- The PR patch passes `git diff --check`.

VERDICT: CHANGES_REQUESTED

## Round 3

### Must-fix

None.

### Should-fix

None.

### Nit

None.

### Evidence

- The round 1 linked-worktree merge issue is fixed:
  `docs/skills/ship.md:89-98` no longer switches to `main` from the linked
  worktree, and `docs/skills/ship.md:110-121` performs cleanup from the main
  repo using the actual worktree path and full branch name, with feature and
  maintenance examples.
- The round 1 workflow-step issue is fixed: `docs/workflow.md:23` points
  post-merge cleanup to Gate 2 at Step 10 and covers feature and maintenance
  worktrees.
- The round 2 branch-deletion conflict is fixed:
  `docs/skills/ship.md:94` merges without `--delete-branch`, then
  `docs/skills/ship.md:114-116` pulls `main`, removes the linked worktree, and
  deletes the local branch in that order.
- The current diff satisfies the seven acceptance criteria, remains
  documentation-only, and leaves `docs/agents/reviewer.md`, application code,
  schema, and the constitution unchanged.
- `gh pr checks 16` reports backend, frontend, and security passing.
- The PR patch passes `git diff --check`.

VERDICT: APPROVE
