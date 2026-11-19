# 008: Agent monitor UI redesign

## Status

Approved — Gate 1, 2026-11-18 (Zack).

## Approved real-data smoke amendment

Zack approved these corrections on 2026-11-19 after hands-on smoke round 1
against the shared stream:

1. Render one card and navigator row per identity per lane. Collapse repeated
   intervals into that identity, show the latest run on its card, and show an
   in-row `×N` run badge. The inspector defaults to the latest run and keeps
   its run selector and activity scoped to the selected run. An unavailable
   duration is a muted in-row value, never loose text between rows.
2. Put identities without a `wt-` worktree prefix in the far-left
   `Unassigned (before shared stream)` lane and navigator group. It uses the
   same header, rail, ticks, and one bus drop as worktree lanes. Every visible
   connector segment is horizontal or vertical; no diagonal connector is
   allowed.
3. Treat a worktree registration identity whose ID equals its root ID and
   whose task is `Worktree activity` as lane metadata, not an agent. It never
   renders as an agent card or navigator row; its reports feed the lane
   header's status and since-time.
4. Range filtering compacts each lane to visible identities with no empty
   slots. This supersedes preservation of empty presentation slots across a
   range/filter change; identity order remains deterministic.

## Approved real-data preview round 2 amendment

Zack approved these corrections on 2026-11-19 after reviewing all four
parser-backed real-data previews at `7ccf2b8`:

1. Card summary text shows only a human summary the agent actually reported.
   Raw event types never appear as summaries. With no human summary the slot
   stays empty, except an unmatched in-progress tool start says
   `Running tool`.
2. Card and navigator duration always mean the latest run's duration, or its
   elapsed-so-far duration while that run remains open. The two surfaces show
   the same value for an identity in either range. Report age appears only in
   the inspector and the existing AC8 quiet-report tag.
3. A lane's small-caps label is its kind: `WORKTREE`, `MAIN CHECKOUT`, or
   `UNASSIGNED`. The lane name line keeps the slug and visually mutes an
   eight-character hash when present.
4. Initial load and every range or active-filter change automatically Fit all,
   anchored to the canvas top and horizontally centered. Fitted zoom is
   bounded by 100% and the existing minimum; when minimum zoom cannot contain
   all content, anchor top-left and preserve panning. Manual camera changes
   persist until the next filter change.
5. A registration identity is metadata whenever its ID equals its lane root
   in current hashed or legacy unhashed form, regardless of task. Registration
   identities never render as agents, and empty lanes are hidden. Display-name
   shortening removes the assigned lane root prefix in either format.
6. Base names truncate from the middle without dropping a `· <suffix>` tail.
   Cards and navigator use the compact `×N` run badge, and navigator names do
   not append `current`.
7. The recent, older, and all-runs counts use identities under one rule and
   reconcile: recent plus older equals all-runs. At narrow widths the navigator
   has its own scroll area capped at about 40% of the viewport.

## Problem

Zack's hands-on inspection of a week of real Feature 004 JSONL on 2026-11-18
found zero reader diagnostics, but the webview is difficult to use: node boxes
obscure their labels, parent-child connectors are absent, and a one-node-per-row
graph becomes very tall at about 25 agents. Status has no visual symbol, raw
session-relative seconds and UTC timestamps dominate activity, event names
repeat, and implementation jargon replaces useful agent details. The heartbeat
list and navigator push the graph off-screen, while inspection sits below it.

