# T-0004: Draft core domain spec

## Assignment

- Status: in_review
- Owner actor: R-0002/planner-01
- Role: Planner
- Run: [R-0002](../runs/R-0002.md)
- Feature: [002 Draft spec](../../specs/002-core-domain/spec.md)
- Authorization: Zack requested the revised Planner Draft, commit, and push,
  followed by a stop at Gate 1 on 2026-11-13.
- Dependencies: issue [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)
- Branch / worktree: `feature/002-core-domain`
- Worktree path: `../tallyhold-feature-002`
- Issue / PR: issue #7; no PR requested
- Updated: 2026-11-13T07:20:20Z

## Scope

Draft the pure-domain feature contract requested in issue #7. Cover User,
Broker, Account, Position, Transaction, Instrument, Decimal Money, FIFO cost
basis, unrealised and realised P&L, and portfolio weights. Exclude persistence,
APIs, external imports, and frontend work. Commit and push, then stop at Gate 1.
Do not create a plan/tasks, tests, or production code before approval.

## Acceptance

- [x] Issue #7 has the exact requested title, `feature` label, scope, and assignee.
- [x] Draft spec covers every requested entity and calculation.
- [x] Acceptance criteria are observable Given/When/Then statements.
- [x] Scope is pure domain only and explicit exclusions are recorded.
- [x] Draft spec and recovery records are checked, committed, and pushed.
- [x] Handoff stops at Gate 1 without planning or implementation.

## Checkpoint

- Last completed action: pushed and verified the validated Draft and recovery
  checkpoint on the feature branch.
- Evidence: local and `origin/feature/002-core-domain` both resolved to
  `e57a740`; Draft commit is `c3ee358`.
- Worktree state: only this final handoff checkpoint is modified.
- Remaining work: Zack's Gate 1 review; no plan, tasks, tests, code, or PR may
  start before explicit approval and resolution of the recorded conflicts.
- Blocker / unblock action: Gate 1 approval is required; Zack must decide
  whether issue #7 supersedes the conflicting product-spec statements.
- Next action: Zack reviews the Draft's product-spec conflicts and either
  requests revisions or explicitly approves the spec.
- Handoff recipient: Zack.

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
