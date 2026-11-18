# T-0055: Draft Agent Monitor UI redesign contract

## Assignment

- Status: in_review
- Owner actor: R-0053/coordinator
- Role: coordinator / Planner
- Run: [R-0053](../runs/R-0053.md), after [R-0052](../runs/R-0052.md)
- Feature: [Draft spec](../../specs/008-agent-monitor-ui/spec.md)
- Authorization: Zack requested spec-only Gate 1 draft, commit, and branch push on 2026-11-18; no plan or code approval.
- Dependencies: merged Feature 004; shared-stream roots used only when reported.
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related [#44](https://github.com/donkey-king-kong/tallyhold/issues/44), original [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no PR requested.
- Updated: 2026-11-18T03:59:54Z

## Scope

Draft a testable webview-only redesign contract using the spec template.
Tracking this assignment is permitted; implementation, plan, and source edits
are not. Preserve all approved Feature 004 behavior.

## Acceptance

- [x] Draft describes the mock, prior behavior, testable DOM outcomes, and exclusions.
- [x] Documentation links and whitespace validate.
- [ ] Corrected spec is committed and pushed on the new branch; Gate 1 remains pending.

## Checkpoint

- Last completed action: corrected Feature 008 spec and tracking; verified references, local links, and whitespace.
- Evidence: original remote branch at `018b42a`; no PR; 128 local links resolve; `git diff --check` passed; only deliberate "No Track X" copy matches the stale-phrase scan.
- Worktree state: renamed spec and tracking edits uncommitted.
- Remaining work: commit, push new branch, delete old remote branch, and request Zack's Gate 1 review.
- Blocker / unblock action: none for drafting; Gate 1 approval blocks planning/code.
- Next action: commit the documentation changes; push the new branch and verify its remote head before deleting the old remote.
- Handoff recipient: Zack for Gate 1.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T03:54:45Z | R-0052/coordinator | Claimed next free Track B ticket; synchronized main and created isolated branch | Draft and validate spec; do not plan or code |
| 2026-11-18T03:56:08Z | R-0052/coordinator | Drafted 15 testable criteria and validated Markdown links and whitespace | 121 local links resolve; commit and push the draft |
| 2026-11-18T03:58:58Z | R-0053/coordinator | Recovered pushed `018b42a`; took over correction with Zack's explicit request; renamed local branch/worktree and moved spec directory | Update references and lane contract; validate, commit, push new branch before deleting old remote |
| 2026-11-18T03:59:54Z | R-0053/coordinator | Corrected feature number and lane source-of-truth; validated 128 local links and whitespace | Commit correction; push and verify new remote before retiring old remote |
