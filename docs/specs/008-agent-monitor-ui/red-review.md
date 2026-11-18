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

## Preview round 2 correction review

- Round: 1
- Base: `881d320`
- Pushed RED head: `96b4b14`
- Recorded executable test revision: `8053e11`
- Commit comment:
  <https://github.com/donkey-king-kong/tallyhold/commit/96b4b14a550a52beffa36b1a83dab406431156e7#commitcomment-210627545>

### Coverage mapping

The cumulative Feature 008 suite maps the acceptance criteria and numbered
plan verification items as follows:

| AC / plan item | Tests and evidence |
| --- | --- |
| 1 | `core.test.ts: last event absolute time uses last accepted record`; `webview.test.ts: header shows source session following age and stale recovery` |
| 2 | `webview.test.ts: toolbar toggles range and last reported active without liveness claim` |
| 3 | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order`; `capture-preview.ts` wide/narrow pane checks |
| 4 | Lane assignment, exact display-name, root-title, hashed-slug, and preview guards |
| 5 | Foreground label geometry plus fixed-card and preview containment guards |
| 6 | Resolved-link coverage plus recent-graph rail/tick and preview topology guards |
| 7 | Status/unknown-parent and failed-tool isolation plus status-copy guards |
| 8 | Verified quiet-report threshold and advancing quiet-report cases |
| 9 | Local time, verified bounds, and dated-activity assertions |
| 10 | Plain labels, tool duration, counterpart, and dated-activity assertions |
| 11 | Inspector, dated activity, hashed slug, and copy-button preview guards |
| 12 | Older/unknown range cases and older-runs preview copy guard |
| 13 | Compact footer and narrow document-flow preview guard |
| 14 | Theme, keyboard, reduced-motion, visibility, and overflow guards |
| 15 | Historical/incremental safety and existing suite evidence |

Uncovered or incorrectly specified items:

1. AC5 and the approved plan's no-ellipsis behavior are contradicted by the
   revised root-prefixed card test and preview overflow guard.
2. The narrow preview guard does not permit every valid normal-document-flow
   stack approved by AC3 and the plan.
3. The hashed-slug preview guard does not generically reject invented branch
   text, and the preview status check does not establish that status words are
   visible and nonempty.

### Checklist

1. **Acceptance criteria and plan verification mapping: finding.** The
   cumulative tests name coverage for AC1-AC15 and all 15 numbered verification
   rows. The three incorrectly specified or insufficiently guarded behaviors
   are findings below.
2. **Observable plan decisions: finding.** The fixed-width ellipsis assertion
   conflicts with the prior AC5/plan requirement for complete visible text and
   weakens the existing long-label assertion. The narrow guard requires every
   pane inside the initial viewport, rejecting compliant below-fold document
   flow. The branch guard excludes only two literals, while status checks
   accept hidden or empty elements.
3. **RED failure quality: finding.** The recorded five unit failures and
   production-preview failure are missing behavior rather than setup,
   collection, dependency, navigation, fixture, or network failures. The label
   failure is not trustworthy until the approved contract conflict is
   reconciled.
4. **Assertions and adversarial value: finding.** Connector topology, fixed
   geometry, dated activity, and navigator status use public DOM/browser
   interfaces. The ellipsis assertion conflicts with the prior contract, while
   branch and browser status assertions permit plausible wrong implementations.
5. **Allowed infrastructure: none.** The evidence uses synthetic fixtures,
   local Vitest/JSDOM, the local production preview bundle, and headless
   Playwright without real secrets, private runtime streams, external services,
   or external network.
6. **Existing-suite regression protection: finding.** No production file or
   existing test file was deleted, and 121 unaffected tests pass with the five
   changed cases skipped. The root-prefixed long-label assertion was weakened
   contrary to the prior AC5/plan.

VERDICT: CHANGES_REQUESTED

## Round 2

- Round: 2
- Base: `c9714a5b8cc681363d128048d879afcf28a2430a`
- Pushed cumulative RED head: `a49801ff280f05d4455f6dbd983cd8cdbbf8fbe3`

### Coverage mapping

| AC / plan verification item | Test evidence |
| --- | --- |
| 1 | `core.test.ts: last event absolute time uses last accepted record`; `webview.test.ts: header shows source session following age and stale recovery` |
| 2 | `webview.test.ts: toolbar toggles range and last reported active without liveness claim`; preview range-control assertion |
| 3 | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order`; `capture-preview.ts:63-108` pane order, width, height, and viewport assertions |
| 4 | Lane assignment, exact display-name, and root-title tests from round 1; `capture-preview.ts:132-193` lane/population assertions |
| 5 | `webview.test.ts: foreground labels fit inside boxes without overlap at fit and zoom`; `capture-preview.ts:111-143` local overflow assertions |
| 6 | Resolved-link and active-only/culling tests from round 1; preview connector bus and lane-rail assertions |
| 7 | Status/unknown-parent and failed-tool isolation tests from round 1 |
| 8 | Verified threshold and advancing quiet-report tests from round 1 |
| 9 | Absolute-bound, local-time, reactivated-run, and future/invalid-age tests recorded in `red-test-run.md` |
| 10 | Unique tool-duration, counterpart, plain-label, and source-order tests recorded in `red-test-run.md` |
| 11 | Inspector/copy and clipboard-denial tests from round 1; preview selected-card and Copy full ID assertions |
| 12 | Older/unknown/cutoff run tests and older-run navigation tests recorded in `red-test-run.md` |
| 13 | Footer disclosure and update-persistence tests recorded in `red-test-run.md` |
| 14 | Theme, keyboard, reduced-motion, disclosure, and paging tests from round 1; preview runs with reduced motion |
| 15 | Protocol bounds, source isolation, camera/culling, executable-content, and existing-suite evidence recorded in `red-test-run.md` |

