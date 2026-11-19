# T-0094: Correct Agent Monitor real-data preview round 2

## Assignment

- Status: in_progress
- Owner actor: R-0096/coordinator
- Role: coordinator / Implementer
- Run: [R-0096](../runs/R-0096.md), after [R-0095](../runs/R-0095.md)
- Feature / task: [Feature 008 spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), real-data preview round 2
- Authorization: Zack's hands-on review of four real-data previews and decisions d-g on 2026-11-19
- Dependencies: [T-0093](T-0093-agent-monitor-real-data-smoke.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Worktree path: `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested
- Updated: 2026-11-19T07:55:47Z

## Scope

Diagnose the real shared stream at reviewed head `7ccf2b8`, record approved
decisions d-g, add synthetic RED guards, obtain fresh independent RED approval,
then correct P1-P8 and regenerate fixture and ignored real-data previews.

Never commit the real stream, `.preview-real` images, diagnosis output, or local
paths. Do not reinstall the extension or open a PR.

## Acceptance

- [x] A local parser-backed diagnosis explains P3 and the 32-versus-39 count.
- [x] Decisions d-g are recorded as approved Feature 008 amendments.
- [x] Synthetic guards fail for the missing behavior and receive fresh RED approval.
- [x] P1-P8 are corrected without deviations.
- [ ] All checks and new guards pass; fixture previews are committed and pushed.
- [x] Four ignored real-data previews are regenerated and visually checked.

## Checkpoint

- Last completed action: implemented P1-P8, regenerated fixture and private
  previews, and visually checked all six images.
- Evidence: 138 extension tests pass with 95.33% statement and 96.94% line
  coverage; browser layout checks pass at both widths; lint, formatting,
  typecheck, benchmark, package, and 30 adapter tests pass. The VSIX excludes
  `.preview-real`; packaging retains the pre-existing missing-LICENSE warning.
- Worktree state: implementation, fixture previews, tasks, and this checkpoint
  are ready to commit. Four real-data previews and all generated build,
  benchmark, coverage, and package outputs remain ignored.
- Remaining work: commit and push implementation and fixture previews, then
  record the resulting SHA and stop for Zack.
- Blocker / unblock action: none.
- Next action: commit and push the verified GREEN implementation.
- Handoff recipient: Zack after completed verification.

## History

| UTC time             | Actor              | Event and observed result                                                | Evidence / next action                        |
| -------------------- | ------------------ | ------------------------------------------------------------------------ | --------------------------------------------- |
| 2026-11-19T04:04:05Z | R-0096/coordinator | Created from clean synchronized `7ccf2b8` after real-preview review round 2 | Diagnose the shared stream before code changes |
| 2026-11-19T04:08:11Z | R-0096/coordinator | Diagnosed registration and count defects; recorded approved decisions d-g   | Commit amendments, then write synthetic RED guards |
| 2026-11-19T05:08:30Z | R-0096/test-writer | Committed and proved synthetic RED guards at `440adb1`                      | Push evidence and obtain fresh RED approval         |
| 2026-11-19T05:14:33Z | R-0096/coordinator | Fresh RED round 1 requested three test corrections for pushed `262969e`    | Record report, correct findings, dispatch round 2   |
| 2026-11-19T05:19:28Z | R-0096/test-writer | Corrected all round-1 findings and proved cumulative RED at `cf00f04`       | Push evidence and dispatch fresh round 2            |
| 2026-11-19T05:23:09Z | R-0096/coordinator | Final fresh RED round 2 requested one SVG-path guard correction at `ff84be6` | Escalate to Zack; do not enter GREEN                 |
| 2026-11-19T07:05:47Z | Zack / R-0096/coordinator | Authorized the one targeted post-round-2 test correction                | Correct SVG parser guard, rerun evidence, enter GREEN |
| 2026-11-19T07:12:31Z | R-0096/test-writer | Proved the shared absolute/relative/implicit SVG parser and cumulative RED | Commit correction, rerun at pinned SHA, enter GREEN |
| 2026-11-19T07:15:17Z | R-0096/test-writer | Recorded exact-revision evidence for `744771b` and handed GREEN to Implementer | Commit and push evidence, implement P1-P8 |
| 2026-11-19T07:55:47Z | R-0096/coordinator | Verified P1-P8 and visually checked two fixture plus four ignored real-data previews | Commit and push verified GREEN; record SHA |
