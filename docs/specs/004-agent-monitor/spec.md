# 004: Local agent monitor extension

## Status

Approved — Gate 1, 2026-11-16. Zack accepted all recommendations in grilling
rounds 1 and 2 on 2026-11-13 and explicitly approved this written contract on
2026-11-16. The architecture plan requires separate approval before tests or
implementation.

## Problem

Zack needs to inspect cooperative agent activity inside Trae or VS Code without
nodes disappearing, fading, or becoming inaccessible as historical events load.
The current external Agent Flow viewer has documented historical-ingestion and
camera limitations; this feature replaces the viewer, not agent execution.

Issue: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20).
Product boundary: a Tallyhold-local developer extension, packaged independently
of the portfolio API and frontend. No localhost server or external browser.

## User stories

- As Zack, I want a stable parent-child graph so I can understand reported work.
- As Zack, I want to inspect a node's activity and outcomes, including after
  completion, without replaying an animation.
- As Zack, I want to switch worktree streams without mixing sessions.
- As Zack, I want visible reader failures and honest status labels so missing
  telemetry cannot masquerade as successful or actively running work.

## Acceptance criteria

1. **Local installation.** Given the packaged VSIX, when installed in each
   supported Trae and VS Code version, then an explicitly named extension
   command opens the monitor inside the editor. Recorded smoke-test evidence
   identifies the actual editor versions. No separate server, browser, or
   portfolio application is required.
2. **Stream selection.** Given a workspace stream or a user-selected worktree
   JSONL file, when opened, then its path and session identity are visible.
   Switching streams replaces the selected view without mixing nodes or events.
   A missing or unreadable file produces an actionable state rather than an
   apparently empty successful connection.
3. **Historical reconstruction.** Given a valid completed stream, when opened
   after work has ended, then all reported identities and parent relationships
   are accessible, including completed and failed nodes at normal readability.
   A completed stream needs neither live animation nor playback to show nodes.
4. **Stable graph.** Given an open graph, when activities arrive or node states
   change, then existing nodes retain their positions and the viewport is
   preserved. New identities extend a deterministic parent-child layout without
   continuously rearranging existing nodes. Pan, zoom, and a visible Fit All
   control make every node reachable. Opening a stream initially fits its graph.
5. **Inspection.** Given a selected node, when its inspector opens, then it shows
   the published identity, task when known, last reported status, last-update
   age when knowable, and chronological activity/tool outcomes. Unknown values
   are labelled unavailable. A failed tool outcome is visibly distinct from
   success; it does not by itself declare the entire agent failed.
6. **Reactivation.** Given a completed identity that spawns again in the same
   session, when subsequent events arrive, then the existing node represents its
   new execution interval and earlier activity remains inspectable. An identity
   is scoped to its source/session, not shared across worktrees. Incomplete or
   ambiguous intervals are labelled rather than assigned invented boundaries.
7. **Visibility filtering.** Given completed, failed, and nonterminal nodes,
   when the default view opens, then all are shown. An explicit active-only
   filter means last-reported nonterminal status, not verified process liveness;
   removing the filter restores terminal nodes and their history.
8. **Truthful telemetry.** Given a quiet stream or a silent isolated Reviewer,
   when time passes, then the last-update age changes without asserting that
   the agent succeeded, failed, or is still alive. Reader state and last-reported
   agent state are separate. Published role aliases are not presented as proven
   independent processes; unverified identity kinds remain unspecified.
9. **Replay consistency.** Given the same complete records, when delivered in
   one historical batch or incrementally with repeated watcher notifications,
   then node states, intervals, counts, and activity agree. Rereading the same
   source bytes does not duplicate history; distinct equal-valued source records
   are not silently dropped as duplicates.
10. **Partial and invalid data.** Given a record split across writes, including
    within a UTF-8 character, when the final newline arrives, then it appears
    exactly once. Malformed complete records and unsupported event types produce
    diagnostics without preventing later valid records from appearing. A
    session mismatch is identified rather than silently merged.
