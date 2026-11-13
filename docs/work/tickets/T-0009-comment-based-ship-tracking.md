# T-0009: Replace ship-log branches with PR comments

## Assignment

- Status: in_progress
- Owner actor: R-0007/coordinator
- Role: coordinator
- Run: [R-0007](../runs/R-0007.md)
- Feature / task: maintenance of the ship and work-tracking procedures
- Authorization: Zack requested the change on 2026-11-13
- Dependencies: [T-0008](T-0008-agent-flow-granularity.md)
- Branch / worktree: `chore/agent-flow-granularity-ship-log` /
  `/Users/bytedance/Desktop/tallyhold-agent-flow-granularity-ship-log`
- Issue / PR: none requested
- Updated: 2026-11-13T06:02:52Z

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
- [ ] Changes are committed and pushed on the existing branch.

## Checkpoint

- Last completed action: replaced branch-based ship tracking with PR comments,
  clarified Reviewer waiting, and reduced duplicate CI pushes.
- Evidence: six adapter tests passed; 73 Markdown files have no missing links;
  whitespace clean; Reviewer has no telemetry commands; no open PR or active CI.
- Worktree state: uncommitted workflow and tracking documentation.
- Remaining work: commit and push the existing branch.
- Blocker / unblock action: none.
- Next action: commit the validated documentation update.
- Handoff recipient: Zack after push.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T06:00:26Z | R-0007/coordinator | Claimed the authorized workflow update on the existing branch | Edit canonical ship, tracking, Reviewer, Agent Flow, and workflow docs |
| 2026-11-13T06:02:52Z | R-0007/coordinator | Replaced post-dispatch branches with PR comments and validated the result | Commit and push the existing branch |
