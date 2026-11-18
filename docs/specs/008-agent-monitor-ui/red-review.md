# Feature 008 RED review

- Round: 1
- Base: `c9714a5b8cc681363d128048d879afcf28a2430a`
- Pushed RED head: `c62a51d5117347b53ca0f5eb95112a7c12a48f49`

## Coverage mapping

| AC / plan verification item | Test evidence |
| --- | --- |
| 1 | `core.test.ts: last event absolute time uses last accepted record`; `webview.test.ts: header shows source session following age and stale recovery` |
| 2 | `webview.test.ts: toolbar toggles range and last reported active without liveness claim` |
| 3 | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order`; `scripts/capture-preview.ts` pane non-intersection checks at 1440x940 and 800x900 |
| 4 | `presentation.test.ts: lane assignment preserves slots across late root and append`; `presentation.test.ts: display name strips only assigned lane prefix and preserves unmatched and ungrouped ids`; `webview.test.ts: root task titles slug subtitles and agent counts span lanes`; preview overflow checks |
| 5 | `webview.test.ts: foreground labels fit inside boxes without overlap at fit and zoom`; preview card overflow checks |
| 6 | `webview.test.ts: all resolved links draw one connector including cross lane and late parent`; `webview.test.ts: active-only hides incident connectors and offscreen culling keeps distant nodes reachable` |
| 7 | `webview.test.ts: statuses and unknown parent show distinct symbols without fading completed`; `webview.test.ts: failed tool never changes completed agent status` |
| 8 | `presentation.test.ts: no report threshold requires verified age`; `webview.test.ts: quiet report tag advances without dimming` |
| 9 | `core.test.ts: incomplete interval exposes no invented absolute end`; `presentation.test.ts: local time ages durations and relative fallback respect verified bounds`; future-age and reactivated-run cases listed in `red-test-run.md` |
| 10 | Unique tool-duration and counterpart projection cases in `core.test.ts`; plain-label and source-order cases in `presentation.test.ts` listed in `red-test-run.md` |
| 11 | `webview.test.ts: inspector shows worktree task unavailable role status times parent and copyable full id`; clipboard-denial case; preview selected-card and Copy full ID containment checks |
| 12 | Range/older/unknown-run cases in `presentation.test.ts` and `webview.test.ts` listed in `red-test-run.md` |
| 13 | Footer disclosure and keyboard persistence cases in `webview.test.ts` listed in `red-test-run.md` |
| 14 | Theme contrast, keyboard/reduced-motion, and disclosure/paging cases in `webview.test.ts`; preview checks run with reduced motion |
| 15 | Protocol bounds in `packaging.test.ts`; historical/incremental safety, camera, culling, source-generation, and clipboard cases listed in `red-test-run.md`; existing Vitest suite result |

The numbered AC/verification rows have named test coverage. The approved
visual-target amendment in `plan.md` is not adequately covered: the Playwright
check does not assert the mock's layout proportions, pane order, usable graph
area, lane/card density, spacing, or visible lane/card population.

## Checklist

1. **Coverage mapping: finding.** All 15 numbered rows map to named tests as
   above, but the approved `mock.png` decision is observable plan behavior and
   remains partly uncovered. `scripts/capture-preview.ts` accepts any three
   non-intersecting pane rectangles, including tiny, reordered, or horizontal
   panes at 800px, and does not compare meaningful geometry with the approved
   target.
2. **Observable plan decisions: finding.** Exact viewport sizes, device scale
   factor, pane non-intersection, selected graph card, overflow, and Copy full
   ID viewport containment are asserted. The mock's required layout, density,
   spacing, controls, and copy style are not. Existing named DOM tests cover
   semantic controls and narrow stacking, but the new production-bundle seam
   does not verify those visual decisions in the real rendered geometry.
3. **Trustworthy RED: finding.** `red-test-run.md` records the expected
   `preview-wide.png: expected lane headers and agent cards` failure at
   `ba58a24`, while the supplied pushed RED head is `c62a51d`. There is no RED
   run at the reviewed head, so collection/setup health and the expected
   missing-behavior failure are unverifiable for the revision under review.
   The recorded failure at `ba58a24` is otherwise a missing production
   rendering seam rather than a collection, dependency, fixture, or network
   failure.
4. **Assertion quality: finding.** The preview executes the production webview
   bundle through local Playwright and checks public DOM geometry. However, a
   plausible wrong implementation can pass by rendering one lane header, one
   visible selected card, hidden additional cards, and arbitrarily small or
   reordered non-overlapping panes. The overflow predicate also accepts an
   overflowing container whenever any descendant has `text-overflow:
   ellipsis`, even if that descendant is unrelated to the overflowing text.
   Add bounds/order/minimum-area and representative visible-population checks,
   and tie ellipsis permission to the element that actually overflows.
5. **Infrastructure: none.** The diff uses synthetic in-page projection data,
   a local `file:` preview, bundled local assets, and headless Playwright. It
   contains no real secrets, runtime logs, external services, or external
   network dependency.
6. **Regression protection: finding.** The cumulative diff does not weaken or
   delete the existing Vitest files, and `red-test-run.md` reports all 125
   existing tests passing at `ba58a24`. That result is not at
   `c62a51d`, so the existing-suite check is unverifiable for the reviewed
   head. The package scripts correctly add the preview check to normal and
   coverage test entry points.

VERDICT: CHANGES_REQUESTED
