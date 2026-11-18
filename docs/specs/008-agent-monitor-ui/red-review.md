# Feature 008 RED review

- Reviewer type: fresh independent RED Reviewer, round 1.
- Base: `f90265e`; pushed RED head: `1105aac`.
- Evidence: approved `spec.md`, `plan.md`, `tasks.md`, cumulative base..head test diff, `red-test-run.md`, relevant existing 004 tests, and local read-only Vitest checks.

## Acceptance and verification map

Each numbered plan verification row maps to the same-numbered acceptance criterion. Paths below are under `extensions/agent-monitor/test/`; `P` = `presentation.test.ts`, `W` = `webview.test.ts`, `C` = `core.test.ts`. These are named test matches, not a claim that every assertion in an initially failing test executed.

| AC / plan row | New named test(s) |
| --- | --- |
| 1 | C `last event absolute time uses last accepted record`; W `header shows source session following age and stale recovery` |
| 2 | W `toolbar toggles range and last reported active without liveness claim` |
| 3 | W `wide view places three panes beside visible graph and narrow view stacks in order` |
| 4 | P `lane assignment preserves slots across late root and append`; P `display name strips only assigned lane prefix and preserves unmatched and ungrouped ids`; W `root task titles slug subtitles and agent counts span lanes` |
| 5 | W `foreground labels fit inside boxes without overlap at fit and zoom` |
| 6 | W `all resolved links draw one connector including cross lane and late parent` |
| 7 | W `statuses and unknown parent show distinct symbols without fading completed`; W `failed tool never changes completed agent status` |
| 8 | P `no report threshold requires verified age`; W `quiet report tag advances without dimming` |
| 9 | P `local time ages durations and relative fallback respect verified bounds`; C `incomplete interval exposes no invented absolute end` |
| 10 | P `event labels avoid raw repetition and preserve ambiguous tools`; C `tool duration exists only for unique nonnegative pair`; C `dispatch and return project only reported counterpart identities` |
| 11 | W `inspector shows worktree task unavailable role status times parent and copyable full id`; C `incomplete interval exposes no invented absolute end` |
| 12 | P `last 24 hours groups older and unknown intervals without dropping history`; W `older run expansion search and reveal retain selection` |
| 13 | W `footer keeps graph visible and expands provisional snapshots and diagnostics` |
| 14 | W `light dark high contrast meet text and connector contrast`; W `keyboard and reduced motion reach controls and inspector` |
| 15 | W `historical and incremental fixtures preserve camera and no executable telemetry`; existing C, W, `host.test.ts`, `packaging.test.ts`, and adapter suite |

All 15 rows have a named test. Uncovered observable parts of those rows and cross-cutting plan decisions are listed below; naming a row is not sufficient coverage.

## Findings

