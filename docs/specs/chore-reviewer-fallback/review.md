# PR #31 review

## Round 1

### Must-fix

None.

### Should-fix

- `docs/skills/ship.md:78-81`: The pre-dispatch ticket/run checkpoint records the *selected* reviewer path, but the actual reviewer type and identity are recorded only in a PR comment after dispatch. If Claude fails and Trae takes over, the ticket/run can retain Claude as the selected path without recording the actual Trae reviewer. Acceptance criterion 4 in `docs/specs/chore-reviewer-fallback/spec.md:23-25` requires the actual reviewer type in the ticket/run. Reconcile the post-dispatch record with that requirement while preserving the tracking freeze.

### Nits

None.

CI: `gh pr checks 31` reports backend, frontend and security passing; production-migrations is skipped. The diff has no application code, schema or constitution changes.

VERDICT: CHANGES_REQUESTED
