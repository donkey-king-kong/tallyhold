# T-0001: Durable work tracking

## Assignment

- Status: done
- Owner actor: unassigned; R-0001/coordinator released execution at handoff
- Role: coordinator (documentation maintenance performed directly)
- Run: [R-0001](../runs/R-0001.md)
- Feature / task: [documentation maintenance spec](../../specs/chore-durable-work-tracking/spec.md)
- Authorization: Zack requested setup and mandatory session/agent instructions
  on 2026-11-13 in this conversation, following the proposed repo-local structure.
  No product behavior or constitution change requested. Zack subsequently
  authorized commit, push, and PR creation; publication is tracked in T-0002.
- Dependencies: none
- Branch / worktree: `chore/durable-work-tracking`, repository root
- Issue / PR: issue #5; PR publication tracked in [T-0002](T-0002-publish-work-tracking.md)
- Updated: 2026-11-13T02:48:51Z

## Scope

Create `docs/work/` with recovery rules, a roadmap, ticket/run templates, and real
bootstrap records. Add pointers in `AGENTS.md`, `README.md`, workflow, relevant
role instructions, Agent Flow docs, and the feature task template.
Preserve feature approval gates and Reviewer isolation.

Excluded: external boards, replacing GitHub issues, automatic transcript capture,
application code, changes to the constitution, and fabricated historical agents.

## Acceptance

- [x] A new session can find current tickets, plan links, ownership, and next action.
- [x] Each non-reviewer role has an explicit pointer to the checkpoint procedure.
- [x] Tickets and runs distinguish actor identity, role, evidence, and failed dispatch.
- [x] Recovery covers dirty worktrees, stale ownership, and already-completed PR actions.
- [x] Reviewer inputs and merge gates remain restricted.
- [x] Changed Markdown links and diff whitespace checks pass; scenario checks recorded.

## Checkpoint

- Last completed action: verified Zack merged PR #6 at
  `56c87e25f2fec735694d4cf1a6ad56e01e7cfce6`; issue #5 closed.
- Evidence: base `6a106a832ed7f57fcf6bf1ce339a53741a8d18f3`;
  checks ran against the uncommitted documentation diff on this base, not a new
  commit. Local Node checks resolved 69 links across 16 changed/new Markdown
  documents and verified entrypoint chains, five role pointers, and unchanged
  constitution/reviewer/ship files. `git diff --check` passed.
- Worktree state: primary worktree updated to merged `main`; closeout records
  remain on `chore/work-tracking-checkpoints`.
- Remaining work: no implementation work; failed review attempts retained in
  T-0003, without claiming an independent approval.
- Blocker / unblock action: no implementation blocker.
- Next action: none for this implementation ticket.
- Handoff recipient: none; accepted by Zack's merge.

## Verification walkthrough

These are coordinator-performed documentation scenario checks, not an independent
Reviewer verdict, automated agent behavior tests, or a simulated process crash.

| Scenario | Expected recovery and checked result |
| --- | --- |
| New Trae or Claude session | Existing entrypoints reach `AGENTS.md`, work index, ticket and run; pointers verified |
| Crash during uncommitted work | Startup inspects dirty state and preserves files; checkpoint exposes unfinished work and next action |
| Abandoned `in_progress` ticket | Verify worker stopped, append takeover, create successor run; no inferred live ownership |
| Failed subagent dispatch | Timeline preserves failure; no roster row claims a nonexistent agent |
| Reviewer handoff | Coordinator owns ticket; only permitted review inputs are dispatched; reviewer role unchanged |
| Checkpoint after review | Separate maintenance worktree holds tracking updates; reviewed snapshot stays clean and gates remain unchanged |
| Merge succeeded before crash | Reconcile actual PR/Git result before retrying; record outcome on maintenance branch, not main |
| Offline or unauthorized publication | Record unknown CI state and local/unpushed status; neither implies merge permission |

Backend/frontend suites were not rerun: this change is Markdown-only. No PR was
opened and no independent Reviewer was dispatched.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T02:00:14Z | R-0001/coordinator | Claimed user-authorized documentation setup; no subagents dispatched | Clean main at `6a106a8`; branch created; add tracking and pointers |
| 2026-11-13T02:04:55Z | R-0001/coordinator | Created records and wired all five non-reviewer roles; found actor slash IDs incompatible with Agent Flow and added explicit adapter-ID mapping | `AGENTS.md`, role files, `docs/agent-flow.md`; validate links and handoff next |
| 2026-11-13T02:05:38Z | R-0001/coordinator | Link, instruction-invariant, and diff checks passed; recovery walkthrough complete; released ownership and moved to `in_review` | Validation above; awaiting Zack's acceptance/publication instruction |
| 2026-11-13T02:14:40Z | R-0001/coordinator | Zack authorized commit, push, and PR creation; linked maintenance spec and issue #5 | Publication proceeds under T-0002 |
| 2026-11-13T02:48:51Z | R-0001/coordinator | Confirmed Zack merged PR #6 at `56c87e2` and issue #5 closed; implementation delivered | Local main synchronized; no independent review approval inferred |