1. **Protocol boundary has no RED test for new optional fields (AC15; plan Boundaries and data / Files and layers).** `packaging.test.ts` only checks generic malformed host messages, stale generations, and forged commands. The new `core.test.ts:521-644` checks values in a projection but no test sends malformed, oversized, executable/URI-bearing, or invalidly typed new fields through `validateHostMessage`, or checks the existing message-size bound. A plausible implementation could add fields to the webview without validating them at the shared boundary. Add synthetic rejection and valid-field cases without expanding capabilities or limits.
2. **Runs and stable lane allocation are under-specified (AC4, AC9, AC11-12; plan Lanes / Range).** `presentation.test.ts:32-65` compares only an orphan's `x`, not both coordinates, its lane slot, source-generation reset, filter/tick stability, or a reactivation slot. `presentation.test.ts:228-285` and `webview.test.ts:989-1034` use one interval per identity; they cannot reject collapsing two intervals into one run, using wall-clock time for an open run, or selecting an older identity without the older interval. `presentation.test.ts:119-162` never tests `Running for` through the latest *reported* event, ambiguous bounds, or future/invalid age. Add cases with two intervals on the same identity, source-order/out-of-order records, cutoff intersection, interval-specific selection, and stable slots across updates.
3. **Graph and layout assertions allow visibly wrong implementations (AC3-6; plan Webview structure / Lanes).** `webview.test.ts:701-723` checks DOM order and unscoped CSS regexes, not a bounded graph viewport or actual wide/narrow pane behavior. `webview.test.ts:726-766` places all 25 added agents in `wt-a1`, so it never checks that a multi-lane population avoids a single tall column, source-order grouping, or the anchor above the lanes. `webview.test.ts:846-888` checks edge count and identifiers, but not parent-bottom/child-top coordinates, edge layering, offscreen culling, or preservation when filtering endpoints; `stroke !== "none"` also accepts an empty stroke. The `cycle` node has no cyclic/self edge input. `webview.test.ts:769-844` uses fixed seven-pixel text estimates without a metric stub and checks Fit all only after zoom then Fit. Add discriminating geometry, ordering, filter/cull and invalid-edge checks; reserve actual editor layout for the planned VSIX smoke.
4. **Theme/accessibility test does not prove the approved contrast and keyboard contract (AC14).** `webview.test.ts:1062-1118` substitutes every non-background editor token with the same foreground and compares only SVG text and a line against a palette background, not each actual adjacent box/footer/pill surface or icon/focus boundary. This can pass when status marks, focus, tags, or footer are unreadable. `webview.test.ts:1120-1151` focuses controls and dispatches Enter but does not assert range/zoom changes or visible focus; it omits keyboard-only filter, older-run disclosure, footer, copy, pan, and paging. Add resolved distinct editor tokens, real adjacent-surface contrast assertions, and effect/focus assertions for the named interactions.
5. **Several negative and state-persistence decisions lack checks (AC1-2, AC7, AC10-13, AC15).** `webview.test.ts:647-672` checks stale but not missing verified header time, incomplete state, or stale recovery; `webview.test.ts:673-699` does not exercise the active-only control with a terminal status whose spelling is not `completed`. `presentation.test.ts:164-226` never verifies source-order chronology or unavailable counterpart/category; `webview.test.ts:963-987` checks successful clipboard only, not failure feedback/selectable full-ID fallback. `webview.test.ts:1036-1060` never updates the view to check footer disclosure persistence or that companions cannot replace a confirmed agent state. Existing `webview.test.ts` and `core.test.ts` cover some 004 invariants but not these new presentation states. Add focused negative and update cases.

## Checklist

1. **Coverage map:** All AC1-15 and plan verification rows 1-15 have the named tests above; uncovered parts are explicit in findings 1-5. The plan's optional-field validation, 960px bounded layout, per-reactivation slots, report-bounded open duration, culling/edge endpoints, contrast surfaces, and clipboard failure are not adequately tested.
2. **Observable decisions:** Last source-order accepted time (`core.test.ts:522-543`), explicit role and interval bounds (`core.test.ts:545-565`), unique/ambiguous/reversed tool pairs (`core.test.ts:567-616`), exact assigned-lane prefix (`presentation.test.ts:68-100`), threshold (`presentation.test.ts:102-117`), hostile text/source generation (`webview.test.ts:1153-1194`), and selected-stream regression tests have concrete cases. Missing limits/security rejection, ordering, interval/concurrency and error-path checks are in findings 1-5. No spec/plan change is requested; any decision to change the approved design must be escalated.
3. **RED validity:** Local `vitest run test/core.test.ts test/presentation.test.ts test/webview.test.ts -t 'Feature 008' --reporter=dot` yielded 25 failed, 40 skipped, with zero collection/setup/network errors. First failures are absent fields, content, controls, or styling, as recorded in `red-test-run.md`; later assertions are unverified until GREEN.
4. **Behavioral assertions:** Public `createStream().ingest().snapshot()` and mounted DOM are used. The tests reject many obvious wrong implementations, but findings 1-5 identify plausible wrong implementations they would accept. `webview.test.ts:890-918` checks distinct symbols but only forbids literal `opacity="0.5"`, not another fade mechanism; contrast/focus require stronger checks.
5. **Infrastructure:** New fixtures use in-memory JSONL and synthetic webview state (`core.test.ts:521-644`, `ui-fixtures.ts`, `presentation.test.ts`, `webview.test.ts`). No real secrets or external network; existing `host.test.ts` uses disposable local temporary files. No PostgreSQL is needed for this extension.
6. **Existing suite:** Cumulative test diff adds `presentation.test.ts`, `ui-fixtures.ts` and appends to C/W; no existing test deletion or weakening. Local `vitest run -t '^(?!.*Feature 008)' --reporter=dot` passed 77 existing, skipped 25 new. `red-test-run.md` reports six existing local adapter tests passed; those were not rerun here. Existing W tests still pin raw event names, UTC text, and literal camera bounds (`webview.test.ts` at base), which may conflict with the approved 008 display/camera design. Preserve their behavioral regression intent when reconciling GREEN; escalate any actual plan conflict instead of silently weakening them.

