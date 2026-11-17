# T-0051: Specify Feature 004 with failing extension tests

## Assignment

- Status: in_progress
- Owner actor: R-0051/coordinator
- Role: Test writer (same actor, no subagent dispatched)
- Run: [R-0051](../runs/R-0051.md)
- Feature / task: [approved spec](../../specs/004-agent-monitor/spec.md), [plan](../../specs/004-agent-monitor/plan.md), [RED tasks](../../specs/004-agent-monitor/tasks.md#red-only-after-plan-approval)
- Authorization: Zack approved the plan as written at `64a4246` on 2026-11-17; GREEN requires independent RED approval.
- Dependencies: [T-0050](T-0050-plan-agent-monitor.md); public test interfaces must be confirmed per the TDD skill before tests.
- Branch / worktree: `feature/004-agent-monitor` / `../tallyhold-feature-004-agent-monitor`
- Worktree path: `../tallyhold-feature-004-agent-monitor`
- Issue / PR: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no implementation PR
- Updated: 2026-11-17T07:43:15Z

## Scope

After confirming public test interfaces, assign Test writer to produce synthetic, collecting RED tests and `red-test-run.md` for AC1-AC16, separately verify existing adapter tests, then commit and push the RED handoff for fresh independent review. Do not write production code, copy private runtime logs, or implement issue #38.

## Acceptance

- [x] Public behavioral interfaces under test are confirmed and recorded in the approved plan.
- [x] RED tests fail for missing feature behavior and existing tests pass; evidence maps every criterion and verification item.
- [x] Test and evidence commits are pushed for a fresh RED Reviewer with restricted inputs.

## Checkpoint

- Last completed action: committed the targeted round 3 test revision `9e9ed7d`; 52 collecting expected failures, and the existing publisher suite passed 6/6.
- Evidence: [updated run evidence](../../specs/004-agent-monitor/red-test-run.md) pins the test revision and AC1-AC16 map; no production code written.
- Worktree state: local `9e9ed7d` ahead of remote `1664e5e`, with RED evidence/checkpoints pending commit and push.
- Remaining work: commit/push evidence and obtain exceptional round 3 independent `APPROVE`.
- Blocker / unblock action: GREEN remains blocked until independent `APPROVE`; any non-approval returns to Zack.
- Next action: commit the evidence and pre-review checkpoint, push, verify remote head and hand off to one fresh reviewer.
- Handoff recipient: fresh round 3 RED Reviewer after pushed handoff.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:05:33Z | R-0051/coordinator | Created RED assignment after approved plan; found public interfaces unnamed in plan | Obtain seam confirmation before tests; no RED or GREEN started |
| 2026-11-17T07:07:51Z | R-0051/coordinator | Zack confirmed three public behavioral test seams | Begin synthetic RED tests; keep implementation out of Test writer role |
| 2026-11-17T07:12:47Z | R-0051/coordinator | Test commit `f723913` collected 25 expected failures; publisher suite passed 6/6 | Commit/push red-test-run.md and review on a fresh reviewer |
| 2026-11-17T07:14:06Z | R-0051/coordinator | Pushed RED test/evidence through `91f7783`; remote matches local, worktree clean | Freeze RED changes for fresh review; hand off T-0052 |
| 2026-11-17T07:22:15Z | R-0051/coordinator | Reopened RED work after fresh round 1 `CHANGES_REQUESTED` on `4440606` | Strengthen assertions and evidence; GREEN remains closed |
| 2026-11-17T07:25:18Z | R-0051/coordinator | Test fix `357e26e` collected 38 expected failures; publisher suite still 6/6; round 1 report committed | Commit/push updated evidence and checkpoint before fresh round 2 |
| 2026-11-17T07:32:24Z | R-0051/coordinator | Fresh round 2 on `db0e9e3` requested changes, ending the permitted two rounds | Stop tests/implementation; Zack resolves escalation |
| 2026-11-17T07:37:50Z | R-0051/coordinator | Zack authorized targeted RED corrections and exactly one extra independent review | Resume Test writer only; GREEN still gated on `APPROVE` |
| 2026-11-17T07:43:15Z | R-0051/coordinator | Committed targeted tests at `9e9ed7d`; 52/52 RED failures for absent extension behavior and 6/6 existing publisher passes | Evidence updated for AC1-AC16; commit/push before exceptional independent review |
