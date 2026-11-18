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
- Updated: 2026-11-18T08:11:59Z

## Scope

Make the production-bundle preview a fair 2x comparison with the approved mock,
add Playwright layout guards at 1440x940 and 800x900, replace the synthetic
fixture with the approved worktree scenario, and correct the webview shell,
graph, navigator, inspector, controls, footer, and narrow layout. Preserve the
approved data-honesty, AC8, timeline, and display-name rules. Do not reinstall
the VSIX or open a PR.

## Acceptance

- [ ] New Playwright guards fail at `c9714a5` for pane overlap/containment, overflow, selected-card visibility, and copy-button viewport containment.
- [ ] Wide and narrow production-bundle previews visibly satisfy Zack's nine numbered correction areas with no invented branch/track data.
- [ ] Existing lint, format, typecheck, build, package, tests, coverage, adapter tests, and benchmarks pass with the new layout checks.
- [ ] Corrected previews and implementation are committed and pushed; handoff lists each fix as done or explains a deviation.

## Checkpoint

- Last completed action: compared the approved mock and both rejected previews, then authored the fair 2x fixture/capture setup and Playwright layout guards without changing production rendering.
- Evidence: target is 2880x1880 pixels for a 1440x940 2x capture; rejected wide capture is 1440x900 at 1x and rejected narrow capture does not include the inspector.
- Worktree state: RED fixture, guards, and tracking are uncommitted over `c9714a5`.
- Remaining work: commit and run RED guards, confirm existing tests, obtain fresh RED review, implement corrections, regenerate previews, and verify.
- Blocker / unblock action: none.
- Next action: commit the RED slice, run its intended browser failure, and run existing Vitest cases separately.
- Handoff recipient: Zack after pushed corrected previews; no reinstall and no PR.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T08:09:13Z | R-0093/coordinator | Created after Zack rejected preview round 1; claimed RED-first correction | Inspect visual evidence, then write Playwright guards before production changes |
| 2026-11-18T08:11:59Z | R-0093/coordinator | Added target-size/density fixture and production-bundle guards for pane separation, overflow, selected-card visibility, and copy-button containment | Commit RED slice, prove intended failure, and preserve existing suite |
