# T-0055: Draft Agent Monitor UI redesign contract

## Assignment

- Status: done
- Owner actor: R-0053/coordinator
- Role: coordinator / Planner
- Run: [R-0053](../runs/R-0053.md), after [R-0052](../runs/R-0052.md)
- Feature: [Draft spec](../../specs/008-agent-monitor-ui/spec.md)
- Authorization: Zack approved Gate 1 on 2026-11-18 at `74fae10`; separate plan approval is pending under [T-0056](T-0056-plan-agent-monitor-ui.md).
- Dependencies: merged Feature 004; shared-stream roots used only when reported.
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related [#44](https://github.com/donkey-king-kong/tallyhold/issues/44), original [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no PR requested.
- Updated: 2026-11-18T04:12:24Z

## Scope

Draft a testable webview-only redesign contract using the spec template.
Tracking this assignment is permitted; implementation, plan, and source edits
are not. Preserve all approved Feature 004 behavior.

## Acceptance

- [x] Draft describes the mock, prior behavior, testable DOM outcomes, and exclusions.
- [x] Documentation links and whitespace validate.
- [x] Corrected spec is committed and pushed on the new branch; Zack approved Gate 1.

## Checkpoint

- Last completed action: Zack explicitly approved Gate 1 for Feature 008 at branch head `74fae10`.
- Evidence: Zack's 2026-11-18 instruction and pushed branch `74fae10`; spec status is recorded under R-0054.
- Worktree state: new planning documents and tracking uncommitted.
- Remaining work: [T-0056](T-0056-plan-agent-monitor-ui.md) architecture plan approval before RED.
- Blocker / unblock action: separate architecture-plan approval required before tests/code.
- Next action: R-0054 validates, commits and pushes plan; hand it to Zack for separate approval.
- Handoff recipient: R-0054/coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T03:54:45Z | R-0052/coordinator | Claimed next free Track B ticket; synchronized main and created isolated branch | Draft and validate spec; do not plan or code |
| 2026-11-18T03:56:08Z | R-0052/coordinator | Drafted 15 testable criteria and validated Markdown links and whitespace | 121 local links resolve; commit and push the draft |
| 2026-11-18T03:58:58Z | R-0053/coordinator | Recovered pushed `018b42a`; took over correction with Zack's explicit request; renamed local branch/worktree and moved spec directory | Update references and lane contract; validate, commit, push new branch before deleting old remote |
| 2026-11-18T03:59:54Z | R-0053/coordinator | Corrected feature number and lane source-of-truth; validated 128 local links and whitespace | Commit correction; push and verify new remote before retiring old remote |
| 2026-11-18T04:00:57Z | R-0053/coordinator | Pushed `0a71c3e` to new remote, verified SHA, and deleted old remote branch | Commit/push handoff checkpoint; await Zack's Gate 1 decision |
| 2026-11-18T04:12:24Z | R-0054/coordinator | Recovered pushed `74fae10`; Zack approved Feature 008 spec at Gate 1 | Closed spec ticket; plan T-0056 needs separate Zack approval before RED |