VERDICT: CHANGES_REQUESTED

## Round 2

- Reviewer type: fresh independent RED Reviewer, round 2 (last round).
- Base: `f90265e`; pushed RED head: `2e6938aaa27c0f964d85e28ec43b7dfaee903cdd`.
- Inputs: approved `spec.md`, `plan.md`, `tasks.md`, prior review above, cumulative base..head test diff, `red-test-run.md`, and relevant existing tests. No coordinator or implementation history was used.

### Acceptance and plan verification map

Each numbered plan verification row maps to the matching AC. Paths below are under `extensions/agent-monitor/test/`; C = `core.test.ts`, P = `presentation.test.ts`, W = `webview.test.ts`, K = `packaging.test.ts`. Named tests remain RED; assertions after the first failure have not yet run.

| AC / plan row | Named tests |
| --- | --- |
| 1 | C `last event absolute time uses last accepted record`; W `header shows source session following age and stale recovery` |
| 2 | W `toolbar toggles range and last reported active without liveness claim` |
| 3 | W `wide view places three panes beside visible graph and narrow view stacks in order` |
| 4 | P `lane assignment preserves slots across late root and append`, `existing lane slots survive filters and ticks while a new source recomputes order`, `display name strips only assigned lane prefix and preserves unmatched and ungrouped ids`; W `root task titles slug subtitles and agent counts span lanes` |
| 5 | W `foreground labels fit inside boxes without overlap at fit and zoom` |
| 6 | W `all resolved links draw one connector including cross lane and late parent`, `active-only hides incident connectors and offscreen culling keeps distant nodes reachable` |
| 7 | W `statuses and unknown parent show distinct symbols without fading completed`, `failed tool never changes completed agent status` |
| 8 | P `no report threshold requires verified age`; W `quiet report tag advances without dimming` |
| 9 | C `incomplete interval exposes no invented absolute end`; P `local time ages durations and relative fallback respect verified bounds`, `reactivated identity keeps two selectable runs and report-bounded open duration`, `future or invalid last reports never become negative ages or fabricated wall dates` |
| 10 | C `tool duration exists only for unique nonnegative pair`, `dispatch and return project only reported counterpart identities`; P `event labels avoid raw repetition and preserve ambiguous tools`, `plain activity copy preserves source order and labels unavailable facts` |
| 11 | W `inspector shows worktree task unavailable role status times parent and copyable full id`, `clipboard denial reports failure and leaves the full id selectable`; P `reactivated identity keeps two selectable runs and report-bounded open duration` |
| 12 | P `last 24 hours groups older and unknown intervals without dropping history`, `cutoff includes intersecting runs and preserves unknown chronology separately`; W `older run expansion search and reveal retain selection` |
| 13 | W `footer keeps graph visible and expands provisional snapshots and diagnostics`, `keyboard expands older runs and footer and pages activity across updates` |
| 14 | W `light dark high contrast meet text and connector contrast`, `keyboard and reduced motion reach controls and inspector`, `keyboard expands older runs and footer and pages activity across updates` |
| 15 | K `accepts only bounded and explicitly typed reported facts`; W `historical and incremental fixtures preserve camera and no executable telemetry`, `active-only hides incident connectors and offscreen culling keeps distant nodes reachable`; existing C/W/host/K and adapter tests |

All numbered AC and verification rows have named cases. The reliable activity-page persistence assertion in rows 11/14 is still uncovered because the new case assumes an unspecified page size (finding below). Actual packaged-editor geometry and theme smoke remain planned verification, not a JSDOM claim.

### Round-1 findings revisited

