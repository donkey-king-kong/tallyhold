# T-0091: Correct Agent Monitor preview round 1

## Assignment

- Status: in_progress
- Owner actor: R-0093/coordinator
- Role: Test writer, then Implementer after RED approval
- Run: [R-0093](../runs/R-0093.md), after [R-0092](../runs/R-0092.md)
- Feature / task: [Feature 008 spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), preview round 1 correction
- Authorization: Zack rejected preview round 1 and explicitly requested RED-first correction on 2026-11-18
- Dependencies: [T-0090](T-0090-agent-monitor-ui-green.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Worktree path: `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested
- Updated: 2026-11-18T08:54:48Z

## Scope

Make the production-bundle preview a fair 2x comparison with the approved mock,
add Playwright layout guards at 1440x940 and 800x900, replace the synthetic
fixture with the approved worktree scenario, and correct the webview shell,
graph, navigator, inspector, controls, footer, and narrow layout. Preserve the
approved data-honesty, AC8, timeline, and display-name rules. Do not reinstall
the VSIX or open a PR.

## Acceptance

- [x] New Playwright guards fail over production head `c9714a5` for missing agent-card state/containment while all 125 existing Vitest cases pass.
- [ ] Wide and narrow production-bundle previews visibly satisfy Zack's nine numbered correction areas with no invented branch/track data.
- [ ] Existing lint, format, typecheck, build, package, tests, coverage, adapter tests, and benchmarks pass with the new layout checks.
- [ ] Corrected previews and implementation are committed and pushed; handoff lists each fix as done or explains a deviation.

## Checkpoint

- Last completed action: implemented the centered orchestrator, shared bus, fixed lane headers, lane rails/ticks, statusless structural-root suppression, circular status marks, selected card state, and `name · run` labels.
- Evidence: focused presentation/webview suite passes 60/60; typecheck and format check pass.
- Worktree state: graph/card slice and this checkpoint are ready to commit over pushed `1341359`.
- Remaining work: implement shell, navigator, inspector, controls, footer, responsive CSS, regenerate previews, run the full verification matrix, commit, and push.
- Blocker / unblock action: none.
- Next action: commit the graph/card slice, then implement shell/navigation/inspection structure.
- Handoff recipient: Zack after pushed corrected previews; no reinstall and no PR.

## History

| UTC time             | Actor              | Event and observed result                                                                                                                           | Evidence / next action                                                          |
| -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 2026-11-18T08:09:13Z | R-0093/coordinator | Created after Zack rejected preview round 1; claimed RED-first correction                                                                           | Inspect visual evidence, then write Playwright guards before production changes |
| 2026-11-18T08:11:59Z | R-0093/coordinator | Added target-size/density fixture and production-bundle guards for pane separation, overflow, selected-card visibility, and copy-button containment | Commit RED slice, prove intended failure, and preserve existing suite           |
| 2026-11-18T08:13:24Z | R-0093/coordinator | RED `ba58a24` fails for absent agent-card state/containment; all 125 prior Vitest cases pass                                                        | Commit/push evidence and obtain fresh RED approval before GREEN                 |
| 2026-11-18T08:15:38Z | R-0093/coordinator | Pushed RED through `c62a51d`; fixed review range is `c9714a5..c62a51d`                                                                              | Dispatch fresh Trae RED Reviewer round 1; no production edit before verdict     |
| 2026-11-18T08:19:14Z | R-0093/reviewer-01 | Round 1 `CHANGES_REQUESTED` stronger geometry/population/overflow guards and executed-revision evidence                                             | Correct RED and use a different fresh Reviewer for round 2                      |
| 2026-11-18T08:21:20Z | R-0093/coordinator | Corrected RED `2d98f54` fails on target inspector width while all 125 existing tests pass                                                             | Commit/push evidence and dispatch final fresh RED review                       |
| 2026-11-18T08:22:12Z | R-0093/coordinator | Pushed cumulative RED through `a49801f`; final review range is `c9714a5..a49801f`                                                                      | Commit/push checkpoint and dispatch different fresh Reviewer round 2           |
| 2026-11-18T08:24:57Z | R-0093/reviewer-02 | Round 2 `CHANGES_REQUESTED`: counted preview population lacks per-element visibility and nonzero-bounds assertions                                    | Stop GREEN and escalate to Zack under the two-round limit                      |
| 2026-11-18T08:26:20Z | R-0093/coordinator | Zack authorized one targeted RED correction for the remaining visibility/nonzero-bounds finding                                                     | Correct tests only, rerun evidence, push, and stop before GREEN                |
| 2026-11-18T08:28:01Z | R-0093/coordinator | Targeted RED `f4d7519` closes the hidden/zero-area population defect; preview remains RED, 125/125 tests and typecheck pass                          | Commit/push evidence and stop for Zack's GREEN confirmation                    |
| 2026-11-18T08:47:36Z | R-0093/coordinator | Zack confirmed corrected RED `f4d7519` and authorized GREEN                                                                                         | Implement approved preview correction without weakening tests                 |
| 2026-11-18T08:54:48Z | R-0093/coordinator | Graph/card GREEN slice passes 60/60 focused tests, typecheck, and format check                                                                        | Commit slice, then implement shell/navigation/inspection structure             |
