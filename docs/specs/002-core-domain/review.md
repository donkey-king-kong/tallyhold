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

## Round 2

### Must-fix

None.

### Should-fix

None.

### Nits

None.

### Evidence

- Round 1's scope finding is resolved. The approved feature contract now
  explicitly includes the five pure abstract repository ports at
  `docs/specs/002-core-domain/spec.md:5,57-60,248-257,291-293`, while repository
  implementations and database behavior remain out of scope.
- The repository contracts contain only abstract entity-specific operations,
  and account and transaction operations explicitly require `user_id` at
  `backend/app/modules/accounts/domain/repositories.py:26-43` and
  `backend/app/modules/transactions/domain/repositories.py:10-29`.
- The remaining diff implements AC1-AC11 with pure domain code, derived
  positions, exact Decimal and currency behavior, pluggable cost basis, and
  acceptance-mapped tests. No schema change or migration is present or required.
- No security or layering defect was found in the permitted diff evidence.
- `gh pr checks 21` reports both backend, both frontend, and both security jobs
  passing.

VERDICT: APPROVE
