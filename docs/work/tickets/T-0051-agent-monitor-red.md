# T-0051: Specify Feature 004 with failing extension tests

## Assignment

- Status: done
- Owner actor: R-0051/coordinator
- Role: Test writer (same actor, no subagent dispatched)
- Run: [R-0051](../runs/R-0051.md)
- Feature / task: [approved spec](../../specs/004-agent-monitor/spec.md), [plan](../../specs/004-agent-monitor/plan.md), [RED tasks](../../specs/004-agent-monitor/tasks.md#red-only-after-plan-approval)
- Authorization: Zack approved the plan as written at `64a4246` on 2026-11-17; GREEN requires independent RED approval.
- Dependencies: [T-0050](T-0050-plan-agent-monitor.md); public test interfaces must be confirmed per the TDD skill before tests.
- Branch / worktree: `feature/004-agent-monitor` / `../tallyhold-feature-004-agent-monitor`
- Worktree path: `../tallyhold-feature-004-agent-monitor`
- Issue / PR: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no implementation PR
- Updated: 2026-11-17T07:14:06Z

## Scope

After confirming public test interfaces, assign Test writer to produce synthetic, collecting RED tests and `red-test-run.md` for AC1-AC16, separately verify existing adapter tests, then commit and push the RED handoff for fresh independent review. Do not write production code, copy private runtime logs, or implement issue #38.

## Acceptance

- [x] Public behavioral interfaces under test are confirmed and recorded in the approved plan.
- [x] RED tests fail for missing feature behavior and existing tests pass; evidence maps every criterion and verification item.
- [x] Test and evidence commits are pushed for a fresh RED Reviewer with restricted inputs.

## Checkpoint

- Last completed action: pushed test commit `f723913` and evidence at `91f778350d99503d2fb3b7893a16b6538f68c50c`; remote HEAD verified.
- Evidence: [RED run](../../specs/004-agent-monitor/red-test-run.md): 25/25 new cases deliberately fail with missing extension interfaces; 6/6 existing publisher tests pass; base `0988e8e`; remote branch matches local.
- Worktree state: clean at pushed `91f7783` before pre-dispatch checkpoint.
- Remaining work: independent RED review and any requested fixes.
- Blocker / unblock action: none for RED; GREEN still blocked on independent RED approval.
- Next action: checkpoint pushed SHA and hand T-0052 to fresh headless Claude RED Reviewer; no GREEN until `APPROVE`.
- Handoff recipient: independent RED Reviewer after pushed evidence.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:05:33Z | R-0051/coordinator | Created RED assignment after approved plan; found public interfaces unnamed in plan | Obtain seam confirmation before tests; no RED or GREEN started |
| 2026-11-17T07:07:51Z | R-0051/coordinator | Zack confirmed three public behavioral test seams | Begin synthetic RED tests; keep implementation out of Test writer role |
| 2026-11-17T07:12:47Z | R-0051/coordinator | Test commit `f723913` collected 25 expected failures; publisher suite passed 6/6 | Commit/push red-test-run.md and review on a fresh reviewer |
| 2026-11-17T07:14:06Z | R-0051/coordinator | Pushed RED test/evidence through `91f7783`; remote matches local, worktree clean | Freeze RED changes for fresh review; hand off T-0052 |
