# R-NNNN: Session purpose

- State: active / handed_off / blocked / interrupted / completed
- Started: UTC timestamp
- Last checkpoint: UTC timestamp
- Coordinator actor: R-NNNN/coordinator
- Branch / starting HEAD:
- Worktree: ../tallyhold-<branch-slug>
- Prior run: link or none
- Successor run: link or none; append on takeover
- Scope: ticket links

## Agent roster

| Actor ID | Parent | Role | Tool / model | Native ID | Agent Flow ID | Ticket | State |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R-NNNN/coordinator | none | coordinator | known values or unknown | known or unavailable | orchestrator | link | active |

Only add subagents actually dispatched. Before dispatch, put intent in the
timeline; on success add the returned identity to the roster. Failed dispatches
remain timeline events, not invented agents. Role switches preserve actor ID.
The coordinator records fresh Reviewer activity without giving it this file.

## Timeline

| UTC time | Actor | Milestone / decision | Evidence |
| --- | --- | --- | --- |
| timestamp | R-NNNN/coordinator | Started; reconciled previous checkpoint | Git state and ticket |

## Handoff

- Completed: ticket links, not duplicated task details
- Outstanding: ticket links
- Running operations: ID and state, or none; verify on resume
- Local / remote state: branch, last known pushed commit, uncommitted paths
- Exact next action:
- Recovery caveat: approvals or checks needing confirmation

A successful session handoff is not necessarily feature completion. End the
roster entries when the actual agents stop, and preserve unresolved tickets.
