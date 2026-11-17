# Feature 004 review

## Round 1

### Must-fix

1. `extensions/agent-monitor/src/webview/main.ts:145-167` renders only node
   labels and never consumes or draws `projection.edges`. The resulting view is
   not the required parent-child graph, so parent relationships cannot be
   understood spatially and AC3, AC4, and AC12 are not met. The implementation
   also appends an SVG `text` element inside `foreignObject`, whose contents
   must be HTML rather than SVG; the DOM tests assert controls and navigator
   text but do not verify that graph labels actually render in an editor.

2. `extensions/agent-monitor/src/webview/main.ts:1-7` omits diagnostics from
   `MonitorState`, and the renderer never displays the parser, relationship, or
   metadata diagnostics produced by the core and host. Malformed records,
   unsupported types, session mismatches, cycles, and invalid snapshots are
   therefore invisible to the user, contrary to AC10, AC12, and AC13.
   Additionally, `extensions/agent-monitor/src/core/reconcile.ts:216-221`
   discards every `subagent_dispatch` and `subagent_return` instead of retaining
   them as reported activity as required by the approved plan and AC5.

3. `extensions/agent-monitor/src/core/reconcile.ts:326-329` and
   `extensions/agent-monitor/src/webview/main.ts:28-30` infer terminal state
   solely from the literal status strings `completed` and `failed`, even though
   the reducer already tracks whether an `agent_complete` was reported. Any
   other reported completion status remains visible under the
   "Last reported nonterminal" filter, violating AC7's terminal/nonterminal
   semantics. Expose and filter on the reported terminal boundary rather than
   two status spellings, with coverage for another completion status.

4. `extensions/agent-monitor/src/core/reconcile.ts:265-270` marks the first end
   of two concurrent same-tool calls ambiguous, decrements the open count to
   one, and then marks the second end as authoritatively paired. With no call
   IDs, neither end can be paired authoritatively once concurrent candidates
   exist. This invents certainty contrary to AC5, AC9, AC12, and the approved
   plan; add a test that checks both outcomes remain ambiguous.

5. `extensions/agent-monitor/src/extension.ts:47-64` always opens a picker and
   keeps the selected URI only in the disposable controller. The implemented
   `discoverWorktreeSources` is never wired into activation, and reopening the
   panel cannot reconstruct the current selected source without the user
   selecting it again. This leaves the workspace-stream and panel-reopen paths
   in AC2 and AC11 unimplemented.

6. `extensions/agent-monitor/src/host/sourceReader.ts:162-190` rereads and
   rebuilds the entire selected file after every changed signature, while
   `extensions/agent-monitor/src/webview/main.ts:286-289` rebuilds the full DOM
   every second. There is no approved byte-offset append path, graph viewport
   culling, or paged/virtualized activity inspector. The benchmark covers the
   pure reducer and bounds calculation only, not source reconciliation or DOM
   rendering, so it does not verify the approved 64 MiB/100,000-record/
   2,000-identity envelope or append-to-visible latency. Implement and measure
   the approved bounded host and webview paths before claiming AC9 and AC16.

### Should-fix

None.

### Nits

None.

### CI evidence

`gh pr checks 42` reports passing backend, frontend, and security jobs, with
migration jobs skipped. No reported PR check exercises the new extension, so
those results do not resolve the extension-specific findings above.

## Round 2

### Previous findings

All six round-1 must-fix findings are resolved in the current diff: graph edges
and diagnostics render, dispatch/return activity is retained, terminal filtering
uses the reported boundary, concurrent tool outcomes remain ambiguous, source
restoration/discovery is wired into activation, and bounded incremental host and
webview paths now have tests and measured evidence.

### Must-fix

1. `extensions/agent-monitor/src/host/sourceReader.ts:96-121` reads and exposes
   every sibling heartbeat JSON file even when `session.json` is absent,
   malformed, or does not match the selected stream. The approved plan requires
   an exact sibling session match before companion reads for an arbitrary
   selected file. Without that gate, selecting an unrelated JSONL can read
   irrelevant local heartbeat data, violating the read-only privacy boundary in
   AC15. Gate heartbeat reads on verified matching session metadata and cover
   the missing, malformed, and mismatched cases.

2. `extensions/agent-monitor/src/core/reconcile.ts:135-161` only appends valid
   edges and never removes an edge that later becomes cyclic. For example,
   ingesting child-with-missing-parent, then the parent, then a report that
   assigns that parent back to the child leaves the previously accepted
   parent-to-child edge in `snapshot().edges` after both relationships become
   unresolved. The renderer will still draw the rejected cycle, contrary to
   AC12. Reconcile the edge set from currently valid relationships and add this
   late-cycle regression case.

3. `extensions/agent-monitor/src/webview/main.ts:34-42` computes Fit All from
   node origins but omits each node's 180-by-60 extent, so the rightmost and
   bottommost nodes are clipped outside the resulting viewBox.
   `extensions/agent-monitor/src/webview/main.ts:260-276` also applies the
   active-only filter to the SVG but not the navigator, leaving terminal nodes
   visible and selectable while the filter is enabled. These behaviors violate
   AC4's reachable Fit All view and AC7's explicit visibility filtering. Include
   node extents in bounds and apply one consistent visible-node set.

### Should-fix

1. `extensions/agent-monitor/src/webview/main.ts:23-28` adds Enter/Space
   handlers to native buttons in addition to their native click activation, so
   keyboard activation can execute zoom, pan, paging, and selection actions
   twice. `extensions/agent-monitor/src/webview/main.ts:250-258` replaces the
   entire DOM on every search input event, dropping focus after the first typed
   character; state updates similarly do not restore focused controls. Remove
   duplicate native-button activation and preserve focus through search and
   updates to satisfy AC14's keyboard workflow.

### Nits

None.

### CI evidence

`gh pr checks 42` reports both displayed backend, frontend, and security runs
passing; production migration and migration-change jobs are skipped. The
reported checks still do not run the extension-specific suite.

VERDICT: CHANGES_REQUESTED
