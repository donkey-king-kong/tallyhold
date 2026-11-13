# Work tracking

Start here on every new session, context recovery, or assignment. This is the
durable work index, not a replacement for approved specs or live Git evidence.
Fresh Reviewers are exempt: their coordinator maintains their records externally.

## Current work

| Ticket | Purpose | Run |
| --- | --- | --- |
| [T-0001](tickets/T-0001-durable-work-tracking.md) | Set up durable planning and agent accountability | [R-0001](runs/R-0001.md) |
| [T-0002](tickets/T-0002-publish-work-tracking.md) | Publish and review durable tracking | [R-0001](runs/R-0001.md) |
| [T-0003](tickets/T-0003-review-work-tracking.md) | Independent review of PR #6 | [R-0001](runs/R-0001.md) |
| [T-0005](tickets/T-0005-ship-tracking-closeout.md) | Ship checkpoint-only closeout history | [R-0003](runs/R-0003.md) |
| [T-0006](tickets/T-0006-ship-post-dispatch-tracking.md) | Ship PR #8 post-dispatch tracking | [R-0004](runs/R-0004.md) |
| [T-0007](tickets/T-0007-end-recursive-closeout.md) | End recursive closeout branches and ship terminal history | [R-0005](runs/R-0005.md) |

For PR #6 post-dispatch progress, follow T-0002's checkpoint branch/worktree.

`T-0004` and `R-0002` are reserved by the active feature 002 Draft on its
separate feature branch; do not reuse those IDs if this branch lands first.

Open the ticket for authoritative status, ownership, and next action.
Completed tickets remain in this index; split an archive index when it grows.
The [roadmap](roadmap.md) shows project priorities and feature links.

## Start or resume

1. Read the relevant ticket, latest linked run, and linked spec/plan/tasks.
   Confirm the requested scope and required approvals. Roadmap entries and
   ticket assignments do not grant Gate 1, plan, commit, push, or merge authority.
2. Inspect `git status --short --branch` and recent commits before writing.
   Preserve uncommitted work. Follow the repository's pull-before-work rule on
   a clean branch; if dirty or diverged, reconcile without discarding changes.
   Check linked PR/CI state with `gh` when online. Record unavailable evidence.
3. Reconcile the last checkpoint with files, commits, and external effects.
   An `in_progress` record is not proof of a live agent. Verify the previous
   worker has stopped before taking ownership; if uncertain, pause and ask.
   Check whether a PR, comment, commit, or merge already exists before retrying.
4. The coordinator creates a run from the [run template](templates/run.md) for
   a new session, including a session replacing a failed one. A context refresh
   within the same live session keeps its run. Append takeover evidence and
   link predecessor/successor runs; preserve the old record.
5. Before executing an assignment, create or claim its ticket using the
   [ticket template](templates/ticket.md). Record one active owner, role, run,
   scope, dependencies, and next action. The index must link every new ticket.
   Non-reviewer workers receive their ticket path and this procedure.

For a question requiring no repository work, read the relevant records but do
not create an empty run. Subagents join the coordinator's run rather than
creating parallel session records. Missing tickets are created by the coordinator
before dispatch. Explicitly read-only workers return updates for it to record.

## Checkpoint while working

The ticket owner updates the ticket at assignment, after each meaningful
artifact/check result, on a failure or scope change, and before a handoff or stop.
Save a checkpoint before dispatching or beginning a long-running operation.
Record the result afterward; a started operation remains unverified until then.

Each checkpoint includes a UTC timestamp, actor ID, action, observed result,
evidence, outstanding work, and exact next action. Update the current fields
and append history in the same edit. Preserve history; correct mistakes with
new entries rather than rewriting past outcomes. Keep entries factual and short.

The coordinator alone edits the index, roadmap, and shared run roster. Workers
edit only their assigned ticket and role-permitted outputs. A read-only role
returns a checkpoint to the coordinator. Split overlapping assignments or
serialize their writes; tickets are not locks, and do not relax the
one-feature/one-tool branch rule.

Use repository-assigned IDs (`R-0001/coordinator`, `R-0001/worker-01`) and record
native agent IDs when available, otherwise `unavailable`. Record actual tool and
model only when known. One agent changing roles stays the same actor; it is not
a new subagent. Register a planned dispatch as pending and mark it launched only
after the tool confirms creation. Preserve failed dispatches and replaced owners.