This is a presentation follow-up to the approved [004 contract](../004-agent-monitor/spec.md)
and the hands-on follow-up [issue #44](https://github.com/donkey-king-kong/tallyhold/issues/44).
It changes the local Agent Monitor webview, not the portfolio app. The
shared-stream worktree roots (`wt-<slug>`) provide grouping when present.

## User stories

- As Zack, I want to see the orchestrator and worktrees together so I
  can locate an agent and its parent without scrolling through a long list.
- As Zack, I want readable status, local time, and plain activity descriptions
  so I can understand what was last reported without interpreting event types.
- As Zack, I want the selected agent's timeline beside the graph so I can
  inspect outcomes without losing spatial context.
- As a keyboard or high-contrast-theme user, I want the same relationships,
  states, and details to remain perceivable and reachable.

## Acceptance criteria

1. **Header and source state.** Given a selected stream, when the panel opens or
   updates, then its header shows the full selected source path, session ID,
   reader state, and a Choose source action. A healthy following reader shows
   "Following" and a humanized "last event <age> ago" when the age is
   verifiable; missing time says unavailable. Stale/error/incomplete reader
   states remain explicit and preserve the last valid view under 004 AC2/11.
2. **Toolbar and honesty.** Given the default view, when the toolbar renders,
   then it offers "Last 24 hours" and "All runs", "Only last reported active",
   zoom out/in, and Fit all, plus a visible one-line note that status is last
   reported, not proof of liveness. All runs retains terminal nodes; the
   active-only control uses last-reported nonterminal state, not a heartbeat.
   The time range never presents unverified relative timestamps as dated
   events: it labels unverifiable runs separately and keeps them reachable.
3. **Three-pane layout.** Given an editor-width panel, when the view renders,
   then the agent navigator is left, the graph center, and the selected-agent
   inspector right, with the graph visible without scrolling past navigator
   or heartbeat content. Given a narrow panel, the panes stack in navigator,
   graph, inspector order and none covers the graph controls or selected details.
4. **Worktree lanes.** Given an orchestrator and `wt-<slug>` root identities in
   one selected stream, when the graph renders, then the orchestrator anchors
   above a separate column per worktree root. Each lane header uses the root
   node's reported task text as its title (or "unavailable") and the reported
   worktree slug/root ID verbatim as its subtitle, alongside a status icon and
   word, agent count, and a humanized since-time or labelled relative fallback.
   No "Track X" label or raw branch name is invented; a raw branch may be shown
   only if a future publisher field explicitly reports one. Descendant agents
   are grouped in their worktree lane in reported chronological order; 25
   agents across several worktrees do not form a single 25-row column.
   Missing worktree roots stay reachable in an explicitly ungrouped area
   without an invented worktree or parent.
5. **Legible graph labels.** Given long and short names at normal zoom and
   after Fit all, when nodes render, then every agent card in a worktree lane
   is exactly the lane width and never exceeds its lane bounds. Visible card
   copy that does not fit that fixed width uses a single-line ellipsis rather
   than expanding, wrapping mid-word, painting underneath another box, or
   clipping into an adjacent lane. The complete name remains available as the
   card's accessible name and in navigator/inspector surfaces. A DOM
   geometry/paint-order test covers fixed card bounds, long labels, and
   multiple lanes.
6. **Visible relationships.** Given every resolved acyclic parent link in the
   displayed graph, when it renders or updates, then a visible connector joins
   the correct parent and child, including across the anchor/lane boundary.
   Filter, zoom, and Fit all preserve connectors for both visible endpoints;
   unresolved, self-linked, or cyclic relationships never create a false edge
   and retain 004 AC12 diagnostics/annotations. DOM tests assert one correctly
   attributed connector for each resolved link in a multi-generation fixture.
7. **Status and uncertainty.** Given explicitly reported Working, Waiting,
   Blocked, Failed, or Completed, when a node or lane header renders, then
   each has a distinct icon and word, never color alone. Unknown parent has a
   dashed mark and "Unknown parent" text alongside, not in place of, the
   reported status. Completed remains fully readable without fading. A failed
   tool step is marked Failed in activity only; it never changes agent status
   unless an agent-level report does so.
8. **Quiet reports.** Given a last report more than one hour ago, when the
   clock advances, then a nonterminal Working, Waiting, or Blocked node shows
   "No report <age>" without dimming or inferring liveness or failure; the tag
   updates as time passes. Completed and Failed nodes never show the tag.
   Unknown wall-clock age is labelled unavailable rather than compared to an
   invented threshold.
9. **Human time.** Given a verified absolute event or interval, when it is
   displayed in the header, lane, node, or inspector, then wall-clock time
   uses the user's local zone with its zone abbreviation where available
   (for example "10:30:56 SGT"), ages use compact units such as "12s",
   "1h 4m", or "6d", and a completed interval reads like
   "Ran 10:30 → 10:34 · 3m 15s"; an open interval says "Running for <duration>"
   only as a reported interval, not process liveness. Given no trustworthy
   absolute anchor or an ambiguous interval, the UI explicitly labels
   session-relative time or unavailable bounds per 004 AC6/13; it never
   displays raw unlabelled `+499993.939s` as wall time or a UTC `Z` as the
   user's local zone.
10. **Plain activity.** Given spawn, dispatch, return, waiting/message, and
    tool events, when the inspector timeline renders, then the event labels
    read "Started", "Handed work to…", "Got result from…",
    `Waiting: "<msg>"`, and
    "<Category> · Succeeded/Failed · <duration>" respectively where the
    reported facts support them. Absent or ambiguous tool duration says
    unavailable/ambiguous; unknown event types have a clear fallback. No row
    repeats raw names such as "subagent_return: subagent_return".
11. **Inspector.** Given a selected identity, when its inspector opens, then
    it shows role as reported (or unavailable), "Worktree: <slug>" using the
    reported slug (or "Worktree: unavailable" when absent),
    status pill with icon and word, task, started time, running-for/ran time,
    last report age, reports-to identity or Unknown parent, a copyable full
    ID, and source-order chronological activity with outcomes. It omits
    developer-facing labels such as "Identity kind", "Relationship", and
    "Execution interval reported" without hiding their uncertainty. Selection,
    focus, and activity pagination persist across live updates where applicable.
12. **Navigator and older runs.** Given more than one run, when "Last 24
    hours" is selected, then runs before that verified range appear as one
    collapsed "Older runs" navigator row with a count; expanding it makes
    their identities selectable without silently merging sessions. "All runs"
    exposes the full selected-stream history. Search, selection, and the
    reveal action still reach a filtered selected node. The range is a
    presentation filter, not a reader or reducer truncation.
13. **Compact footer.** Given heartbeat snapshots and diagnostics, when the
    view opens, then a collapsed footer shows a provisional heartbeat summary
    and diagnostics count without pushing the graph below the initial view.
    Expanding it exposes available details and actionable diagnostics;
    heartbeat data is visibly provisional and never overwrites confirmed
    event history or agent status.
14. **Theme and access.** Given light, dark, and high-contrast editor themes,
    when rendered, then labels, connector lines, status icons/words, pills,
    tags, focus indicators, and footer text have readable contrast against
    their actual backgrounds. Theme-fixture DOM/style tests check computed
    foreground/background and line contrast in each theme. Keyboard-only
    users can change range/filter, search/select/copy, expand older runs and
    footer, pan/zoom, Fit all, and inspect activity with visible focus and
    accessible names; reduced-motion preferences prevent nonessential motion.
15. **Regression and boundaries.** Given historical, incremental, invalid,
    and switched-source fixtures, when viewed through the new UI, then all
    existing 004 acceptance behavior remains, including stable positions
    and viewport, diagnostics, honest intervals, read-only privacy, selected
    source isolation, keyboard access, theme tokens, and current file/record/
    identity/line limits. Webview DOM tests cover the criteria above with
    synthetic fixtures; any additional projection fields only expose already
    reported or verifiably derived facts, not new publisher semantics.
16. **Real-stream resilience.** Given mixed legacy and namespaced identities,
   repeated runs, registration heartbeats, long copy, and quiet nonterminal
   agents, when either range renders, then unassigned identities use their
   normal far-left lane, registration roots are metadata-only, identities are
   deduplicated with run badges, visible cards are contiguous, card text does
   not intersect, and every connector segment is orthogonal. The navigator is
   resizable from a 300px default within 240px–480px without horizontal
   overflow or clipped durations. At 100% graph zoom, card names are about
   13px and status copy about 12px. The footer says either
   `<N> agents in last 24 hours` or `<N> agents · all runs` according to the
   active filter.

## Out of scope

- Reducer/source reader behavior changes, publisher/adapter protocol changes,
  or edits to runtime logs and heartbeat snapshots.
- Multi-session merging, cross-worktree aggregation from separate streams,
  automatic agent capture/control, or a process-liveness detector.
- Portfolio frontend/backend changes and marketplace publishing.

## Open questions

None for Gate 1. The stream carries no track name or raw branch, and the
shared-stream root supplies only a normalized/hashed worktree slug. Do not
derive track or branch names from it or unrelated filenames. Zack's approved
mock supplies the interaction direction.
