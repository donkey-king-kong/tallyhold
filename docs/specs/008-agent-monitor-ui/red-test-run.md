# 008 Agent Monitor UI RED test run

- Test revision: `e7344890e625b167bc01f6b3f4ab0e2eee70c339` (`test: remove page-size assumption from activity paging test`), following `885fbe4` and initial RED `1522e5f`.
- Previous plan revision: `f90265e`; approval was recorded in `f8bc088`. This is a synthetic-only RED handoff; no production source, 004 test, publisher, or adapter file changed.
- Platform: local macOS, Node/Vitest from locked `npm ci`. No real JSONL, credentials, external service, or shared-stream chore fixture.
- Public seams: `createStream(...).ingest(...).snapshot()` checks projection facts (not how records are stored); `mountMonitor(root, state).update(...)` checks visible DOM, controls, accessible content, graph geometry and local rendering (not private collaborators). CSS token checks use resolved synthetic themes and the shipped stylesheet.

## Commands and outcomes at test revision

Run from `extensions/agent-monitor/` unless noted.

| Command                                                                          |                                        Exit | Collected / failed / passed / skipped | Interpretation                                                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------: | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `./node_modules/.bin/vitest run -t 'Feature 008' --reporter=json`                | 1 (expected; summary filtered through `jq`) | 111 / 34 / 0 / 77                     | All new cases fail on absent optional validation, projected fields, presentation or controls; no setup, import, fixture, collection or network errors. |
| `./node_modules/.bin/vitest run -t '^(?!.*Feature 008)' --reporter=json`         |                                           0 | 111 / 0 / 77 / 34                     | Existing 004 extension tests in core, host, packaging and webview pass; only 34 new cases are skipped.                                                 |
| `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` (repo root) |                                           0 | 6 / 0 / 6 / 0                         | Existing local publisher adapter tests pass.                                                                                                           |
| `npm run lint`                                                                   |                                           0 | n/a                                   | ESLint passes.                                                                                                                                         |
| `npm run typecheck && ./node_modules/.bin/prettier --check test/webview.test.ts` |                                           0 | n/a                                   | TypeScript and changed test formatting pass.                                                                                                           |
| `git diff --check`                                                               |                                           0 | n/a                                   | No whitespace errors in the focused test diff.                                                                                                         |

The RED cases use `wt-a1`, `wt-b2` and `wt-alpha` roots produced by
synthetic projection objects or in-memory JSONL records. Out-of-order and
cross-session records, duplicate-valued events, an incomplete interval, an
ambiguous pair and a delayed parent are generated locally. No dependence on
the worktree stream publisher or private log files.

## Acceptance and verification mapping

