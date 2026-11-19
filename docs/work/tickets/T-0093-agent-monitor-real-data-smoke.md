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
- Updated: 2026-11-19T02:09:17Z

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
- [ ] New synthetic DOM and Playwright guards fail on `937ac4f` for missing behavior while unaffected tests pass.
- [ ] A fresh independent RED Reviewer approves the pushed RED handoff before GREEN.
- [ ] Findings A-H are corrected or the handoff records a deviation and reason.
- [ ] `npm run preview:real -- <jsonl>` uses the real parser/presentation path and writes four ignored images.
- [ ] Committed sanitized previews and all required checks are pushed for Zack.

## Checkpoint

- Last completed action: recorded Zack's four approved decisions in the Feature 008 spec, plan, and tasks.
- Evidence: AC16 and the approved real-data smoke amendment define identity collapse, unassigned lane, registration exclusion, and compact filtering.
- Worktree state: tracking and approved amendments are modified over synchronized `937ac4f`.
- Remaining work: amendments, RED guards/evidence/review, GREEN, real preview, verification, and handoff.
- Blocker / unblock action: production changes blocked until fresh RED approval.
- Next action: commit the approved amendment checkpoint, then add synthetic failing guards.
- Handoff recipient: fresh RED Reviewer after pushed RED evidence.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-19T02:06:53Z | R-0095/coordinator | Created from clean synchronized `937ac4f` after real-data smoke failure | Record approved amendments and write RED guards before production edits |
| 2026-11-19T02:09:17Z | R-0095/coordinator | Recorded Zack's four decisions as approved spec/plan amendments and added ordered correction tasks | Commit the amendment checkpoint, then write RED guards |
