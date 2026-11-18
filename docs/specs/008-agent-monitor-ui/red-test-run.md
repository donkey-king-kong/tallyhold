# 008 Agent Monitor UI RED test run

- Test revision: `1522e5f23c27867dddea49739485302ad1dccbc5` (`test: specify agent monitor UI behavior in synthetic RED cases`).
- Previous plan revision: `f90265e`; approval was recorded in `f8bc088`. This is a synthetic-only RED handoff; no production source, 004 test, publisher, or adapter file changed.
- Platform: local macOS, Node/Vitest from locked `npm ci`. No real JSONL, credentials, external service, or shared-stream chore fixture.
- Public seams: `createStream(...).ingest(...).snapshot()` checks projection facts (not how records are stored); `mountMonitor(root, state).update(...)` checks visible DOM, controls, accessible content, graph geometry and local rendering (not private collaborators). CSS token checks use resolved synthetic themes and the shipped stylesheet.

## Commands and outcomes at test revision

Run from `extensions/agent-monitor/` unless noted.

| Command | Exit | Collected / failed / passed / skipped | Interpretation |
| --- | ---: | --- | --- |
| `./node_modules/.bin/vitest run test/core.test.ts test/presentation.test.ts test/webview.test.ts -t 'Feature 008' --reporter=json` | 1 (expected) | 65 / 25 / 0 / 40 | All new cases fail on absent approved behavior; no setup, import, fixture, collection or network errors. |
| `./node_modules/.bin/vitest run -t '^(?!.*Feature 008)' --reporter=dot` | 0 | 102 / 0 / 77 / 25 | Existing 004 extension tests in core, host, packaging and webview pass; only the 25 new cases are skipped. |
| `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` (repo root) | 0 | 6 / 0 / 6 / 0 | Existing local publisher adapter tests pass. |
| `npm run lint && npm run typecheck && npm run format:check` | 0 | n/a | ESLint, TypeScript and Prettier checks pass. |

The RED cases use `wt-a1`, `wt-b2` and `wt-alpha` roots produced by
synthetic projection objects or in-memory JSONL records. Out-of-order and
cross-session records, duplicate-valued events, an incomplete interval, an
ambiguous pair and a delayed parent are generated locally. No dependence on
the worktree stream publisher or private log files.

## Acceptance and verification mapping

Every row below maps the numbered item in [plan.md](plan.md#verification) and
the matching [spec.md](spec.md#acceptance-criteria) AC to the exact named test.
The final column records the **first failing assertion** at `1522e5f`, not a
claim that later assertions ran. Each failure is missing projected facts,
rendered content, visible styling, or a planned control.

| AC / plan item | New test name (`test/`) | First missing behavior |
| --- | --- | --- |
| 1 | `core.test.ts: last event absolute time uses last accepted record` | Projection has no `lastEventAbsoluteTime`. |
| 1 | `webview.test.ts: header shows source session following age and stale recovery` | Header lacks "Following · last event 12s ago". |
| 2 | `webview.test.ts: toolbar toggles range and last reported active without liveness claim` | No named monitor toolbar or range control. |
| 3 | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order` | No three-pane monitor workspace. |
| 4 | `presentation.test.ts: lane assignment preserves slots across late root and append` | Root's task/lane header is absent. |
| 4 | `presentation.test.ts: display name strips only assigned lane prefix and preserves unmatched and ungrouped ids` | Navigator still displays matching `alpha-reviewer` without shortening. |
| 4 | `webview.test.ts: root task titles slug subtitles and agent counts span lanes` | Graph lacks root task title "Review accounts". |
| 5 | `webview.test.ts: foreground labels fit inside boxes without overlap at fit and zoom` | Node text has no wrapped lines inside fitted boxes. |
| 6 | `webview.test.ts: all resolved links draw one connector including cross lane and late parent` | Lines lack attributed parent/child endpoints (and visible stroke is unverified). |
| 7 | `webview.test.ts: statuses and unknown parent show distinct symbols without fading completed` | Distinct status icons are absent. |
| 7 | `webview.test.ts: failed tool never changes completed agent status` | Inspector lacks planned Completed presentation; existing 004 does keep tool failure separate. |
| 8 | `presentation.test.ts: no report threshold requires verified age` | No "No report <age>" tag after threshold. |
| 8 | `webview.test.ts: quiet report tag advances without dimming` | Quiet node has no advancing tag. |
| 9 | `core.test.ts: incomplete interval exposes no invented absolute end` | Intervals lack verified absolute boundary fields. |
| 9 | `presentation.test.ts: local time ages durations and relative fallback respect verified bounds` | Inspector still uses raw interval wording and lacks local-zone duration. |
| 10 | `core.test.ts: tool duration exists only for unique nonnegative pair` | Tool category and duration are not projected. |
| 10 | `core.test.ts: dispatch and return project only reported counterpart identities` | Activity lacks explicit counterpart ID. |
| 10 | `presentation.test.ts: event labels avoid raw repetition and preserve ambiguous tools` | Timeline lacks "Started" plain label. |
| 11 | `webview.test.ts: inspector shows worktree task unavailable role status times parent and copyable full id` | No "Worktree: a1" detail. |
| 12 | `presentation.test.ts: last 24 hours groups older and unknown intervals without dropping history` | No Last 24 hours range control. |
| 12 | `webview.test.ts: older run expansion search and reveal retain selection` | No Last 24 hours range control or older row. |
| 13 | `webview.test.ts: footer keeps graph visible and expands provisional snapshots and diagnostics` | No compact monitor footer region. |
| 14 | `webview.test.ts: light dark high contrast meet text and connector contrast` | Connectors have no computed stroke; checks require >=4.5:1 text and >=3:1 lines against adjacent surfaces. |
| 14 | `webview.test.ts: keyboard and reduced motion reach controls and inspector` | Range controls are absent; keyboard and reduced-motion checks follow. |
| 15 | `webview.test.ts: historical and incremental fixtures preserve camera and no executable telemetry` | Graph does not display reported lane task on append; camera, safe text and source switch assertions follow. |

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