Every acceptance criterion and numbered plan verification item has a named
test. The remaining gap is in the approved mock's observable visible
population: the new production-preview assertions count DOM elements without
proving that most of them are rendered visibly.

### Round 1 findings addressed

1. **Coverage and observable layout decisions: partly addressed.** The
   correction adds wide pane order, 240-300px navigator width, 330-390px
   inspector width, a >=700px canvas, narrow stack order and usable minimum
   heights. It also checks aligned lane-header widths, orchestrator centering,
   segmented range/grouped zoom controls, structural-root exclusion, and
   expected population counts. The visibility defect below leaves the
   lane/card density decision incompletely covered.
2. **Reviewed-head evidence: addressed.** `red-test-run.md` records
   `npm run test:preview-layout` failing at executable revision `2d98f54` with
   `preview-wide.png: inspector width is outside the target band`, a missing
   production-layout behavior. It records all 125 existing Vitest tests
   passing at that revision. `a49801f` is its direct evidence-only child, and
   the package, preview fixture, preview script, tests, source, and media have
   no diff between those revisions.
3. **Assertion discrimination: partly addressed.** Bounds, ordering,
   population counts, and element-local overflow rules reject the previously
   identified tiny, reordered, one-element, and descendant-ellipsis
   implementations. The remaining hidden-element implementation below still
   passes.
4. **Infrastructure: addressed.** The cumulative diff uses a synthetic local
   projection, local bundled assets, `file:` navigation, and headless
   Playwright. It contains no secret, external service, real runtime log, or
   external network dependency.
5. **Regression evidence: addressed.** No existing test or production file is
   changed in the cumulative diff. The exact executable revision has the
   recorded 125-test passing Vitest run, and the reviewed head is executable-
   equivalent to it.

### Finding

**The preview population assertions still accept hidden cards and navigator
rows (AC3-6, AC11, plan visual-target amendment).**
`capture-preview.ts:111-139` derives `cardCount` from all matching DOM nodes,
not visible nodes. `capture-preview.ts:145-170` likewise uses
`querySelectorAll(...).length` for navigator rows/groups, the connector bus,
and lane rails. Only the selected card is explicitly checked with
`isVisible()` at lines 214-220. A plausible wrong implementation can render
the selected card and lane headers, keep seven additional card nodes and six
navigator-row nodes hidden, and retain hidden bus/rail nodes; it still meets
the exact counts and overflow predicate while failing the approved mock's
visible population, density, and relationships. Require visibility and
nonzero rendered bounds for every counted card, navigator row/group,
connector bus, and lane rail.

### Checklist

1. **Coverage mapping: finding.** AC1-15 and plan rows 1-15 map above. The
   visual-target population is not trustworthy because counted elements need
   not be visible.
2. **Observable plan decisions: finding.** Limits, ordering, error paths,
   interval uncertainty, security rejection, layout bands, controls, and
   overflow have concrete assertions. Visible lane/card/navigation density
   and visible connector structure retain the finding above.
3. **Trustworthy RED: none.** The recorded preview failure at `2d98f54` is
   absent production layout, not collection, dependency, fixture, or network
   failure. `a49801f` changes only evidence/tracking after that executable
   revision.
4. **Assertion quality: finding.** Tests use approved public stream/DOM
   interfaces and include the recorded negative/adversarial cases. The hidden
   population implementation above remains a plausible wrong implementation
   that the preview test accepts.
5. **Infrastructure: none.** Fixtures and keys/fakes are local and synthetic;
   no real secret, PostgreSQL, paid resource, or external network is used.
6. **Regression protection: none.** The cumulative diff does not weaken or
   delete existing tests or change production source. The recorded exact-
   executable run passes all 125 existing Vitest tests, and `a49801f` has no
   executable delta from that revision.

VERDICT: CHANGES_REQUESTED
