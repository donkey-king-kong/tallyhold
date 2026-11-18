# 008: Agent monitor UI architecture plan

## Status and approvals

- [Spec](spec.md): Approved — Gate 1, 2026-11-18 (Zack), at branch head `74fae10`.
- **Approved architecture plan — 2026-11-18 (Zack), at branch head `f90265e`.**
  [Tasks](tasks.md) may proceed through RED review before GREEN.
- This is a local, read-only extension presentation change. No portfolio
  application, publisher/adapter, source reader, database, Alembic migration,
  CI workflow, or multi-session aggregation change. The 004 limits and privacy
  rules remain in force. Any CI/Compose change belongs to Track C.

## Approach

### Boundaries and data

Keep `src/host/sourceReader.ts` and its selected-source lifecycle untouched.
Keep the event reducer's acceptance, status, relationship, immutable positions,
diagnostics, source-order semantics, and replay unchanged. Its **projection
only** may gain these already-reported or verifiably derived optional fields:

| Field | Source and use | Unavailable behavior |
| --- | --- | --- |
| `projection.lastEventAbsoluteTime` | Absolute time of the last accepted source-order record, derived only from a verified matching session start and that record's relative time; header age. Not `lastSuccessfulRead` or max timestamp. | `null`; header says last event time unavailable. |
| `node.reportedRole` | Explicit `role` string on a reported agent record, if present. Do not infer a role from ID, task, name or heartbeat. | `null`; inspector says role unavailable. |
| `interval.startAbsoluteTime` / `endAbsoluteTime` | Verified session start plus reported interval boundaries; no inferred missing end or spawn. | `null`; show labelled relative/incomplete bounds. |
| `activity.relatedAgentId` | Explicit `child` on dispatch and explicit returned `agent` on return, if reported; for plain labels. | `null`; say identity unavailable. |
| `activity.toolCategory` / `toolDurationSeconds` | Explicit `tool` category; elapsed reported relative time only for a uniquely paired start/end in the same agent/category, finite and nonnegative. Existing ambiguity remains authoritative. | Category unavailable or duration unavailable/ambiguous; never guess a pair. |

Do not add `branch`, `track`, process-liveness, or raw file metadata to the
projection. Worktree slug is parsed **only** from a reported `wt-<slug>` root
ID and shown verbatim; lane title uses that root's reported `task`. A future
explicit publisher branch field would require a new reviewed contract before
displaying it. Synthetic fixtures create the `wt-<slug>` events directly;
there is no dependency on the shared-stream chore being merged.
The duration field alone needs the existing tentative tool-pair accumulator
to retain its uniquely eligible start's relative time; this is projection
bookkeeping, not a change to which pairs count as certain or to agent status.
If the pair is ambiguous, unmatched or reversed, its duration stays absent.

`src/shared/protocol.ts` continues to bound host messages; add validation of
any newly carried optional projection field without accepting HTML, commands,
URIs, or a larger payload. `src/extension.ts` and `src/host/monitorPanel.ts`
remain unchanged: toolbar, range, selection, zoom and copy are local webview
actions. Do not request new host filesystem or clipboard privileges; use the
webview clipboard API only on user activation with an explicit failure message
and selectable ID fallback.

### Webview structure

Split `src/webview/main.ts` into a small stateful mount/update coordinator
with local selected ID, selected interval, camera, range, older-expanded,
filter, search, activity page and focus state. Extract pure presentation
functions to `src/webview/presentation.ts` (view selection, time, event/status
copy) and graph geometry/rendering to `src/webview/graph.ts`; use DOM/SVG
elements and `textContent`, never `innerHTML`. The mounted tree is:

1. `MonitorHeader`: path, session, reader banner, Following + verified last
   event age, Choose source.
2. `MonitorToolbar`: Last 24 hours / All runs, Only last reported active,
   zoom out/in, Fit all, pan controls, and one-line status caveat.
3. `MonitorWorkspace`: `AgentNavigator` (`nav`), `LaneGraph` (SVG in central
   scroll/pan region), `AgentInspector` (details and paged activity).
4. `MonitorFooter`: a collapsed disclosure containing provisional companion
   observations and diagnostics; always-visible counts. Never let those
   collections precede the workspace.

`media/styles.css` uses a three-column grid for webview widths >=960 CSS px,
with minmax(0, 1fr) center and separately scrollable side panes. Below 960px
it switches to a single column in navigator, graph, inspector order; header,
toolbar and collapsed footer stay reachable. Graph height has a bounded
viewport rather than expanding with agent count. Native button, input, and
disclosure semantics plus editor font and spacing tokens take precedence over
decorative motion. Preserve 004 keyboard pan and focus on re-render; a
filtered selected node keeps a reveal action.

