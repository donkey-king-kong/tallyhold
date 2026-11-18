# T-0092: Log full branch name for display

## Assignment

- Status: backlog
- Owner actor: unassigned
- Role: Planner
- Run: none; backlog decision recorded during [R-0094](../runs/R-0094.md)
- Feature / task: future Agent Flow publisher maintenance, outside Feature 008
- Authorization: Zack requested this follow-up during Agent Monitor preview round 2 on 2026-11-18
- Dependencies: none
- Branch / worktree: not assigned
- Worktree path: not assigned
- Issue / PR: not created
- Updated: 2026-11-18T10:40:06Z

## Scope

Plan a future adapter payload field that reports the full branch name explicitly
for display consumers. Preserve the existing normalized and hashed
`sourceWorktree` identifier. Do not infer a branch name in Feature 008 and do
not implement the payload change as part of the Agent Monitor UI work.

## Acceptance

- [ ] A separately approved contract defines the field, privacy constraints,
      compatibility behavior, adapter tests, and display-consumer migration.

## Checkpoint

- Last completed action: recorded Zack's follow-up decision.
- Evidence: preview round 2 requires Feature 008 to display only the real
  normalized and hashed slug until an explicit branch field exists.
- Worktree state: no implementation assigned.
- Remaining work: future planning and approval outside Feature 008.
- Blocker / unblock action: requires separate scope and approval.
- Next action: leave in backlog until Zack schedules publisher maintenance.
- Handoff recipient: future Planner.

## History

| UTC time             | Actor              | Event and observed result                                      | Evidence / next action                              |
| -------------------- | ------------------ | -------------------------------------------------------------- | --------------------------------------------------- |
| 2026-11-18T10:40:06Z | R-0094/coordinator | Created as a backlog follow-up outside Feature 008             | Do not invent branch display data in the current UI |
