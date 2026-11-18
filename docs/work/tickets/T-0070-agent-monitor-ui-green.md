# T-0070: Implement Feature 008 Agent Monitor UI

## Assignment

- Status: in_progress
- Owner actor: R-0071/coordinator
- Role: Implementer / coordinator
- Run: [R-0071](../runs/R-0071.md), after [R-0070](../runs/R-0070.md)
- Feature: [approved spec](../../specs/008-agent-monitor-ui/spec.md), [approved plan](../../specs/008-agent-monitor-ui/plan.md), [tasks](../../specs/008-agent-monitor-ui/tasks.md)
- Authorization: Zack confirmed RED at `e734489` on 2026-11-18 after resolving the round-2 test defect. No further RED review; GREEN authorized. Stop before PR pending hands-on VSIX smoke.
- Dependencies: [T-0057](T-0057-agent-monitor-ui-red.md), [T-0058](T-0058-review-agent-monitor-ui-red.md)
- Branch / worktree: `feature/008-agent-monitor-ui` / `../tallyhold-feature-008-agent-monitor-ui`
- Issue / PR: related #44; no PR requested.
- Updated: 2026-11-18T06:51:50Z

## Scope

Implement approved projection fields, protocol validation, presentation,
lane graph and webview. Preserve every RED assertion, 004 behavior, publisher
and source reader. Run all requested checks, audit compatible dev dependency
fixes, package a VSIX and stop for Zack's theme/width/keyboard smoke.

## Acceptance

- [x] All 34 new RED cases and 77 existing extension tests pass with >=80% coverage.
- [x] Lint, format, typecheck, build, package, six adapter tests and representative plus 25-agent multi-lane benchmark pass.
- [x] Compatible npm audit fixes assessed; no non-breaking fix available and remainder recorded.
- [x] GREEN smoke corrections ready to push; rebuilt VSIX path and checklist prepared for Zack. No PR before Zack reports a new smoke.
- [x] Regressions cover host CSP and applied stylesheet, root-ID name, one identity row/run selector, footer disclosure/local times, and plain navigator/node copy.

## Checkpoint