### Lanes, nodes, edges and camera

Calculate a **presentation geometry** from projection identities, edges and
source-order activities; do not mutate core `position`. The orchestrator, if
reported, is an anchor above the lanes. Root IDs matching `wt-<slug>` reserve
lanes in first-seen source order; a root's task or "unavailable" is the lane
title, its exact reported slug/root ID is the subtitle. Each descendant takes
the first reported root reached through resolved parent links; otherwise it
occupies a visibly ungrouped column. Maintain stable lane/slot allocations
per source generation keyed by node ID, plus a stable slot per reactivation
interval: append new nodes/intervals in first reported source order and never
repack old slots on status, filter, late edges, or time ticks. A child first
shown before its root stays in its ungrouped slot if a late parent appears,
with the newly resolved connector and worktree association in navigator and
inspector; moving it would violate 004's stable-position promise. A new
source generation recomputes deterministically from its records.

Use the assigned **display lane**, not a guessed role or branch, to shorten
graph/navigator names: for root `wt-<slug>`, remove the exact `<slug>-` prefix
only when the node's full ID starts with it and a nonempty name remains.
Otherwise show the full ID. An ungrouped node has no assigned lane and keeps
its full ID even if it happens to start with another lane's prefix; a
late-resolved parent does not retroactively change that display assignment.
Do not change identity keys, searchability by full ID or accessible full
names. The inspector always shows and copies the full ID. The publisher
reports no role field today: `reportedRole` remains explicit-only and the
inspector says role unavailable when it is absent.

Render one graph SVG with explicit edge layer, lane/header layer and node
layer. For every resolved pair with both rendered endpoints, draw exactly
one `data-parent-id`/`data-child-id` connector from parent bottom port to
child top port; across lanes route through a non-overlapping gutter. No
connector for orphan/self/cycle links or a filtered-out endpoint. Keep
connectors behind boxes; node text/tspans are in a foreground group **after**
box shapes, **inside** each box with padding. Measure and wrap the displayed
label; size the box's width and height to contain every line and reserve
enough row/column space for the resulting box bounds. Include those bounds
in Fit all; never paint text underneath its box, overlap another node or
ellipsize it. At tight zoom, pan/zoom and accessible full names in
navigator/inspector reach any text outside the viewport.

Reuse 004 camera preservation across append, range and status filters; initial
open and Fit all bound every accepted identity (including terminal, unknown
parent and older runs), while range/filter visibility does not erase
identities. Cull offscreen shapes and connectors together; retain the <=500
graph-element budget where possible and use navigator navigation to move
camera to nodes beyond the first cull batch. Never make a resolved link with
two rendered endpoints disappear because of layering or clipping. At 25
agents across several roots, lane column height follows the busiest lane,
not the total population.

### Status, time and event copy

Map reported `working`/`starting` to Working, `waiting` to Waiting, `blocked`
to Blocked, `failed` to Failed, `completed`/other terminal completion to
Completed, and unknown status to "Unknown status" with its own question mark.
Use restrained inline SVG marks: play, pause bars, stop bar, cross, check,
and a dashed question outline for Unknown parent. The parent mark is a
relationship annotation **beside** the reported status, never a replacement.
Use `--vscode-foreground` against `--vscode-editor-background` or
`--vscode-editorWidget-background` for essential text; use
`--vscode-focusBorder`, `--vscode-panel-border`, and
`--vscode-contrastBorder`/`--vscode-contrastActiveBorder` where applicable.
Semantic chart/error tokens may accent the marks only when contrast passes;
fall back to foreground plus shape/text. No opacity reduction on Completed.
Theme fixtures must resolve tokens and check WCAG >=4.5:1 for text and
>=3:1 for connector/icon/focus boundaries on actual adjacent surfaces in
light, dark, and high-contrast. JSDOM cannot calculate real layout or resolve
editor tokens reliably: inject resolved test tokens for DOM/style checks and
include packaged-editor visual/keyboard checks for real geometry.

