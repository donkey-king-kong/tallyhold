# T-0004: Draft core domain spec

## Assignment

- Status: in_progress
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
- Updated: 2026-11-13T07:19:51Z

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
- [ ] Draft spec and recovery records are checked, committed, and pushed.
- [ ] Handoff stops at Gate 1 without planning or implementation.

## Checkpoint

- Last completed action: committed the validated Draft and ticket.
- Evidence: commit `c3ee358` (`docs: draft core domain contract`) contains only
  `docs/specs/002-core-domain/spec.md` and this ticket.
- Worktree state: this post-commit checkpoint is modified.
- Remaining work: commit this checkpoint, push the branch, verify the remote,
  and record the Gate 1 handoff.
- Blocker / unblock action: none; product-spec differences remain explicit in
  the Draft for Gate 1.
- Next action: commit this checkpoint and push the branch.
- Handoff recipient: none while R-0002/planner-01 is active.

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
