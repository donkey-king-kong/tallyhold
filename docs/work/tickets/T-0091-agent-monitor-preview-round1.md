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
- Updated: 2026-11-18T08:15:38Z

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

- Last completed action: pushed RED through `c62a51d` and prepared fresh Trae RED review round 1 against base `c9714a5`.
- Evidence: `npm run test:preview-layout` fails with `expected lane headers and agent cards`; `npx vitest run` passes 125/125 from the extension directory; `red-test-run.md` is pushed.
- Worktree state: pre-dispatch tracking checkpoint is uncommitted over clean pushed RED head `c62a51d`.
- Remaining work: obtain fresh RED review, implement corrections, regenerate previews, and verify.
- Blocker / unblock action: none.
- Next action: commit/push this checkpoint, then dispatch a fresh independent Trae RED Reviewer with restricted inputs.
- Handoff recipient: Zack after pushed corrected previews; no reinstall and no PR.

## History

| UTC time             | Actor              | Event and observed result                                                                                                                           | Evidence / next action                                                          |
| -------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 2026-11-18T08:09:13Z | R-0093/coordinator | Created after Zack rejected preview round 1; claimed RED-first correction                                                                           | Inspect visual evidence, then write Playwright guards before production changes |
| 2026-11-18T08:11:59Z | R-0093/coordinator | Added target-size/density fixture and production-bundle guards for pane separation, overflow, selected-card visibility, and copy-button containment | Commit RED slice, prove intended failure, and preserve existing suite           |
| 2026-11-18T08:13:24Z | R-0093/coordinator | RED `ba58a24` fails for absent agent-card state/containment; all 125 prior Vitest cases pass                                                        | Commit/push evidence and obtain fresh RED approval before GREEN                 |
| 2026-11-18T08:15:38Z | R-0093/coordinator | Pushed RED through `c62a51d`; fixed review range is `c9714a5..c62a51d`                                                                               | Dispatch fresh Trae RED Reviewer round 1; no production edit before verdict    |
