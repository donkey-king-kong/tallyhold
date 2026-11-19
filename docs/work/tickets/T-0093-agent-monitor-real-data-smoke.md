# T-0093: Correct Agent Monitor real-data smoke failures

## Assignment

- Status: in_progress
- Owner actor: R-0095/coordinator
- Role: coordinator / Test writer
- Run: [R-0095](../runs/R-0095.md), after [R-0094](../runs/R-0094.md)
- Feature / task: [Feature 008 spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), real-data smoke correction
- Authorization: Zack's hands-on smoke round 1 findings and explicit decisions on 2026-11-19
- Dependencies: [T-0091](T-0091-agent-monitor-preview-round1.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Worktree path: `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested
- Updated: 2026-11-19T02:29:07Z

## Scope

Correct Feature 008 behavior exposed by the real shared Agent Flow log:
unassigned legacy identities, repeated runs, registration roots, filtered lane
compaction, collision-free card content, a resizable navigator, readable canvas
type, and range-honest footer copy. Add a local `preview:real` command that uses
the real parser/presentation pipeline but never commits its input or outputs.

Production code remains frozen until the synthetic guards and RED evidence are
committed, pushed, and approved by a fresh independent RED Reviewer. Do not
reinstall the VSIX or open a PR.

## Acceptance

- [x] Zack's four decisions are recorded as approved Feature 008 spec/plan amendments.
- [x] New synthetic DOM and Playwright guards fail on `937ac4f` for missing behavior while unaffected tests pass.
- [ ] A fresh independent RED Reviewer approves the pushed RED handoff before GREEN.
- [ ] Findings A-H are corrected or the handoff records a deviation and reason.
- [ ] `npm run preview:real -- <jsonl>` uses the real parser/presentation path and writes four ignored images.
- [ ] Committed sanitized previews and all required checks are pushed for Zack.

## Checkpoint

- Last completed action: fresh Trae RED review round 1 returned `CHANGES_REQUESTED` for six coverage gaps and three test defects.
- Evidence: [RED review](../../specs/008-agent-monitor-ui/red-review.md); [commit comment](https://github.com/donkey-king-kong/tallyhold/commit/b728a9325ac98e8afaac5edf763055e9322e0318#commitcomment-210770284).
- Worktree state: reviewer report is modified over synchronized `ae7053d`; production remains unchanged.
- Remaining work: correct RED findings, rerun evidence, fresh round-2 review, GREEN, real preview, verification, and handoff.
- Blocker / unblock action: production changes blocked until fresh RED approval.
- Next action: restore endpoint assertions, parse connector segments, fix timestamps, and cover registration metadata/search, active compaction, resizer bounds, run scope, and executable real preview.
- Handoff recipient: fresh RED Reviewer after pushed RED evidence.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-19T02:06:53Z | R-0095/coordinator | Created from clean synchronized `937ac4f` after real-data smoke failure | Record approved amendments and write RED guards before production edits |
| 2026-11-19T02:09:17Z | R-0095/coordinator | Recorded Zack's four decisions as approved spec/plan amendments and added ordered correction tasks | Commit the amendment checkpoint, then write RED guards |
| 2026-11-19T02:14:09Z | R-0095/coordinator | Added sanitized DOM, Playwright, fixture, and CLI contract guards; production remains unchanged | Commit tests, then prove RED and unaffected checks separately |
| 2026-11-19T02:20:59Z | R-0095/test-writer | Verified six intended RED failures, 125 unaffected passes, browser RED, static checks, and 30 adapter passes at `a0d0804` | Commit/push evidence and tracking, then dispatch fresh RED review |
| 2026-11-19T02:22:16Z | R-0095/coordinator | Pushed and remotely verified RED handoff `b728a93` against base `937ac4f`; round-1 reviewer is pending | Freeze the reviewed snapshot and dispatch a fresh Trae RED Reviewer |
| 2026-11-19T02:29:07Z | R-0095/coordinator | Fresh Trae round 1 returned `CHANGES_REQUESTED`; comment `210770284` identifies six uncovered decisions, malformed timestamps, invalid path geometry, and weakened endpoint coverage | Test writer makes only required RED corrections and prepares round 2 |
