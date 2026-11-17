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

## Round 2

### Prior finding

- Resolved: `docs/skills/ship.md:79-87` now requires the coordinator to checkpoint a failed Claude launch and the actual Trae fallback type in the ticket/run, commit and push that checkpoint, wait for CI on the new head, and freeze tracking again before fallback review. The PR comment records the launched reviewer's identity in addition to the ticket/run type. This meets `docs/specs/chore-reviewer-fallback/spec.md:23-25`.

### Must-fix

None.

### Should-fix

None.

### Nits

None.

The PR diff documents a fresh Trae fallback for PR and RED review (`docs/skills/ship.md:68-90`, `docs/skills/red-review.md:30-43`), preserves the round and escalation limits (`docs/skills/ship.md:76-90`, `docs/skills/red-review.md:39-40,50-58`), and changes no application code, tests, schema, active feature files or constitution. No migration or local test run is applicable to this documentation-only change. `gh pr checks 31` reports backend, frontend and security passing; production-migrations is skipped.

VERDICT: APPROVE