In `presentation.ts`, format verified ISO instants with `Intl.DateTimeFormat`
in the user's default zone (time-zone abbreviation or GMT offset, not `Z`);
format ages as compact whole units (`12s`, `1h 4m`, `6d`) and durations
separately (`3m 15s`). Clamp future/invalid ages to unavailable rather than
negative time. A complete reported interval with verified absolute bounds is
`Ran <start> → <end> · <duration>`; a still-open reported interval says
`Running for <duration> (reported through <last event>)`, measured from
start to the latest *reported* event, never from wall time. Tick only verified
last-report ages and the "No report <age>" tag after strictly more than
one hour; it is not a liveness alarm. For missing/mismatched session metadata
or incomplete intervals, say `Session-relative +<time>s` or "unavailable"
with an incomplete label per 004 AC6/13; do not synthesize a wall date.

Map `agent_spawn` to Started; `subagent_dispatch` to "Handed work to
<reported child>" and `subagent_return` to "Got result from <reported
agent>"; waiting (`permission_requested`) to `Waiting: "<message>"`;
`tool_call_end` to `<Category> · Succeeded/Failed · <duration>` with explicit
ambiguous/unmatched markers. `message`, `error`, `agent_complete` and
`tool_call_start` get distinct plain labels ("Reported", "Blocked", "Completed",
"Started <category> tool") with inert reported summary text only when useful.
An unrecognized activity type renders `Other reported event` plus a safely
rendered type value; never repeat a raw type as both label and summary.
Chronology is source order, not sorted wall time. A failed tool row does not
change the node's status.

### Range, inspection and recovery

Last 24 hours is a **presentation-only** comparison against the verified
absolute bounds of execution intervals (a reactivation is another run).
Include a run when it intersects `[now - 24h, now]` by reported start/end or
verified last report; put verified runs ending before the cutoff in one
collapsed Older runs navigator row with a count. Unknown chronology appears
in a separately labelled "Time unavailable" group, never silently dropped.
All runs exposes all intervals; a root without multiple intervals still has
one run. Selecting an older entry expands it and focuses its identity and
interval; no new source is read or session merged. The graph may retain
context ancestors with a "Outside range" label rather than misdate them.
Active-only intersects the range using `terminal`, never companion status.
Search and Reveal reach hidden selection, and all activity pages remain
inspectable after a range toggle.

Inspector reports the explicit role or unavailable, `Worktree: <slug>` from
an observed root association or unavailable, task, icon+word status, parent
or Unknown parent, reported start/duration, last-report age, copyable full
ID, and paged chronological activity. Retain selection and keyboard focus
through append/filter; uncertainty is phrased plainly, not as Identity kind,
Relationship, or Execution interval reported. Footer remains collapsed on
update unless the user expands it; stale/error views keep the last valid
graph and separate reader state from node state.

## Files and layers

| File / layer | Planned responsibility |
| --- | --- |
| `extensions/agent-monitor/src/core/reconcile.ts` / projection only | Optional verified absolute bounds, last-event time, explicit role and counterpart/category/duration fields; **no** reader, parser, reducer-status, relationship, interval-policy, or core-position changes. If a field needs a semantic rewrite, return to Zack before RED. |
| `extensions/agent-monitor/src/shared/protocol.ts` / shared boundary | Bound and validate added optional projection fields; no new webview command or host capability. |
| `extensions/agent-monitor/src/webview/presentation.ts` / view model | Pure formatting, exact assigned-lane prefix shortening, last-reported state mapping, range/run selection, plain activity mapping and unavailable fallbacks. |
| `extensions/agent-monitor/src/webview/graph.ts` / view geometry | Deterministic lane/slot allocation, SVG labels inside fitted boxes, edges, bounds/culling and accessible full node names. |
| `extensions/agent-monitor/src/webview/main.ts`, `media/styles.css` / UI | Header, toolbar, three panes, footer, inspector, navigator, local controls, theme, keyboard/focus and reduced motion. Existing bootstrap continues to mount/update. |
| `extensions/agent-monitor/test/{core,presentation,webview}.test.ts` / verification | Named synthetic unit and DOM cases below; no real JSONL or shared-stream dependency. |

No backend/frontend product layer, schema migration, new runtime dependency
or ADR is needed. The existing 004 extension host/webview architecture stays
in place; this plan records the visual geometry and derived-field trade-offs.

## Verification

Each row names a test to add under `extensions/agent-monitor/test/` **after**
Zack approves this plan. Use synthetic `wt-a1`/`wt-b2` roots with task text,
descendants, delayed parents, duplicate-valued records, two intervals per
identity, no anchor, stale companions, unsupported types and out-of-order
reports. No private logs, images, or chore-branch import.
For the display-name case, assign `alpha-reviewer` to `wt-alpha` and assert
`reviewer`; keep `beta-reviewer` in that lane and ungrouped `alpha-orphan`
at full length. In all three cases the inspector/copy target remains the
original ID and an absent reported role stays unavailable.

