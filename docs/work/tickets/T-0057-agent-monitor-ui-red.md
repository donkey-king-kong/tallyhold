# T-0057: Agent Monitor UI RED tests

## Assignment

- Status: in_review
- Owner actor: R-0057/coordinator
- Role: Test writer / coordinator
- Run: [R-0057](../runs/R-0057.md), after [R-0056](../runs/R-0056.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [tasks](../../specs/008-agent-monitor-ui/tasks.md)
- Authorization: Zack approved architecture plan on 2026-11-18 at `f90265e`; RED tests/evidence authorized, GREEN only after independent review.
- Dependencies: [T-0056](T-0056-plan-agent-monitor-ui.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T05:39:52Z

## Scope

Add named AC1-15 synthetic Vitest tests in `extensions/agent-monitor/test/`,
commit RED tests, run them separately from unchanged existing tests, and
publish `docs/specs/008-agent-monitor-ui/red-test-run.md`. No production code,
real logs, publisher changes, PR or GREEN.

## Acceptance

- [x] Named tests cover every AC and plan verification row with concrete fixtures.
- [x] New tests fail for missing feature behavior; existing extension and adapter tests pass.
- [x] Tested SHA, commands, counts, failure reasons and AC map in pushed RED evidence.

## Checkpoint

- Last completed action: committed corrected tests at `885fbe4` and reran all checks at that revision.
- Evidence: [revised RED evidence](../../specs/008-agent-monitor-ui/red-test-run.md): 34 expected failures/77 skipped; 77 existing passed/34 skipped; adapter 6 passed; lint/typecheck/format/whitespace passed.
- Worktree state: only revised evidence and tracking pending commit; no production source edited.
- Remaining work: push revised RED evidence and request different fresh round-2 review.
- Blocker / unblock action: no spec/plan escalation requested; GREEN remains blocked on round-2 independent APPROVE.
- Next action: commit/push revised evidence and tracking, verify remote SHA, dispatch fresh round 2.
- Handoff recipient: different fresh RED Reviewer for round 2.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T04:20:28Z | R-0056/coordinator | Took over pushed `f90265e` and Zack's plan approval; established local baseline | 77 existing extension tests pass; create synthetic RED cases |
| 2026-11-18T05:14:21Z | R-0056/coordinator | Added all 25 named AC1-15 synthetic tests; lint passed and targeted suite failed only on missing UI/projection behavior | Commit tests, run at pinned SHA and publish evidence |
| 2026-11-18T05:16:01Z | R-0056/coordinator | Verified `1522e5f`: 25 expected RED, 77 unchanged extension and 6 adapter passed, lint/typecheck/format passed | Commit/push evidence then request reviewer cost approval |
| 2026-11-18T05:17:01Z | R-0056/coordinator | Pushed RED evidence as `1105aac`; remote/local matched | T-0058 reviewer dispatch waits on two separate cost approvals |
| 2026-11-18T05:31:35Z | R-0057/coordinator | Reopened Test writer assignment after fresh Trae round-1 CHANGES_REQUESTED | Five test gaps, no plan change; add focused RED cases and re-review |
| 2026-11-18T05:39:13Z | R-0057/coordinator | Strengthened RED-only tests for all five findings; local checks show 34 expected RED, 77 unchanged and 6 adapter passing, lint/typecheck/format clean | Commit test revision, rerun at SHA, publish revised evidence and hand to fresh round 2 |
| 2026-11-18T05:39:52Z | R-0057/coordinator | Committed `885fbe4`; pinned checks confirm 34 missing-behavior RED, 77 unchanged and 6 adapter passed, quality checks clean | Commit/push revised evidence and arrange different fresh RED reviewer |
