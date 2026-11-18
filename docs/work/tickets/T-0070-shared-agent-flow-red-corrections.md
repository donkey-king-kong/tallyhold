# T-0070: Correct shared Agent Flow RED assertions

## Assignment

- Status: in_progress
- Owner actor: R-0070/coordinator
- Role: coordinator / Test writer (RED only)
- Run: [R-0070](../runs/R-0070.md), after [R-0067](../runs/R-0067.md)
- Feature / task: [approved spec](../../specs/chore-shared-agent-flow-stream/spec.md), [approved plan](../../specs/chore-shared-agent-flow-stream/plan.md)
- Authorization: Zack requested round-1 assertion corrections and end-to-end workflow on 2026-11-18.
- Dependencies: [round-1 report](../../specs/chore-shared-agent-flow-stream/red-review.md) at `33bcd06`
- Branch / worktree: `chore/shared-agent-flow-stream`, `../tallyhold-chore-shared-agent-flow-stream`
- Issue / PR: related #38; PR not created
- Updated: 2026-11-18T03:58:00Z

## Scope

Strengthen `.trae/agent-flow/test_adapter.py` and RED evidence only. Leave
adapter, approved spec and plan unchanged. Hand pushed RED head to a different
fresh round-2 reviewer before GREEN.

## Acceptance

- [x] Exact slug, direct Store, invalid session, symlink/common-dir, and seeded-root assertions added.
- [x] Full RED suite fails only for missing behavior; six legacy tests pass separately.
- [ ] RED test and evidence commit pushed; round-2 verdict recorded.

## Checkpoint

- Last completed action: pushed corrected RED head `91bcc4b1fe051abe6a80925b0ab55ba3ce668ec2`; Zack separately approved cost stages 1/2 and 2/2 for fresh Claude Opus round 2, conditional Trae fallback.
- Evidence: [RED evidence](../../specs/chore-shared-agent-flow-stream/red-test-run.md), full suite and legacy subset at pinned test revision.
- Worktree state: tracking dispatch checkpoint pending commit; RED head pushed.
- Remaining work: fresh round-2 review; GREEN only after APPROVE.
- Blocker / unblock action: GREEN waits for round-2 APPROVE; provider cost gate before reviewer dispatch.
- Next action: commit/push dispatch checkpoint, then launch fresh round-2 reviewer for base `c12b954`, RED `91bcc4b`.
- Handoff recipient: fresh RED Reviewer round 2.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T03:54:28Z | R-0070/coordinator | Claimed Test writer correction; clean branch matches remote `33bcd06` | Add focused RED assertions; no adapter edit |
| 2026-11-18T03:55:13Z | R-0070/coordinator | Corrected tests committed as `3c1dd81`; full suite 28 tests, 21 expected failures, seven passes, no errors; six legacy pass | Evidence updated; commit/push before review |
| 2026-11-18T03:58:00Z | R-0070/coordinator | RED evidence `91bcc4b` pushed; Zack granted separate COST APPROVAL 1/2 then 2/2 for round-2 Claude Opus, contingent Trae fallback | Check Claude and dispatch fresh role-only reviewer against `c12b954` / `91bcc4b` |
| 2026-11-18T04:00:00Z | R-0070/coordinator | Claude Opus exited 1 before verdict with `ECONNREFUSED`; no review round consumed | Commit failure; dispatch a different fresh Trae fallback for the same RED head |
