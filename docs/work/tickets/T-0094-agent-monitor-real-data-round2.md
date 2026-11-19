# T-0094: Correct Agent Monitor real-data preview round 2

## Assignment

- Status: blocked
- Owner actor: R-0096/coordinator
- Role: coordinator / Test writer
- Run: [R-0096](../runs/R-0096.md), after [R-0095](../runs/R-0095.md)
- Feature / task: [Feature 008 spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), real-data preview round 2
- Authorization: Zack's hands-on review of four real-data previews and decisions d-g on 2026-11-19
- Dependencies: [T-0093](T-0093-agent-monitor-real-data-smoke.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Worktree path: `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested
- Updated: 2026-11-19T05:23:09Z

## Scope

Diagnose the real shared stream at reviewed head `7ccf2b8`, record approved
decisions d-g, add synthetic RED guards, obtain fresh independent RED approval,
then correct P1-P8 and regenerate fixture and ignored real-data previews.

Never commit the real stream, `.preview-real` images, diagnosis output, or local
paths. Do not reinstall the extension or open a PR.

## Acceptance

- [x] A local parser-backed diagnosis explains P3 and the 32-versus-39 count.
- [x] Decisions d-g are recorded as approved Feature 008 amendments.
- [ ] Synthetic guards fail for the missing behavior and receive fresh RED approval.
- [ ] P1-P8 are corrected or a deviation and reason are recorded.
- [ ] All checks and new guards pass; fixture previews are committed and pushed.
- [ ] Four ignored real-data previews are regenerated and visually checked.

## Checkpoint

- Last completed action: final fresh RED review round 2 returned
  `CHANGES_REQUESTED`.
- Evidence: [round-2 report](../../specs/008-agent-monitor-ui/red-review.md)
  and [identical commit comment](https://github.com/donkey-king-kong/tallyhold/commit/ff84be6bda387c75622a9b72ef78f11aa0d66098#commitcomment-210787075)
  cover pushed RED head `ff84be6`.
- Worktree state: reviewer report and escalation tracking are uncommitted;
  production remains unchanged and private diagnosis remains outside the
  repository.
- Remaining work: Zack resolves the exhausted RED-review escalation before any
  further test correction or GREEN implementation.
- Blocker / unblock action: round-2 reviewer requires one SVG guard correction:
  parse absolute/relative `M/L/H/V/Z` paths with implicit command repetition in
  both DOM and browser guards, plus an adversarial relative-path fixture. Zack
  must explicitly authorize that post-round-2 correction or choose another
  resolution.
- Next action: commit and push the reviewer report and this exact escalation,
  then stop for Zack.
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