1. **Protocol boundary:** Addressed by K `accepts only bounded and explicitly typed reported facts` (`packaging.test.ts:144-302`): valid/null fields, invalid timestamps and types, URI/HTML-like values, negative duration, oversized role and >2,000 nodes. Existing K covers forged/stale host messages and oversized webview commands.
2. **Runs and slots:** Addressed by P `existing lane slots survive filters and ticks while a new source recomputes order` (`presentation.test.ts:70-113`), `reactivated identity keeps two selectable runs and report-bounded open duration` (`presentation.test.ts:335-418`), cutoff intersection (`presentation.test.ts:420-458`), and future age (`presentation.test.ts:460-490`). They check both orphan coordinates, source-order allocation, interval selection and report-bounded duration.
3. **Graph/layout:** Addressed by W layout rule/DOM-order checks (`webview.test.ts:730-776`), split 25-agent lane fixture (`:778-849`), metric-stubbed box bounds and Fit all (`:851-947`), attributed ports/layers/invalid edges (`:949-1036`), and culling/navigation/filtering (`:1038-1074`). The plan explicitly reserves real layout smoke for the packaged editor.
4. **Theme/access:** Addressed substantially by W three distinct resolved-token palettes and adjacent node/pill/footer contrast plus focus rule (`webview.test.ts:1302-1426`), and keyboard effect tests for range, filter, search, selection, zoom, pan, older runs, footer and activity (`:1428-1552`). The paging part has the defect below.
5. **Negative states/persistence:** Addressed by W stale/incomplete/recovery (`:653-694`), failed terminal active-only (`:696-728`), clipboard denial (`:1182-1204`), footer update/advisory status (`:1253-1300`), and P source-order/unavailable activity (`presentation.test.ts:492-542`). The intended paging persistence check is not trustworthy as written.

### Finding

**The new pagination test mandates an unapproved page size (AC11/14, plan Inspector and Verification).** `webview.test.ts:1496-1552` creates 105 reports, activates `next activity page` once, then requires `Report 104` both immediately and after update. A legitimate 50-item page shows reports 50-99 on page two, so GREEN would have to enlarge the page or skip pages to satisfy this test, despite the plan specifying only paged source-order activity. The existing regression `webview.test.ts:563-585` reaches report 204 with a `last activity page` action, not one `next`. Change the RED assertion to check the actual next page's contents and persistence, or advance to the final page before checking report 104. This is a test-specification defect, not missing feature behavior; escalate any proposal to mandate a page size as a plan change.

### Checklist

1. **Coverage:** AC1-15 and plan verification rows 1-15 are mapped above. The activity-page persistence proof for AC11/14 is invalid as described; no other numbered row is wholly uncovered.
2. **Decisions:** Explicit-only role/counterparts and unique tool duration are checked in C (`:545-644`); boundary rejection/limits in K (`:144-302`); ordering, cutoff, slots, uncertainty and source generation in P (`:32-542`) and W (`:778-1074`); security/privacy and source isolation in W (`:1554-1596`) and existing tests. The page-size assumption is not an approved decision.
3. **RED validity:** Local `vitest run -t 'Feature 008' --reporter=json` collected 111, failed 34 new cases, skipped 77; all first failures were absent projected/UI behavior or validation, not collection, dependency, fixture or network errors. Later assertions, including the faulty page assertion, are not exercised in RED.
4. **Behavioral assertions:** The tests use the public stream snapshot and mounted webview DOM, with negative cases for invalid protocol fields, unresolved/self/cyclic edges, unknown chronology, failed copy and advisory heartbeat. Finding above would reject a plausible correct paged implementation.
5. **Infrastructure:** Synthetic in-memory JSONL/UI fixtures and offline theme/clipboard fakes; no real secrets or external network. Existing host tests use disposable local files; this extension needs no PostgreSQL.
6. **Existing suite:** Cumulative base..head diff adds only new test cases/fixtures and formatting to existing K; no existing assertions deleted or weakened. Local `vitest run -t '^(?!.*Feature 008)' --reporter=json` passed 77, skipped 34. `red-test-run.md` records six adapter tests passing (not independently rerun here). `git diff --check` on cumulative test files passed. The original W literal copy/camera assertions still require careful GREEN reconciliation without silent weakening.

VERDICT: CHANGES_REQUESTED
