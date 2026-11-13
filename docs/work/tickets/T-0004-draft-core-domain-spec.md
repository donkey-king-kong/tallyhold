# T-0004: Draft core domain spec

## Assignment

- Status: in_review
- Owner actor: R-0011/coordinator
- Role: ship coordinator
- Run: [R-0011](../runs/R-0011.md)
- Feature: [002 Draft spec](../../specs/002-core-domain/spec.md)
- Authorization: Zack approved Gate 1 and supplied binding conflict and open-
  question decisions on 2026-11-13.
- Dependencies: issue [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)
- Branch / worktree: `feature/002-core-domain`
- Worktree path: `../tallyhold-feature-002`
- Issue / PR: issue #7; PR #18
- Updated: 2026-11-13T08:35:07Z

## Scope

Draft the pure-domain feature contract requested in issue #7. Cover User,
Broker, Account, Position, Transaction, Instrument, Decimal Money, pluggable
cost-basis behavior with average cost for Feature 002, partial sells, unrealised
and realised P&L, and per-instrument portfolio weights. Exclude persistence,
APIs, external imports, and frontend work.

## Acceptance

- [x] Issue #7 has the exact requested title, `feature` label, scope, and assignee.
- [x] Draft spec covers every requested entity and calculation.
- [x] Acceptance criteria are observable Given/When/Then statements.
- [x] Scope is pure domain only and explicit exclusions are recorded.
- [x] Draft spec and recovery records are checked, committed, and pushed.
- [x] Handoff stops at Gate 1 without planning or implementation.
- [x] Gate 1 decisions replace FIFO-specific requirements with average cost
  behind `CostBasisStrategy` and resolve every recorded open question.
- [x] Approved status and the reconciled product contract are recorded before
  architecture begins.

## Checkpoint

- Last completed action: fresh review round 1 requested two documentation
  fixes; both are resolved locally with the review report.
- Evidence: `docs/specs/002-core-domain/spec.md` is Approved and records all
  eight Gate 1 decisions; `docs/spec.md` reflects the same product decisions.
- Worktree state: PR head `9b776b1` has six passing checks; `review.md`,
  remaining-basis formula, roadmap, and current checkpoints are modified.
- Remaining work: validate and push the report and fixes together, rerun CI,
  dispatch fresh review round 2, and apply the merge gate.
- Blocker / unblock action: none for this documentation PR; implementation
  remains blocked until Zack approves the later architecture plan.
- Next action: validate, commit, and push the report and fixes together, then
  verify CI on the resulting head.
- Handoff recipient: fresh Reviewer round 2 after green CI.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T02:58:41Z | R-0002/coordinator | Reconciled clean main and separate prior checkpoint branch; created issue #7 and Draft | Ask first grill frontier; no plan or code |
| 2026-11-13T03:13:12Z | R-0002/coordinator | Recorded Q1/Q3-Q5 recommendations and partial-sell scope change; updated issue #7 and acceptance criteria | Ask round 2 sell/validation/provider/currency decisions |
| 2026-11-13T03:18:19Z | R-0002/coordinator | Recorded Q6-Q10, including latest-observation fallback for non-trading dates | Ask final provider metadata, reopen, Money-sign, and ownership questions |
| 2026-11-13T07:13:58Z | R-0002/coordinator | Reassigned the preserved Draft under the current FIFO and realised-P&L mission; moved it to the dedicated worktree and normalized issue #7 | Planner revises spec, validates, commits, pushes, and stops at Gate 1 |
| 2026-11-13T07:16:37Z | R-0002/planner-01 | Claimed the Planner assignment and reconciled its required sources | Replace the preserved Draft and flag product-spec conflicts for Gate 1 |
| 2026-11-13T07:18:38Z | R-0002/planner-01 | Replaced the stale average-cost/provider Draft with the current pure-domain FIFO scope and explicit product conflicts | Validate the Draft and ticket, then commit and push |
| 2026-11-13T07:19:09Z | R-0002/planner-01 | Validated Draft status, requested scope, Given/When/Then criteria, whitespace, and changed-file boundaries | Commit the Draft and ticket, then push |
| 2026-11-13T07:19:51Z | R-0002/planner-01 | Initial commit command failed at shell parsing before Git ran; retried without bypassing hooks and committed the Draft as `c3ee358` | Commit this checkpoint, push, verify, and record Gate 1 handoff |
| 2026-11-13T07:20:20Z | R-0002/planner-01 | Pushed through `e57a740` and verified local/remote parity; all Planner acceptance items are complete | Zack reviews and resolves the explicit conflicts at Gate 1; no downstream work before approval |
| 2026-11-13T07:21:13Z | R-0002/coordinator | Verified clean remote parity at `9025295`, completed the Planner lifecycle, and accepted the Gate 1 handoff | Await Zack; no architecture or implementation |
| 2026-11-13T08:20:18Z | R-0011/coordinator | Recorded Zack's Gate 1 approval and revised the feature and product contracts to average cost behind `CostBasisStrategy` | Validate the approved contract, then hand off to Architect |
| 2026-11-13T08:20:18Z | R-0011/coordinator | Validation passed after correcting two overly broad or duplicate tracking assertions | Commit and push when authorized, then assign Architect |
| 2026-11-13T08:26:28Z | R-0011/coordinator | Pushed `15f0da0`, opened PR #18, verified assignment, and observed six passing CI checks | Commit this checkpoint, freeze tracking, verify final-head CI, and dispatch fresh review |
| 2026-11-13T08:35:07Z | R-0011/coordinator | Round 1 returned two should-fix findings; reconciled partial-sell basis formulas and stale work records | Validate and push report plus fixes together, then rerun CI |