- Last completed action: final host validation rerun passed. `npm ci`, lint, format, typecheck, `npm run test:coverage`, build, package, six adapter tests and benchmarks all pass after the multi-token `cspSource` fix. Extension coverage is 96.60% statements, 97.20% functions and 98.04% lines.
- Evidence: GREEN projection `57757f8`, webview `c148fc9`, benchmark `30b6ec6`; packaged `extensions/agent-monitor/tallyhold-agent-monitor-0.1.0.vsix`. Synthetic 25-agent/three-lane fixture rendered 29 identities, 3 lanes and 28 connectors in 6.37 ms; representative cold reducer 109.84 ms, maximum 985.21 ms, 2,000-identity webview 131.43 ms.
- Worktree state: local GREEN head `043d559`; final packaging test wording tweak and tracking are uncommitted. Prior RED assertions remain preserved except the explicitly superseded display-name fixture, retaining its match/unmatch/ungrouped checks.
- Remaining work: commit the final packaging-test adjustment and verification checkpoint, push the branch, and stop again for Zack's smoke.
- VSIX: rebuilt `extensions/agent-monitor/tallyhold-agent-monitor-0.1.0.vsix`, SHA-256 `aa3c6d9b8a777b41f9b05353f415015e2c2aa34b7cd98af7ca144d6b7b00f032`; packaged CSS and JS again match the final build byte for byte. Packaging still warns that no extension LICENSE file is present.
- Audit: `npm audit` reports 17 high dev-only findings. `npm audit fix --dry-run` offered zero compatible package changes; its direct dependency remedies require out-of-range versions (`vitest`/coverage 4 to 3, `typescript-eslint` 8.73 to 8.47.0, `vsce` 3 to 4). Registry latest `picomatch` is vulnerable 4.0.7. No force or incompatible change applied. Packaging warns that this extension has no LICENSE file.
- Blocker / unblock action: repeat editor smoke fails before open because host CSP validation rejects the real editor-provided `cspSource`; fix host validation and error detail test-first, then rebuild and hand back to Zack. No PR.
- Next action: commit/push this final verification checkpoint, then Zack installs the rebuilt VSIX and retries the open plus the same smoke checklist. No PR until Zack reports a passing smoke.
- Handoff recipient: Zack after another rebuilt packaged VSIX.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T05:59:27Z | R-0070/coordinator | Claimed GREEN after Zack's explicit RED confirmation, on fetched clean `6e5d973` | Implement plan in slices; no reviewer or PR dispatched |
| 2026-11-18T06:01:35Z | R-0070/coordinator | Locked `npm ci` passed with 17 high audit advisories; projection and protocol implementation passes 32 core/packaging tests, lint, typecheck, format | Commit first slice and implement presentation model; assess nonbreaking audit later |
| 2026-11-18T06:09:06Z | R-0070/coordinator | Projection commit `57757f8`; finished presentation, lanes, mounted UI, styles and 25-agent benchmark without RED test edits. 111 tests pass with >96% statements/functions and >98% lines; lint, format, typecheck, build, package and six adapter tests pass | Audit dry run found no compatible fix for 17 high dev-only advisories; final install/check, commit/push, stop for packaged smoke |
| 2026-11-18T06:11:30Z | R-0070/coordinator | Final `npm ci`, 111 tests/coverage (96.66% statements, 96.91% functions, 97.93% lines), lint, format, typecheck, build, package, six adapter tests and representative/maximum/25-agent benchmark pass | Commit and push final UI revision; VSIX ready for Zack smoke, no PR |
| 2026-11-18T06:12:23Z | R-0070/coordinator | Committed verified UI and tracking at `c148fc9`; benchmark source remains as separate local slice | Commit benchmark/checkpoint, push and stop for Zack smoke |
| 2026-11-18T06:13:01Z | R-0070/coordinator | Benchmark committed `30b6ec6`; pushed branch `feature/008-agent-monitor-ui` through that head | Record final smoke handoff, await Zack's editor result; no PR |
| 2026-11-18T06:18:43Z | R-0071/coordinator | Zack's real-log smoke FAIL: stylesheet not applied, wrong name prefix, per-run navigator rows, visible/duplicated footer with UTC times, jargon/full ID in navigator. Fetched clean `b09fc7a`; plan amendment explicitly approved | Write a regression test for each symptom before GREEN fixes; no PR |
| 2026-11-18T06:22:20Z | R-0071/coordinator | RED tests `e295f4e`: host CSP used CSS file URL and malformed CSS left button min-height empty. Explicit webview CSP source and corrected CSS now pass both targeted tests | Commit item 1 and write real-ID prefix regression |
| 2026-11-18T06:25:12Z | R-0071/coordinator | CSP/CSS fix `e9722f8`. Real root-ID RED `d2fd33a` exposed prefixed descendants misclassified as lane roots; exact-prefix and top-level-root changes pass 52 UI tests, lint/types/format | Commit item 2, then navigator regression |
| 2026-11-18T06:27:35Z | R-0071/coordinator | Root-ID fix `28b2e9c`; navigator RED `85cccbd` showed 13 buttons for one orchestrator. Grouped identities and inspector run selector now pass 53 UI tests, lint/types/format | Commit item 3; reproduce footer smoke |
| 2026-11-18T06:30:19Z | R-0071/coordinator | Navigator fix `a437778`; footer RED `79b153e` proved duplicate disclosure and raw ISO. Single summary/hidden body and SGT visible time now pass 54 UI tests, lint/types/format; legacy 004 timestamp remains in compatibility region | Commit item 4, then plain navigator/node copy regression |
| 2026-11-18T06:35:56Z | R-0071/coordinator | Footer fix `55dac64`; item-5 RED `ed3bafa` exposed missing icon, jargon and repeated ID. Initial navigator SVG broke six frozen graph-selector tests; corrected new test `e451837`/`c38b1e1` requires a CSS-rendered status mark. All 55 presentation/webview tests, lint, format, typecheck pass; UI detector returns `[]` | Commit item-5 CSS/DOM and run final full checks before packaging |
| 2026-11-18T06:38:06Z | R-0071/coordinator | Item-5 GREEN `594917f`; final `npm ci`, lint, format, typecheck, 117 tests/coverage (96.81% statements, 97.17% functions, 98.02% lines), build, package, six adapter tests and representative/maximum/25-agent three-lane benchmark pass. VSIX CSS/JS hashes match final source build | Commit/push results, then stop for Zack's repeat VSIX smoke; no PR |
| 2026-11-18T06:46:13Z | R-0071/coordinator | Zack's repeat real-editor smoke FAIL at open on pushed `bc02cb1`: Trae reports `Command 'Tallyhold Agent Monitor: Open' resulted in an error: Unsafe webview resource`. Root cause is likely `safeCspSource()` only accepting a single host token while real `panel.webview.cspSource` can be a space-separated list such as `'self' https://*.vscode-cdn.net` | Record the failure, add focused host RED cases, fix validation and rebuild the VSIX; still no PR |
| 2026-11-18T06:47:23Z | R-0071/coordinator | Added focused host RED cases in `packaging.test.ts` for accepted/rejected `cspSource` lists, failing-input error detail and documented `https://file+.vscode-resource.vscode-cdn.net/...` / `https://vscode-remote+...vscode-resource.vscode-cdn.net/...` resource shapes. `npx vitest run test/packaging.test.ts --reporter=dot` fails 4 intended tests because the current host rejects valid list/resource forms and still throws the generic error | Commit RED tests, then implement the host fix without weakening existing assertions |
| 2026-11-18T06:48:59Z | R-0071/coordinator | Host fix in `src/host/monitorPanel.ts`: `safeCspSource()` now validates space-separated source-expression lists, rejects empty and injected tokens, preserves valid order verbatim, and `renderPanelHtml()` names the failing field while echoing rejected `cspSource` values. `npx vitest run test/packaging.test.ts --reporter=dot` passes 13/13 | Commit the host fix, then rerun the full matrix and rebuild the VSIX; no PR |
| 2026-11-18T06:51:50Z | R-0071/coordinator | Final rerun after the host fix: `npm ci`, lint, format, typecheck, 120 tests/coverage (96.60% statements, 97.20% functions, 98.04% lines), build, package, six adapter tests and representative/maximum/25-agent three-lane benchmark pass. Rebuilt VSIX SHA-256 `aa3c6d9b8a777b41f9b05353f415015e2c2aa34b7cd98af7ca144d6b7b00f032`; packaged CSS/JS hashes match source build | Commit/push results, then stop again for Zack's repeat smoke; no PR |
