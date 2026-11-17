# T-0053: Implement Feature 004 agent monitor

## Assignment

- Status: ready
- Owner actor: unassigned
- Role: Implementer
- Run: [R-0051](../runs/R-0051.md)
- Feature / task: [approved spec](../../specs/004-agent-monitor/spec.md), [plan](../../specs/004-agent-monitor/plan.md), [GREEN tasks](../../specs/004-agent-monitor/tasks.md#green-only-after-independent-red-approval)
- Authorization: Zack approved the plan at `64a4246`; fresh RED round 4 approved pushed head `1ec4eed` on 2026-11-17.
- Dependencies: completed [T-0051](T-0051-agent-monitor-red.md) and [T-0052](T-0052-agent-monitor-red-review.md)
- Branch / worktree: `feature/004-agent-monitor` / `../tallyhold-feature-004-agent-monitor`
- Worktree path: `../tallyhold-feature-004-agent-monitor`
- Issue / PR: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no implementation PR yet
- Updated: 2026-11-17T07:56:28Z

## Scope

Implement the independently packaged, read-only extension one GREEN task at a
time through the approved public core, host and webview seams. Complete all
quality, coverage, package audit, benchmark and actual-editor compatibility
evidence required by the plan. Do not edit RED tests to make them pass, change
the publisher protocol, touch backend/migrations/CI, or implement issue #38.

## Acceptance

- [ ] All 56 approved extension tests pass without weakening them; existing publisher tests pass.
- [ ] Extension lint, format, type, build, coverage at least 80%, dependency audit and package audit pass.
- [ ] Approved performance envelope and actual VS Code/Trae smoke results are recorded honestly.
- [ ] GREEN task checkboxes, verification documentation and commits are complete for ship handoff.

## Checkpoint

- Last completed action: coordinator created the GREEN assignment after independent RED approval.
- Evidence: [RED review](../../specs/004-agent-monitor/red-review.md) and [commit comment](https://github.com/donkey-king-kong/tallyhold/commit/1ec4eed08bba538eab04c59738f7914d5ce93c50#commitcomment-210414259).
- Worktree state: reviewer report and approval checkpoint await coordinator commit/push; no production code exists.
- Remaining work: all GREEN tasks and release verification.
- Blocker / unblock action: none after approval record is pushed.
- Next action: coordinator publishes RED approval, assigns a separate Implementer actor and starts the extension shell/protocol task.
- Handoff recipient: R-0051/implementer.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:56:28Z | R-0051/coordinator | Created after fresh round 4 RED `APPROVE` on pushed `1ec4eed` | Commit/push approval record, then assign separate Implementer role |
