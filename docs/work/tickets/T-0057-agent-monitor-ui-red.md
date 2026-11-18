# T-0057: Agent Monitor UI RED tests

## Assignment

- Status: in_review
- Owner actor: R-0056/coordinator
- Role: Test writer / coordinator
- Run: [R-0056](../runs/R-0056.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [tasks](../../specs/008-agent-monitor-ui/tasks.md)
- Authorization: Zack approved architecture plan on 2026-11-18 at `f90265e`; RED tests/evidence authorized, GREEN only after independent review.
- Dependencies: [T-0056](T-0056-plan-agent-monitor-ui.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T05:16:01Z

## Scope

Add named AC1-15 synthetic Vitest tests in `extensions/agent-monitor/test/`,
commit RED tests, run them separately from unchanged existing tests, and
publish `docs/specs/008-agent-monitor-ui/red-test-run.md`. No production code,
real logs, publisher changes, PR or GREEN.

## Acceptance

- [x] Named tests cover every AC and plan verification row with concrete fixtures.
- [x] New tests fail for missing feature behavior; existing extension and adapter tests pass.
- [ ] Tested SHA, commands, counts, failure reasons and AC map in pushed RED evidence.

## Checkpoint

- Last completed action: committed approval as `f8bc088` and tests as `1522e5f`; verified targeted RED and unchanged suites at test SHA; wrote evidence.
- Evidence: 25 new cases failed/40 skipped; 77 existing extension and 6 adapter passed; lint, typecheck, format passed. Each failure reason and AC mapping recorded in [RED evidence](../../specs/008-agent-monitor-ui/red-test-run.md).
- Worktree state: evidence and checkpoint edits uncommitted; no production source edited.
- Remaining work: commit evidence and push; independent fresh RED review after cost approval.
- Blocker / unblock action: independent RED review requires constitution cost approval before provider dispatch; offline RED work may proceed.
- Next action: commit evidence/checkpoint, push and verify remote RED SHA; prepare review ticket and cost request.
- Handoff recipient: independent fresh RED Reviewer after cost gate.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T04:20:28Z | R-0056/coordinator | Took over pushed `f90265e` and Zack's plan approval; established local baseline | 77 existing extension tests pass; create synthetic RED cases |
| 2026-11-18T05:14:21Z | R-0056/coordinator | Added all 25 named AC1-15 synthetic tests; lint passed and targeted suite failed only on missing UI/projection behavior | Commit tests, run at pinned SHA and publish evidence |
| 2026-11-18T05:16:01Z | R-0056/coordinator | Verified `1522e5f`: 25 expected RED, 77 unchanged extension and 6 adapter passed, lint/typecheck/format passed | Commit/push evidence then request reviewer cost approval |
