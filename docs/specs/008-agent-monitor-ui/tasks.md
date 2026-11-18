# 008: Agent monitor UI tasks

## Approval gate

The [spec](spec.md) is Gate 1 approved. Zack separately approved the
[architecture plan](plan.md) on 2026-11-18 at `f90265e`. Zack resolved the
final RED review escalation and confirmed GREEN at `e734489`.
Track B owns T-0050..T-0059 and R-0050..R-0059. The coordinator allocates
unused IDs and creates tickets only when assigning a role; no future ticket
is pre-claimed here. Each RED/GREEN slice should be a small logical commit.
Do not edit the publisher, reader, product app, or CI/Compose.

- [x] **Zack plan gate:** Approve or request changes to the optional
  projection fields, presentation geometry, 960px breakpoint, time/range
  semantics, theme contrast verification and 004 regression envelope.
  Record the decision in [plan.md](plan.md) and tracking before RED.

## RED: Only after plan approval

The Test writer writes **synthetic** `wt-a1` and `wt-b2` fixtures directly
under `extensions/agent-monitor/test/`; no chore-branch dependency or real
runtime logs. Map the exact named cases in the [verification table](plan.md#verification).
Run existing 004 tests first, then commit and push failing tests with expected
failures caused by absent UI/projection behavior, not broken setup.

- [x] **Presentation RED, AC2, AC4, AC8-AC10, AC12:** Add
  `test/presentation.test.ts` for stable lane slots, range/unknown chronology,
  exact assigned-lane root-ID-prefix stripping with no-match and ungrouped
  fallbacks, honest ages and intervals, local-zone/duration formatting, and
  plain event/status mapping. Commit the focused RED slice.
- [x] **Projection RED, AC1, AC9-AC11, AC15:** Extend
  `test/core.test.ts` for last accepted verified event time, explicit role,
  absolute interval bounds and unique-only tool duration/counterpart facts.
  Assert unchanged reducer status, parent links, positions, history and
  batch/incremental equivalence. Commit the focused RED slice.
- [x] **Graph DOM RED, AC3-AC7, AC14:** Extend
  `test/webview.test.ts` for pane order and stacking, 25-agent multi-lane
  geometry, wrapped labels inside fitted boxes with foreground paint order
  and no overlap, box-inclusive Fit all, all resolved connectors, accessible
  icon+word states, three-theme token contrast and keyboard controls.
  Commit the focused RED slice.
- [x] **Inspector/footer DOM RED, AC1-AC2, AC8-AC15:** Extend
  `test/webview.test.ts` for header reader/age, time-range and older-run
  disclosure, inspector ID copy/fallback and paged activity, provisional
  footer, error recovery, hostile text, camera/focus and reduced motion.
  Commit the focused RED slice.
- [x] **RED evidence and independent review:** Record the tested revision,
  expected failures, unaffected 004 checks and adapter suite in
  `red-test-run.md`; push. Obtain a fresh independent RED `APPROVE` using
  `docs/skills/red-review.md`. A failed launch or non-approval stops GREEN.
  Zack resolved the final-round test-specification defect, confirmed the
  corrected RED at `e734489` and explicitly authorized GREEN on 2026-11-18;
  no third reviewer round.

## GREEN: Only after independent RED approval

The Implementer works through these one-commit behavior slices against the
approved RED cases. Do not weaken tests to force a pass.

- [x] **Projection facts, AC1, AC9-AC11, AC15:** Add the optional explicit
  or verified fields in `src/core/reconcile.ts` and their validation in
  `src/shared/protocol.ts`. Preserve 004 reader/reducer behavior.
- [x] **Pure presentation model, AC2, AC4, AC7-AC12:** Implement
  `src/webview/presentation.ts` for lane/run selection, exact assigned-lane
  display-name shortening by assigned root ID, age/duration/local time, state icons and event
  copy with uncertainty fallbacks.
- [x] **Lane graph, AC4-AC6, AC14-AC15:** Implement
  `src/webview/graph.ts` with stable slots, wrapped foreground text inside
  fitted boxes, one edge per resolved pair, culling and box-inclusive Fit all.
- [x] **Workspace shell, AC1-AC3, AC8, AC13-AC14:** Refactor
  `src/webview/main.ts` and `media/styles.css` for header/toolbar,
  three panes at >=960px, narrow stack, clock and collapsed footer.
- [x] **Navigation and inspection, AC2, AC7, AC9-AC12, AC14-AC15:**
  Complete range/older-run navigation, inspector/copy, activity paging,
  focus persistence and keyboard/reduced-motion behavior.
- [ ] **Full verification, AC1-AC15:** Run extension lint, format check,
  typecheck, build, tests and >=80% coverage; publisher adapter tests,
  VSIX audit, synthetic 25-agent and representative 004 performance
  checks. Smoke packaged VSIX in recorded editor/theme/width combinations;
  report unverified combinations honestly.

## Delivery gate

- [ ] **Coordinator:** After approved RED and GREEN verification, wait for
  Zack's explicit PR/ship request; use the full gated
  [ship](../../skills/ship.md) procedure then. Do not open a PR during this
  planning handoff.
