# T-0070: Correct shared Agent Flow RED assertions

## Assignment

- Status: blocked
- Owner actor: R-0070/coordinator
- Role: coordinator / Test writer (RED only)
- Run: [R-0070](../runs/R-0070.md), after [R-0067](../runs/R-0067.md)
- Feature / task: [approved spec](../../specs/chore-shared-agent-flow-stream/spec.md), [approved plan](../../specs/chore-shared-agent-flow-stream/plan.md)
- Authorization: Zack requested round-1 assertion corrections and end-to-end workflow on 2026-11-18.
- Dependencies: [round-1 report](../../specs/chore-shared-agent-flow-stream/red-review.md) at `33bcd06`
- Branch / worktree: `chore/shared-agent-flow-stream`, `../tallyhold-chore-shared-agent-flow-stream`
- Issue / PR: related #38; PR not created
- Updated: 2026-11-18T04:08:06Z

## Scope

Strengthen `.trae/agent-flow/test_adapter.py` and RED evidence only. Leave
adapter, approved spec and plan unchanged. Hand pushed RED head to a different
fresh round-2 reviewer before GREEN.

## Acceptance

- [x] Exact slug, direct Store, invalid session, symlink/common-dir, and seeded-root assertions added.
- [x] Full RED suite fails only for missing behavior; six legacy tests pass separately.
- [x] RED test and evidence commit pushed; round-2 verdict recorded.

## Checkpoint

- Last completed action: fresh Trae round-2 reviewer returned `CHANGES_REQUESTED` for base `c12b954` / RED `91bcc4b`; report matches commit comment byte-for-byte.
- Evidence: [RED evidence](../../specs/chore-shared-agent-flow-stream/red-test-run.md); [round-2 report](../../specs/chore-shared-agent-flow-stream/red-review.md); [comment](https://github.com/donkey-king-kong/tallyhold/commit/91bcc4b1fe051abe6a80925b0ab55ba3ce668ec2#commitcomment-210584913). Reviewer: fresh Trae subagent `a1d3f07d-3514-4057-a01d-1a862f48d746` (different from round 1).
- Worktree state: report/tracking edits pending commit and push.
- Remaining work: Zack resolves RED escalation before GREEN; no PR.
- Blocker / unblock action: round 2 was not approved; Zack decides whether to authorize another focused correction/review exception or revise the workflow.
- Next action: Zack reviews round-2 findings and explicitly decides the RED gate outcome; do not start GREEN.
- Handoff recipient: Zack.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T03:54:28Z | R-0070/coordinator | Claimed Test writer correction; clean branch matches remote `33bcd06` | Add focused RED assertions; no adapter edit |
| 2026-11-18T03:55:13Z | R-0070/coordinator | Corrected tests committed as `3c1dd81`; full suite 28 tests, 21 expected failures, seven passes, no errors; six legacy pass | Evidence updated; commit/push before review |
| 2026-11-18T03:58:00Z | R-0070/coordinator | RED evidence `91bcc4b` pushed; Zack granted separate COST APPROVAL 1/2 then 2/2 for round-2 Claude Opus, contingent Trae fallback | Check Claude and dispatch fresh role-only reviewer against `c12b954` / `91bcc4b` |
| 2026-11-18T04:00:00Z | R-0070/coordinator | Claude Opus exited 1 before verdict with `ECONNREFUSED`; no review round consumed | Commit failure; dispatch a different fresh Trae fallback for the same RED head |
| 2026-11-18T04:08:06Z | R-0070/coordinator | Fresh Trae reviewer `a1d3f07d-3514-4057-a01d-1a862f48d746` returned round-2 `CHANGES_REQUESTED`; report and commit comment `210584913` identical | Contradictory payload assertion; long-ID hash and invalid-parent coverage missing; stop GREEN and escalate to Zack |
