# T-0091: Correct Agent Monitor previews

## Assignment

- Status: in_progress
- Owner actor: R-0094/coordinator
- Role: Test writer, then Implementer after RED approval
- Run: [R-0094](../runs/R-0094.md), after [R-0093](../runs/R-0093.md)
- Feature / task: [Feature 008 spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), preview corrections
- Authorization: Zack reviewed preview round 2 and explicitly requested the five listed corrections on 2026-11-18
- Dependencies: [T-0090](T-0090-agent-monitor-ui-green.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Worktree path: `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested
- Updated: 2026-11-18T11:06:20Z

## Scope

Make the production-bundle preview a fair 2x comparison with the approved mock,
add Playwright layout guards at 1440x940 and 800x900, replace the synthetic
fixture with the approved worktree scenario, and correct the webview shell,
graph, navigator, inspector, controls, footer, and narrow layout. Preserve the
approved data-honesty, AC8, timeline, and display-name rules. Do not reinstall
the VSIX or open a PR.

For preview round 2, remove duplicate connector geometry, constrain every card
to its lane, use adapter-accurate hashed worktree IDs, restore normal narrow
page flow, and apply the requested timeline/status/older-run polish.

## Acceptance

- [x] New Playwright guards fail over production head `c9714a5` for missing agent-card state/containment while all 125 existing Vitest cases pass.
- [x] Wide and narrow production-bundle previews visibly satisfy Zack's nine numbered correction areas with no invented branch/track data.
- [x] Existing lint, format, typecheck, build, package, tests, coverage, adapter tests, and benchmarks pass with the new layout checks.
- [x] Corrected previews and implementation are committed and pushed; handoff lists each fix as done or explains a deviation.
- [ ] Each lane has exactly one rail and one tick per rendered agent card; every card stays within its lane header width.
- [ ] Preview IDs follow the adapter's normalized-prefix plus eight-hex-hash contract, with the hash shown muted and no invented branch name.
- [ ] The 800px preview uses normal document flow through the complete inspector and footer without clipped content or empty trailing space.
- [ ] Round-2 previews and all required checks are committed and pushed for Zack.

## Checkpoint

- Last completed action: Zack authorized one targeted RED correction for the superseded AC5 wrap/no-ellipsis assertion and residual plan prose.
- Evidence: explicit selection of "Authorize targeted fix" after the round-2 escalation; production remains unchanged.
- Worktree state: remote head `4cd1f9f`; targeted test/plan correction and this checkpoint are local and uncommitted.
- Remaining work: commit the targeted RED correction, rerun exact-revision evidence, push, and stop for Zack's GREEN confirmation.
- Blocker / unblock action: none for the targeted RED correction; GREEN remains frozen pending explicit confirmation.
- Next action: commit the corrected AC5 guard, rerun RED and unaffected checks, record evidence, and push.
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
| 2026-11-18T09:18:35Z | R-0093/coordinator | Completed the mock-aligned shell and final automated gate; 125 tests, coverage, layout guards, package audit, adapter tests, benchmarks, and detector pass | Commit and push implementation and corrected previews; do not reinstall or smoke |
| 2026-11-18T09:19:44Z | R-0093/coordinator | Pushed graph `5358538` and final workspace/previews `b067995` to the feature branch | Stop for Zack's preview comparison; no reinstall, smoke, or PR |
| 2026-11-18T10:40:06Z | R-0094/coordinator | Reopened after Zack's round-2 review at clean synchronized `881d320` | Write new connector and card-containment guards before production changes |
| 2026-11-18T10:45:07Z | R-0094/coordinator | Pushed RED test `8053e11` and evidence head `96b4b14`; production remains unchanged | Dispatch fresh RED Reviewer round 1 for base `881d320` and head `96b4b14` |
| 2026-11-18T10:46:53Z | R-0094/reviewer-01 | Round 1 `CHANGES_REQUESTED`: reconcile fixed-width ellipsis with AC5/plan, permit below-fold narrow flow, and require exact visible slug/status copy | Correct RED only, rerun evidence, and use a different fresh Reviewer for round 2 |
| 2026-11-18T10:52:24Z | R-0094/coordinator | Recorded review comment `210627545`, amended the approved contract per Zack's newer decision, and strengthened all three guards; production remains frozen | Commit corrected RED, rerun at the pinned SHA, and prepare round-2 handoff |
| 2026-11-18T10:55:04Z | R-0094/coordinator | Corrected RED `b826fac` reproduces five intended failures; 121 unaffected tests, lint, format, and typecheck pass | Commit/push evidence and dispatch a different fresh round-2 Reviewer |
| 2026-11-18T10:55:54Z | R-0094/coordinator | Committed corrected evidence `2534e51` and prepared the frozen round-2 handoff | Commit/push this checkpoint, then dispatch reviewer-02 with restricted inputs |
| 2026-11-18T10:58:35Z | R-0094/reviewer-02 | Round 2 `CHANGES_REQUESTED`: prior narrow, slug, and status findings resolved; unchanged AC5 test still rejects the approved ellipsis behavior | Stop GREEN and escalate under the two-round limit |
| 2026-11-18T10:58:55Z | R-0094/coordinator | Verified comment `210630205` against the source lines and recorded the final-round escalation | Commit/push the report and stop for Zack's decision |
| 2026-11-18T11:06:20Z | R-0094/coordinator | Zack authorized one targeted RED exception for the superseded AC5 assertion and residual plan prose | Correct only those lines, rerun evidence, push, and stop before GREEN |