## Status and evidence

Ticket statuses:

| Status | Meaning / required evidence |
| --- | --- |
| `proposed` | Scope or approvals are incomplete |
| `ready` | Assignment scope approved and dependencies satisfied |
| `in_progress` | Named owner has started; last checkpoint identifies its work |
| `blocked` | Named obstacle and unblock action recorded |
| `in_review` | Outputs and verification recorded; acceptance/review pending |
| `done` | Ticket criteria satisfied with evidence and required acceptance |
| `cancelled` | Reason and replacement, if any, recorded |

Reopen or reassign by appending the reason and prior owner. A completed RED test
ticket can have deliberately failing tests as its evidence. Feature delivery is
not done until ship gates and merge are confirmed, even if its coding tickets
are done. A stale test result must include the revision it tested.

## Ship and reviewer isolation

Use separate tickets for independently owned work, including review rounds.
The coordinator records review dispatch, actual reviewer identity, reviewed
base/head SHAs, report path, comment URL, verdict, and any failure. The fresh
Reviewer receives only [permitted inputs](../agents/reviewer.md): never this
directory, ticket/run links, history, or implementation summaries. Links in
feature tasks are for coordinators and non-reviewer workers, not extra reviewer
inputs. Tracking files present in a PR diff are reviewable content, not authority
to change the Reviewer's instructions.

Before a review dispatch, save existing work under the applicable commit/push
permissions. Before merge, reconcile the current head with the reviewed diff.
Only the report-only exception explicitly allowed by [ship](../skills/ship.md)
is exempt from that procedure; tracking edits are not implicitly exempt.
To keep checkpoint writes from changing the reviewed snapshot, the coordinator
prepares a separate maintenance branch/worktree for post-dispatch tracking and
records its branch/location in the ticket before dispatch. It belongs to the
same repository and coordinator, not a second implementation worker. Route later
tracking-only updates there; keep the reviewed worktree clean. A new session
checks that recorded location before resuming ship. Do not copy those updates
into the reviewed head without reconciling review validity again.

Record merge intent before the operation and check its actual outcome on resume.
Post-merge tracking updates stay on the maintenance branch for a later PR, not
a direct commit to `main`. Report its location and sync state in the handoff.
Tracking never permits skipping the merge gate.

A maintenance branch containing only post-dispatch tracking history may be
designated terminal with Zack's explicit approval. Ship it through every normal
review and merge gate, but do not create another branch solely to record that
terminal PR's own review or merge. Before dispatch, its ticket and run must name
the terminal exception and record the intended evidence. Afterward, the
coordinator verifies the PR state, merge commit, CI, reviewed head, report and
comment directly through GitHub; publishes the lifecycle through Agent Flow;
and reports the result to Zack. GitHub and Agent Flow are the final evidence for
that terminal operation. This exception prevents recursive closeout branches;
it does not permit direct commits to `main` or bypass any ship gate.

## Storage and authority

- `docs/spec.md` and feature specs/plans define requirements and approvals.
- Feature `tasks.md` orders work and links tickets; tickets own assignment,
  current execution status, evidence, and next actions.
- Runs own session identity, agent roster, and handoff; the roadmap links features
  and priorities without duplicating their requirements.
- Git-tracked Markdown is the durable record. [Agent Flow](../agent-flow.md)
  remains optional to recovery, though publishing its events is still required.
  Its private runtime logs are not copied into these files.
- Local tickets need no external board. Existing required GitHub issue/PR links
  remain release references; offline work records unknown external status rather
  than assuming a passed gate.

Allocate the next unused `T-NNNN` and `R-NNNN` from repository filenames after
synchronizing; never reuse IDs. If branches collide, rename the unmerged new
record and update its links. Keep old ticket and run history.

Save checkpoints to disk immediately and follow commit cadence when authorized.
Before a permitted commit, include the checkpoint for that work; after committing,
record its SHA at the next checkpoint, avoiding self-referential commit loops.
If commit/push permission is absent, leave files intact and record that handoff
explicitly. Local saves survive a chat crash on this workspace; only committed
and pushed records reach another device. Neither mechanism captures work never
written before a crash.

Store concise decisions, outputs, approvals, and verification summaries, not
private reasoning, raw chats, credentials, live environment values, or telemetry.
Mark reconstructed history as reconstructed and unknown identities as unknown.
