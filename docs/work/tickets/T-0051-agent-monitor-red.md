# T-0051: Specify Feature 004 with failing extension tests

## Assignment

- Status: blocked
- Owner actor: R-0051/coordinator
- Role: coordinator; Test writer assignment pending public test-interface confirmation
- Run: [R-0051](../runs/R-0051.md)
- Feature / task: [approved spec](../../specs/004-agent-monitor/spec.md), [plan](../../specs/004-agent-monitor/plan.md), [RED tasks](../../specs/004-agent-monitor/tasks.md#red-only-after-plan-approval)
- Authorization: Zack approved the plan as written at `64a4246` on 2026-11-17; GREEN requires independent RED approval.
- Dependencies: [T-0050](T-0050-plan-agent-monitor.md); public test interfaces must be confirmed per the TDD skill before tests.
- Branch / worktree: `feature/004-agent-monitor` / `../tallyhold-feature-004-agent-monitor`
- Worktree path: `../tallyhold-feature-004-agent-monitor`
- Issue / PR: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no implementation PR
- Updated: 2026-11-17T07:05:33Z

## Scope

After confirming public test interfaces, assign Test writer to produce synthetic, collecting RED tests and `red-test-run.md` for AC1-AC16, separately verify existing adapter tests, then commit and push the RED handoff for fresh independent review. Do not write production code, copy private runtime logs, or implement issue #38.

## Acceptance

- [ ] Public behavioral interfaces under test are confirmed and recorded in the approved plan.
- [ ] RED tests fail for missing feature behavior and existing tests pass; evidence maps every criterion and verification item.
- [ ] Test and evidence commits are pushed and a fresh RED Reviewer receives only permitted inputs.

## Checkpoint

- Last completed action: plan approval recorded and separate issue #38 opened; no tests written.
- Evidence: Zack's 2026-11-17 approval of `64a4246`; follow-up https://github.com/donkey-king-kong/tallyhold/issues/38.
- Worktree state: approval records pending commit at `64a4246`.
- Remaining work: confirm public test interfaces, RED tests/evidence, push, independent review.
- Blocker / unblock action: the plan names files and responsibilities but not callable public interfaces; Zack confirms the behavioral seams before tests.
- Next action: ask Zack to confirm proposed core, host and webview test interfaces; record his answer in the plan and then dispatch Test writer.
- Handoff recipient: Zack for the test-interface confirmation.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:05:33Z | R-0051/coordinator | Created RED assignment after approved plan; found public interfaces unnamed in plan | Obtain seam confirmation before tests; no RED or GREEN started |