| AC | Design path | Named test(s) |
| --- | --- | --- |
| 1 | Header from source state and last accepted verified event, independent reader errors | `webview.test.ts: header shows source session following age and stale recovery`; `core.test.ts: last event absolute time uses last accepted record` |
| 2 | Local toolbar and intersected active/range filters, honest note | `webview.test.ts: toolbar toggles range and last reported active without liveness claim` |
| 3 | CSS grid with 960px breakpoint, bounded panes and graph | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order` |
| 4 | Source-order stable worktree slots, reported task/slug and ungrouped late parent; shorten only an assigned lane's exact slug prefix | `presentation.test.ts: lane assignment preserves slots across late root and append`; `presentation.test.ts: display name strips only assigned lane prefix and preserves unmatched and ungrouped ids`; `webview.test.ts: root task titles slug subtitles and agent counts span lanes` |
| 5 | Foreground text inside padded, wrap-fitted node boxes and box-inclusive Fit all | `webview.test.ts: foreground labels fit inside boxes without overlap at fit and zoom` |
| 6 | One keyed connector per resolved pair with both endpoints, edge layer below nodes | `webview.test.ts: all resolved links draw one connector including cross lane and late parent` |
| 7 | Distinct icon+word states and dashed unknown-parent annotation; tool result isolated | `webview.test.ts: statuses and unknown parent show distinct symbols without fading completed`; `webview.test.ts: failed tool never changes completed agent status` |
| 8 | Age clock and >1h tag without inference | `presentation.test.ts: no report threshold requires verified age`; `webview.test.ts: quiet report tag advances without dimming` |
| 9 | Local-zone formatter and bounded interval/age fallback | `presentation.test.ts: local time ages durations and relative fallback respect verified bounds`; `core.test.ts: incomplete interval exposes no invented absolute end` |
| 10 | Plain per-type labels, safe counterparts and paired-only tool duration | `presentation.test.ts: event labels avoid raw repetition and preserve ambiguous tools`; `core.test.ts: tool duration exists only for unique nonnegative pair` |
| 11 | Inspector derived root/explicit-only role and selected interval; full ID/copy regardless of shortened graph name, paged source order | `webview.test.ts: inspector shows worktree task unavailable role status times parent and copyable full id` |
| 12 | Local interval range and collapsed older group; unknown separate | `presentation.test.ts: last 24 hours groups older and unknown intervals without dropping history`; `webview.test.ts: older run expansion search and reveal retain selection` |
| 13 | Collapsed footer, advisory companions and actionable diagnostics | `webview.test.ts: footer keeps graph visible and expands provisional snapshots and diagnostics` |
| 14 | Resolved-token contrast, keyboard/focus and reduced motion in all themes | `webview.test.ts: light dark high contrast meet text and connector contrast`; `webview.test.ts: keyboard and reduced motion reach controls and inspector` |
| 15 | Existing source isolation, stable camera, privacy/limits and regression | `webview.test.ts: historical and incremental fixtures preserve camera and no executable telemetry`; existing `core.test.ts`, `host.test.ts`, `packaging.test.ts` and adapter tests remain green |

JSDOM uses stubbed SVG text metrics/client rectangles to assert box shape
precedes foreground text, wrapped text bounds fit within padded box bounds,
boxes do not overlap, and Fit all includes each full box; complement that
deterministic DOM check with actual
VSIX smoke in recorded light/dark/high-contrast themes and wide/narrow editor
panels before release. Retain extension limits (64 MiB, 100,000 complete
records, 2,000 identities, 1 MiB per line), <=500 rendered graph nodes per
viewport, paged activities, >=80% extension coverage, lint/format/typecheck,
build, package audit, and publisher adapter tests. Record performance on a
synthetic 25-agent multi-lane fixture and existing 004 representative workload.

## Decisions and open questions

- Prefer a webview-owned presentation geometry rather than changing 004's
  immutable core positions; late relationships gain edges, not node motion.
- Add only the optional projection facts listed above; missing facts are
  labelled unavailable. No fake track/branch/role or guessed absolute time.
- The same selected source/session remains authoritative; a range is not a
  second reader or a cross-session merge.
- No unresolved design choices. If actual theme contrast or the 004 resource
  envelope cannot support this design, bring measured evidence back to Zack
  before changing the approved plan.
