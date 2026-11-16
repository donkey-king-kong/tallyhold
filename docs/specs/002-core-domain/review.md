# PR #21 Review

## Round 1

### Must-fix

1. **Repository contracts exceed the approved Feature 002 scope.**
   - Evidence: `docs/specs/002-core-domain/spec.md:246-247` explicitly places
     repositories out of scope, while this PR adds five repository ABCs and
     their contract tests in
     `backend/app/modules/{identity,accounts,instruments,transactions}/domain/repositories.py`
     and `backend/tests/domain/test_repositories.py`.
   - The explanation in `docs/specs/002-core-domain/plan.md:7-11` changes the
     approved scope but does not amend the approved feature spec. Remove the
     repository additions, or amend and approve the feature spec before
     including them.

### Should-fix

None.

### Nits

None.

### Evidence

- The remaining diff implements AC1-AC10 with pure domain code, derived
  positions, Decimal-based calculations, pluggable cost basis, and matching
  tests.
- No schema change or migration is present or required for the approved scope.
- No security or layering defect was found in the permitted diff evidence.
- `gh pr checks 21` reports all backend, frontend, and security jobs passing.

VERDICT: CHANGES_REQUESTED