11. **Recovery.** Given a panel reopen, editor reload, file truncation or
    replacement, or temporary read failure, when the source becomes available,
    then the view reconstructs the current selected source without duplicate
    history or leaked state from an old generation. Temporary failure preserves
    the last valid view with a stale/error label. Recovery never changes logs.
12. **Incomplete relationships.** Given an unknown parent, missing spawn,
    unmatched tool event, or cyclic relationship, when displayed, then valid
    identities remain reachable and uncertainty is visible. Rendering neither
    crashes nor invents missing agent execution or tool pairing.
13. **Snapshot honesty.** Given optional session/heartbeat metadata that is
    missing, stale, malformed, or inconsistent with the stream, when read,
    then valid JSONL remains inspectable. Snapshot information is identified as
    such; uncertain chronology cannot silently overwrite confirmed event
    history. Relative timestamps are not misrepresented as absolute dates when
    the corresponding session start is unavailable.
14. **IDE usability.** Given light, dark, or high-contrast editor themes, when
    using the graph and inspector, then labels, focus, and statuses are readable.
    Keyboard users can select nodes, inspect activity, filter, and reach Fit All;
    status is not conveyed by color alone. Resizing preserves access to both
    graph and details. Motion is restrained and respects reduced-motion settings.
15. **Read-only privacy.** Given telemetry containing markup or unexpected
    fields, when displayed, then it is treated as untrusted data, not executable
    markup, commands, or resource URLs. The extension reads only selected
    telemetry and relevant companion metadata, makes no outbound telemetry
    requests, and leaves publisher commands, logs, and snapshots unchanged.
16. **Verification and packaging.** Given the release candidate, when validated,
    then tests cover the criteria above, extension lint/type/build/test checks
    pass with at least 80% extension coverage, existing adapter tests pass, and
    the VSIX contains no private runtime logs or credentials. Installation,
    stream selection, recovery, and limitations are documented. Untested editor
    compatibility is explicitly reported as unverified, not passed.

## Existing evidence and constraints

- The publisher is [adapter.py](../../../.trae/agent-flow/adapter.py); its
  [tests](../../../.trae/agent-flow/test_adapter.py) define existing behavior.
  [Agent Flow documentation](../../agent-flow.md) defines reporting and privacy.
- Records contain session-relative `time`, `type`, `payload`, and `sessionId`.
  Event payloads use different identity fields across event types.
- Heartbeat snapshots have whole-second update timestamps, no session ID, and
  are written separately from events. They are not periodic health checks.
- Tool events have no call IDs. Concurrent calls in the same category cannot
  always be paired authoritatively. The publisher reports placeholder zero
  token cost, not measured usage.
- Cooperatively reported data cannot reconstruct missed calls or private
  Reviewer activity. This viewer adds no agent-control capability.
- Test fixtures must be synthetic. Local private logs remain ignored and must
  not be copied into the spec, fixtures, issue, or future review inputs.

## Out of scope

- Portfolio application changes or a dependency on its services.
- Changing the publisher protocol or installing automatic capture hooks.
- Cross-worktree graph aggregation, agent control, or remote/cloud monitoring.
- Chat/transcript capture, sounds, token/cost dashboards, or playback.
- Physics layouts, manual node placement, marketplace publishing.
- Invented metrics, process identities, intermediate progress, or verdicts.

## Open questions and decision record

No product choices remain from the two interview rounds. Both were accepted
in full, including the stable graph rather than a native tree.

Pending gates and engineering work:

- Gate 1 was approved by Zack on 2026-11-16.
- After Gate 1, Architect specifies the extension host/webview boundary, source
  reconciliation rules, supported API baseline, dependency choices, resource
  limits, measurable scale/latency targets, and verification approach.
- Zack approves that architecture plan before execution. Engineering limits
  that would exclude this contract's required behavior must be escalated.
- Runtime compatibility with the installed editors remains to be tested.
