# T-0009: Replace ship-log branches with PR comments

## Assignment

- Status: in_progress
- Owner actor: R-0008/coordinator
- Role: coordinator
- Run: [R-0008](../runs/R-0008.md)
- Feature / task:
  [maintenance tasks](../../specs/chore-comment-based-ship-tracking/tasks.md)
- Authorization: Zack requested the change on 2026-11-13
- Dependencies: [T-0008](T-0008-agent-flow-granularity.md)
- Branch / worktree: `chore/agent-flow-granularity-ship-log` /
  `/Users/bytedance/Desktop/tallyhold-agent-flow-granularity-ship-log`
- Issue / PR: issue #13; PR not created
- Updated: 2026-11-13T06:09:07Z

## Scope

Stop future ship runs from creating post-dispatch tracking branches. Use PR
comments and Agent Flow for verified review, CI, and merge checkpoints while
keeping fresh Reviewer inputs isolated. Clarify that a silent Reviewer period
is isolated review work after coordinator CI, not hidden CI activity.

## Acceptance

- [x] Ship and work-tracking procedures require no post-dispatch branch.
- [x] Post-dispatch checkpoints have a durable PR-comment procedure.
- [x] Reviewer waiting is labelled truthfully without invented internal events.
- [x] Reviewer instructions contain no coordinator telemetry commands.
- [x] Documentation links, whitespace, and Agent Flow adapter tests pass.
- [x] Changes are committed and pushed on the existing branch.
- [ ] Assigned PR links issue #13 and the approved maintenance spec.
- [ ] Final-head CI and fresh review pass with no actionable findings.
- [ ] Every merge gate passes and the PR is auto-merged into `main`.

## Checkpoint

- Last completed action: completed every available local quality, test, build,
  security, dependency, adapter, and documentation check.
- Evidence: backend ruff/format/mypy/import contracts and two tests at 100%
  coverage; frontend lint/format/types/three tests/build; actionlint, gitleaks,
  both audits, six adapter tests, 78 links, whitespace and isolation passed.
- Worktree state: uncommitted maintenance spec and tracking records; merge from
  main not yet pushed.
- Remaining work: commit/push, assigned PR, CI, fresh review, and merge.
- Blocker / unblock action: none.
- Next action: commit and push the checked final pre-PR state.
- Handoff recipient: fresh Reviewer after final-head CI.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T06:00:26Z | R-0007/coordinator | Claimed the authorized workflow update on the existing branch | Edit canonical ship, tracking, Reviewer, Agent Flow, and workflow docs |
| 2026-11-13T06:02:52Z | R-0007/coordinator | Replaced post-dispatch branches with PR comments and validated the result | Commit and push the existing branch |
| 2026-11-13T06:03:34Z | R-0007/coordinator | Pushed workflow update `4baaab9` on the existing branch | Commit and push the final closeout |
| 2026-11-13T06:06:46Z | R-0008/coordinator | Reopened for user-authorized PR and auto-merge; synchronized main and created issue #13 | Run checks, commit, push, and open assigned PR |
| 2026-11-13T06:09:07Z | R-0008/coordinator | Completed full local verification with every check green | Commit and push the final pre-PR state |
