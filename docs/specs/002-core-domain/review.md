# Review

## Round 1

### Must-fix

None.

### Should-fix

1. `docs/spec.md:178-184` still defines total invested/cost basis as the sum of
   every buy and then uses that value as the cost of the shares currently held.
   That formula is no longer valid after this PR makes partial sells part of the
   MVP: each sale consumes average-cost basis, so remaining cost basis must be
   reduced before unrealised P&L is calculated. For example, buying 10 shares
   and selling 5 would leave 5 shares but the unchanged formula would retain
   the cost of all 10. Reconcile the product-level total-invested and unrealised
   P&L rules with the approved consumed-basis rules in
   `docs/specs/002-core-domain/spec.md:76-118`.

2. The changed work records do not consistently record the state established by
   this PR. `docs/work/roadmap.md:12` says Feature 002 is a Draft at Gate 1 that
   must be revised and then await approval, while
   `docs/specs/002-core-domain/spec.md:5` says Gate 1 is approved.
   `docs/work/runs/R-0011.md:35-42` and
   `docs/work/tickets/T-0004-draft-core-domain-spec.md:41-52` also say the
   checkpoint still needs to be committed and pushed even though those records
   are present in the reviewed PR diff. Update the records so the durable
   status and next action agree with the approved contract and current review
   stage.

### Nit

None.

### Evidence

- The PR diff contains documentation and tracking changes only; no code,
  schema, migration, or runtime security surface is introduced.
- The approved feature contract covers AC1-AC10, pure-domain layering,
  deterministic ordering, Decimal and currency invariants, partial and full
  sells, realised and unrealised P&L, strategy substitution, and
  per-instrument weights.
- `gh pr checks 18` reports both backend runs, both frontend runs, and both
  security runs passing.

VERDICT: CHANGES_REQUESTED