Every row below maps the numbered item in [plan.md](plan.md#verification) and
the matching [spec.md](spec.md#acceptance-criteria) AC to the exact named test.
The final column records the **first failing assertion** at `1522e5f`, not a
claim that later assertions ran. The original 25 tests still fail on the
same missing behavior. Each failure is missing projected facts,
rendered content, visible styling, or a planned control.

| AC / plan item | New test name (`test/`)                                                                                         | First missing behavior                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1              | `core.test.ts: last event absolute time uses last accepted record`                                              | Projection has no `lastEventAbsoluteTime`.                                                                      |
| 1              | `webview.test.ts: header shows source session following age and stale recovery`                                 | Header lacks "Following · last event 12s ago".                                                                  |
| 2              | `webview.test.ts: toolbar toggles range and last reported active without liveness claim`                        | No named monitor toolbar or range control.                                                                      |
| 3              | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order`            | No three-pane monitor workspace.                                                                                |
| 4              | `presentation.test.ts: lane assignment preserves slots across late root and append`                             | Root's task/lane header is absent.                                                                              |
| 4              | `presentation.test.ts: display name strips only assigned lane prefix and preserves unmatched and ungrouped ids` | Navigator still displays matching `alpha-reviewer` without shortening.                                          |
| 4              | `webview.test.ts: root task titles slug subtitles and agent counts span lanes`                                  | Graph lacks root task title "Review accounts".                                                                  |
| 5              | `webview.test.ts: foreground labels fit inside boxes without overlap at fit and zoom`                           | Node text has no wrapped lines inside fitted boxes.                                                             |
| 6              | `webview.test.ts: all resolved links draw one connector including cross lane and late parent`                   | Lines lack attributed parent/child endpoints (and visible stroke is unverified).                                |
| 7              | `webview.test.ts: statuses and unknown parent show distinct symbols without fading completed`                   | Distinct status icons are absent.                                                                               |
| 7              | `webview.test.ts: failed tool never changes completed agent status`                                             | Inspector lacks planned Completed presentation; existing 004 does keep tool failure separate.                   |
| 8              | `presentation.test.ts: no report threshold requires verified age`                                               | No "No report <age>" tag after threshold.                                                                       |
| 8              | `webview.test.ts: quiet report tag advances without dimming`                                                    | Quiet node has no advancing tag.                                                                                |
| 9              | `core.test.ts: incomplete interval exposes no invented absolute end`                                            | Intervals lack verified absolute boundary fields.                                                               |
| 9              | `presentation.test.ts: local time ages durations and relative fallback respect verified bounds`                 | Inspector still uses raw interval wording and lacks local-zone duration.                                        |
| 10             | `core.test.ts: tool duration exists only for unique nonnegative pair`                                           | Tool category and duration are not projected.                                                                   |
| 10             | `core.test.ts: dispatch and return project only reported counterpart identities`                                | Activity lacks explicit counterpart ID.                                                                         |
| 10             | `presentation.test.ts: event labels avoid raw repetition and preserve ambiguous tools`                          | Timeline lacks "Started" plain label.                                                                           |
| 11             | `webview.test.ts: inspector shows worktree task unavailable role status times parent and copyable full id`      | No "Worktree: a1" detail.                                                                                       |
| 12             | `presentation.test.ts: last 24 hours groups older and unknown intervals without dropping history`               | No Last 24 hours range control.                                                                                 |
| 12             | `webview.test.ts: older run expansion search and reveal retain selection`                                       | No Last 24 hours range control or older row.                                                                    |
| 13             | `webview.test.ts: footer keeps graph visible and expands provisional snapshots and diagnostics`                 | No compact monitor footer region.                                                                               |
| 14             | `webview.test.ts: light dark high contrast meet text and connector contrast`                                    | Compact footer absent; later checks require >=4.5:1 text and >=3:1 lines/icons/focus against adjacent surfaces. |
| 14             | `webview.test.ts: keyboard and reduced motion reach controls and inspector`                                     | Range controls are absent; keyboard and reduced-motion checks follow.                                           |
| 15             | `webview.test.ts: historical and incremental fixtures preserve camera and no executable telemetry`              | Graph does not display reported lane task on append; camera, safe text and source switch assertions follow.     |

The AC4 name fixture checks `alpha-reviewer` in `wt-alpha` becomes
`reviewer`, a `beta-reviewer` in that lane remains full, and an ungrouped
`alpha-orphan` remains full; inspector and copy retain the full ID. The AC5
DOM case checks node shape before foreground text, wrapped line bounds
inside padded box bounds, pairwise box separation and box-inclusive Fit all
both initially and after zoom. The AC6 fixture includes an anchor, two lane
roots, descendants and a delayed parent, without false cyclic edges.
The AC14 fixture resolves editor tokens for light, dark and high-contrast
surfaces before computing contrast; JSDOM geometry is a deterministic
estimate, with packaged-editor smoke reserved for Zack.

Round-1 `CHANGES_REQUESTED` corrections add nine focused RED cases and
strengthen existing assertions, without changing the approved spec, plan,
004 tests, or production files:

| AC / plan item | Additional named test                                                                                        | First missing behavior at `885fbe4`                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15             | `packaging.test.ts: accepts only bounded and explicitly typed reported facts`                                | `validateHostMessage` accepts an invalid new optional timestamp. Valid optional values, malformed role/interval/activity fields, URI/HTML-like values, negative or incorrectly typed duration, excessive role length and >2,000 nodes are checked. |
| 4, 15          | `presentation.test.ts: existing lane slots survive filters and ticks while a new source recomputes order`    | No named active-only control; later assertions check stable x/y and deterministic source-generation reset.                                                                                                                                         |
| 9, 11, 12      | `presentation.test.ts: reactivated identity keeps two selectable runs and report-bounded open duration`      | No range control; later assertions select both intervals of one ID and bound open duration by its latest reported event.                                                                                                                           |
| 12             | `presentation.test.ts: cutoff includes intersecting runs and preserves unknown chronology separately`        | No range control; later assertions include an interval crossing the cutoff and separate unknown chronology.                                                                                                                                        |
| 9              | `presentation.test.ts: future or invalid last reports never become negative ages or fabricated wall dates`   | No unavailable header age; later assertions reject negative ages and invented dates.                                                                                                                                                               |
| 10, 11         | `presentation.test.ts: plain activity copy preserves source order and labels unavailable facts`              | Raw dispatch label rather than plain text; later assertions check source order and missing counterpart/category/duration.                                                                                                                          |
| 6, 15          | `webview.test.ts: active-only hides incident connectors and offscreen culling keeps distant nodes reachable` | No named active-only control; later assertions bound graph shapes to 500 and navigate to an offscreen node.                                                                                                                                        |
| 11, 15         | `webview.test.ts: clipboard denial reports failure and leaves the full id selectable`                        | No copy control; later assertions require explicit denial feedback and selectable ID.                                                                                                                                                              |
| 13, 14         | `webview.test.ts: keyboard expands older runs and footer and pages activity across updates`                  | No range control; later assertions exercise Enter and persistence of paging/disclosure.                                                                                                                                                            |

Strengthened original cases now also test incomplete/stale/recovered header
states; failed terminal active filtering; both orphan coordinates and source
generation; 25 agents split across two lanes in source order; metric-stubbed
wrapped label bounds, Fit all and zoom; duplicate, self and cyclic edges,
connector ports, layer order and endpoint filtering; non-faded completed
ancestors; distinct token surfaces for light, dark and high contrast; and
keyboard effect/focus for range, search, filter, zoom, pan, selection and copy.

Zack resolved the final round-2 `CHANGES_REQUESTED` at `182f438` on
2026-11-18 as a test-specification defect. At `e734489`, the AC11/14
activity-paging case uses the keyboard-accessible Last activity page action
before checking `Report 104`, captures the rendered page label, and verifies
both the last report and selected page persist after a live update. It does
not prescribe the page size. All 34 first failures remain missing Feature 008
behavior, including this case's absent Last 24 hours control; later assertions
are not yet exercised. The approved spec and plan are unchanged. Zack directed
no further reviewer round or cost approval and will inspect the focused diff
before confirming GREEN.

## Boundaries and follow-up risk

Existing 004 DOM tests currently pin raw event names/UTC text and literal
camera bounds. They passed unchanged at the RED test revision, but those
presentation details may conflict with the approved 008 copy and independent
lane geometry during GREEN. Do not weaken a RED assertion or silently delete
an existing 004 regression. The independent RED Reviewer should distinguish
004 behavioral invariants from historical implementation-specific literals;
any finding requiring a spec/plan change is escalated to Zack before GREEN.

`npm ci` completed locally and reported 17 high-severity advisories in the
development dependency tree. No automatic audit fix ran during RED; GREEN
must evaluate non-breaking updates and record any remainder. Reviewer
dispatch has a separate constitution rule 15 cost gate; this offline RED
evidence is not cost approval or a reviewer verdict.

## Preview round 1 correction

Zack rejected the first visual preview on 2026-11-18 and authorized a focused
RED-first correction. Commit `ba58a24` adds a production-bundle Playwright
seam at the two required captures without changing production rendering:

- 1440x940 and 800x900 CSS-pixel viewports at device scale factor 2.
- Pairwise non-intersection of navigator, canvas, and inspector bounds.
- Lane header, agent card, and navigator row overflow containment, allowing
  only explicit ellipsis.
- Visible selected-card state for the requested `test-writer-r2` identity.
- Full viewport containment of the Copy full ID button.

`npm run test:preview-layout` fails as intended at `ba58a24` with
`preview-wide.png: expected lane headers and agent cards`. This is missing
production behavior: the current SVG renderer has lane headers but no explicit
agent-card state/containment seam, and therefore cannot satisfy the selected
card assertion.

The unaffected command `npx vitest run` passes all 125 existing tests across
five files at the same revision. Two discarded setup attempts are not product
evidence: the first Agent Flow formatter wrapper ran below the repository root,
and the first unaffected-suite command retained the repository root as the
process working directory, causing path-relative test setup failures. The
formatter and exact Vitest command were rerun from their required directories
and passed.

### Round 1 corrections

Corrected RED test commit `2d98f54` addresses every round-1 finding:

- Wide geometry requires navigator/canvas/inspector column order, a 240-300px
  navigator, a 330-390px inspector, and at least 700px of usable canvas width
  and height.
- Narrow geometry requires navigator/canvas/inspector vertical order, near
  full-width sections, usable navigator/canvas heights, and full viewport
  containment.
- The rendered fixture must expose exactly three aligned fixed-width lane
  headers, eight visible graph cards, three navigator groups, seven current
  navigator agents, one shared connector bus, and three lane rails.
- The orchestrator must be centered over the canvas; structural worktree roots
  must not render as cards; segmented range and grouped zoom controls must be
  present.
- Any overflowing tested element itself must declare `text-overflow:
ellipsis`, clipped horizontal overflow, and `white-space: nowrap`; an
  unrelated descendant can no longer excuse overflow.

At exact executable revision `2d98f54`, `npm run test:preview-layout` fails for
missing approved behavior with `preview-wide.png: inspector width is outside
the target band`. `npx vitest run` passes all 125 existing tests in five files
at the same revision. The following evidence/tracking commit changes no
executable, fixture, package, or test file; reviewers can verify that relation
directly in the cumulative diff.

### Zack-authorized escalation correction

After round 2 identified one remaining assertion defect, Zack explicitly
authorized one targeted correction. Test commit `f4d7519` requires every
counted lane header, agent card, navigator row/group, connector bus, and lane
rail to be browser-visible with both positive rendered width and height.
Hidden placeholders and zero-area SVG groups can no longer satisfy visible
population counts.

At exact executable revision `f4d7519`:

- `npm run test:preview-layout` remains RED for missing production behavior:
  `preview-wide.png: inspector width is outside the target band`.
- `npx vitest run` passes all 125 existing tests across five files.
- `npm run typecheck` passes, including the Playwright guard.

No production source, style, generated preview, approved mock, or package
dependency changed in this exception. GREEN remains pending Zack's explicit
confirmation of this corrected RED evidence.

## Preview round 2 correction

Zack reviewed preview round 2 on 2026-11-18 and approved five focused
corrections. Base `881d320`; test-only RED commit `8053e11`. No production
source, stylesheet, fixture, generated preview, dependency, adapter, or approved
spec/plan file changed in this RED revision.

| Requested correction | RED seam and named assertion |
| -------------------- | ---------------------------- |
| 1: connector topology | `webview.test.ts: defaults to the recent graph with one lane rail and one attributed tick per card` requires exactly one rail path, one line tick per visible lane card, and one attributed connector per reported link. `capture-preview.ts` independently requires one orchestrator drop, one bus, one drop per lane, one rail per lane, and one tick per rendered card at both target widths. |
| 2: fixed lane-card width | `webview.test.ts: assigns root-prefixed orphans to their lane and keeps card copy inside fitted boxes` requires ellipsized long content and a card width equal to the lane header. The browser guard checks equal rendered widths and left/right containment for every lane card. |
| 3: real adapter IDs | `webview.test.ts: renders the reported hashed worktree slug without inventing a branch name` requires the reported eight-hex suffix in the lane, navigator, and inspector. The browser guard rejects non-adapter root forms and invented full branch text. |
| 4: narrow document flow | The 800x900 browser guard requires a 480-560px canvas, visible toolbar note, unclipped workspace/inspector/activity, normal document scrolling through the footer, and no pane overlap. |
| 5: copy and status polish | The dated-activity and navigator cases require separator-free visible time/label text and a visible status-word element. The browser guard also requires card/navigator status words, structured older-run copy, and separator-free activity rows. |

At exact test revision `8053e11`:

- `npx vitest run test/webview.test.ts --reporter=dot` exits 1 with five
  expected failures and 44 passes. Failures are the old expanding card, grouped
  rail/bracket path, trailing activity separator, absent visible navigator
  status, and absent hashed-slug spans.
- `npm run test:preview-layout` exits 1 with
  `preview-wide.png: preview does not use and render adapter-accurate hashed
  worktree slugs`. The production bundle and old fixture render successfully;
  the failure is the first missing approved behavior, not setup or navigation.
- The unaffected command using a negative test-name pattern for only those five
  cases passes 121 tests across five files with five skipped and zero failures.
- `npm run lint`, `npm run format:check`, and `npm run typecheck` all pass.

The preview fixture remains synthetic and offline. The tests read no private
runtime stream, invoke no external network, and make no adapter or publisher
change.

### Round-1 review corrections

Fresh RED review round 1 returned `CHANGES_REQUESTED` for a contract conflict
and three assertion defects. Zack's newer preview-round-2 instruction is now
recorded explicitly in AC5 and the approved plan: lane cards use fixed lane
widths and visible ellipsis while preserving complete accessible names. Test
commit `b826fac` also:

- preserves the complete long name in the card's accessible label;
- replaces initial-viewport containment with document-width, order, footer,
  and no-trailing-space checks for the narrow normal-flow layout;
- requires the exact three reported preview slugs in lane, navigator, and
  inspector surfaces, plus slug-derived lane labels;
- requires every card and navigator status word to be visible, nonempty, and
  one of the supported status words.

At exact corrected test revision `b826fac`:

- `npx vitest run test/webview.test.ts --reporter=dot` exits 1 with the same
  five missing-behavior failures and 44 passes. The failures are fixed-width
  visible ellipsis, a single path rail with attributed ticks, separator-free
  activity copy, visible navigator status, and exact hashed-slug surfaces.
- `npx vitest run -t '^(?!.*(?:assigns root-prefixed orphans|defaults to the recent graph|renders dated plain activity|groups navigator identities|renders the reported hashed worktree slug)).*$' --reporter=dot`
  exits 0 with 121 passing tests and five skipped.
- `npm run test:preview-layout` exits 1 after rendering the local production
  bundle with `preview-wide.png: preview does not use and render
  adapter-accurate hashed worktree slugs`.
- `npm run lint`, `npm run format:check`, and `npm run typecheck` exit 0.

No production source, stylesheet, preview fixture, generated preview,
dependency, adapter, or publisher file changed in the corrected RED commit.

### Zack-authorized AC5 correction

After fresh round 2 found that the earlier AC5 geometry test still required
wrapped visible text and rejected ellipsis, Zack authorized one targeted RED
correction. Plan commit `1c79e2d` replaces the residual wrapped-text sentence;
test commit `6a41ed1` makes the older geometry case require the same fixed
lane width, single visible ellipsized line, and complete accessible name as the
new card guard.

At exact executable revision `6a41ed1`:

- `npx vitest run test/webview.test.ts --reporter=dot` exits 1 with six
  expected missing-behavior failures and 43 passes. The aligned legacy geometry
  case now fails because production renders four wrapped lines rather than one
  ellipsized line; the other five failures are unchanged.
- `npx vitest run -t '^(?!.*(?:foreground labels fit inside fixed boxes|assigns root-prefixed orphans|defaults to the recent graph|renders dated plain activity|groups navigator identities|renders the reported hashed worktree slug)).*$' --reporter=dot`
  exits 0 with 120 passing tests and six skipped.
- `npm run test:preview-layout` reaches the local production bundle and exits 1
  with `preview-wide.png: preview does not use and render adapter-accurate
  hashed worktree slugs`.
- `npm run lint`, `npm run format:check`, and `npm run typecheck` exit 0.

No production source, stylesheet, preview fixture, generated preview,
dependency, adapter, or publisher file changed. GREEN remains frozen pending
Zack's explicit confirmation of this corrected RED.
