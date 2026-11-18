# T-0057: Agent Monitor UI RED tests

## Assignment

- Status: in_progress
- Owner actor: R-0056/coordinator
- Role: Test writer / coordinator
- Run: [R-0056](../runs/R-0056.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [tasks](../../specs/008-agent-monitor-ui/tasks.md)
- Authorization: Zack approved architecture plan on 2026-11-18 at `f90265e`; RED tests/evidence authorized, GREEN only after independent review.
- Dependencies: [T-0056](T-0056-plan-agent-monitor-ui.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T05:14:21Z

## Scope

Add named AC1-15 synthetic Vitest tests in `extensions/agent-monitor/test/`,
commit RED tests, run them separately from unchanged existing tests, and
publish `docs/specs/008-agent-monitor-ui/red-test-run.md`. No production code,
real logs, publisher changes, PR or GREEN.

## Acceptance

- [x] Named tests cover every AC and plan verification row with concrete fixtures.
- [ ] New tests fail for missing feature behavior; existing extension and adapter tests pass.
- [ ] Tested SHA, commands, counts, failure reasons and AC map in pushed RED evidence.

## Checkpoint

- Last completed action: added 25 named RED tests across core, presentation and webview, using synthetic `wt-` roots; lint and targeted run completed.
- Evidence: `vitest -t 'Feature 008'`: 25 failed for missing behavior, 40 existing skipped, no collection errors; `npm run lint` passed; baseline 77/77 passed before RED.
- Worktree state: approval/tracking and RED tests uncommitted; no production source edited.
- Remaining work: commit tests, rerun at pinned SHA, run unchanged existing and adapter suites, write evidence and push.
- Blocker / unblock action: independent RED review requires constitution cost approval before provider dispatch; offline RED work may proceed.
- Next action: commit approval and tests separately; run pinned RED/existing suites before evidence.
- Handoff recipient: independent fresh RED Reviewer after cost gate.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T04:20:28Z | R-0056/coordinator | Took over pushed `f90265e` and Zack's plan approval; established local baseline | 77 existing extension tests pass; create synthetic RED cases |
| 2026-11-18T05:14:21Z | R-0056/coordinator | Added all 25 named AC1-15 synthetic tests; lint passed and targeted suite failed only on missing UI/projection behavior | Commit tests, run at pinned SHA and publish evidence |
