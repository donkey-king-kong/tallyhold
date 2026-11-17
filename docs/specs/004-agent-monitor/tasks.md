# 004: Local agent monitor tasks

## Approval gate

The [approved spec](spec.md) has Gate 1 approval. Zack approved the
[architecture plan](plan.md) as written at `64a4246` on 2026-11-17. RED may
begin after its public test interfaces are confirmed; GREEN still requires
independent RED approval. Track B owns only `T-0050..T-0059` and
`R-0050..R-0059`; allocate the next free IDs on this branch after synchronizing,
and create tickets before assigning the later roles. Do not pre-claim or reuse
IDs. Shared tracking indexes are coordinator-only and are outside this
planning handoff. Each implementation task below is a distinct logical commit
after the appropriate RED handoff and review, not a single bulk implementation.

- [x] **Architect, [T-0050](../../work/tickets/T-0050-plan-agent-monitor.md):**
  Map AC1-AC16, document the source/host/UI boundaries, limits, compatibility
  and verification; submit plan and tasks for Zack's approval. Planning
  artifacts only.
- [x] **Zack plan gate:** Approved the explicit choices in
  [plan "Decision requested from Zack"](plan.md#decision-requested-from-zack),
  especially the file/identity model, API baseline and support envelope.
  Record approval or requested changes before dispatching RED.

## RED: Only after plan approval

Assign the Test writer through [T-0051](../../work/tickets/T-0051-agent-monitor-red.md)
after confirming the public test interfaces. Use synthetic fixtures only.
Each checkbox is a small behavior-focused test commit; first show that existing
adapter tests still pass, then confirm new tests collect and fail for missing
extension behavior rather than environment/setup errors. Commit and push the
RED evidence; follow the independent fresh RED review before GREEN.

- [x] **Parser and replay RED:** Test complete and incremental delivery of
  identical bytes, split UTF-8 character and newline, repeated notifications,
  equal-valued distinct records, malformed/unsupported records, nonfinite
  relative times and mixed session IDs. Assert later valid records survive and
  counts/history match; AC3, AC9-AC10, AC13.
- [x] **Projection RED:** Cover parent/child graph, delayed parent, missing
  spawn, cycles, terminal/default visibility, explicit nonterminal filter,
  failed tool vs agent failure, ambiguous concurrent tool pairs, historical
  activity, same-session reactivation and cross-session same-name isolation.
  Assert incomplete interval and identity-kind labels, status/age honesty and
  snapshot conflicts and historical age without a verified session start;
  AC3, AC5-AC8, AC12-AC13.
- [x] **Source lifecycle RED:** Mock file append, unchanged notifications,
  same-size replacement, truncation, disappearance, temporary failure,
  recovery, rapid stream switching, panel disposal and reload. Verify
  selection generation cancels old async results, the stale view survives
  failure, and neither JSONL nor metadata is written; AC2, AC9, AC11, AC15.
- [x] **Graph and UI RED:** Verify immutable coordinates, preserved camera,
  initial/explicit Fit All, pan/zoom, keyboard node selection and navigator,
  inspector chronology, active-only toggle/reveal, focus on updates,
  light/dark/high-contrast tokens, narrow layout and reduced motion. Include
  empty/error/stale states and hostile text/URI injection; AC2-AC5, AC7-AC8,
  AC12, AC14-AC15.
- [x] **Host/package RED:** Test command registration, picker/source policy,
  validated bounded message protocol, CSP/local-resource restrictions,
  64 MiB/100k/2k/1 MiB boundary errors, package allowlist and no outbound
  requests. Define repeatable synthetic latency fixtures and two-editor
  smoke checklist; AC1-AC2, AC11, AC15-AC16.
- [x] **RED checkpoint and review:** Record test command/revision and expected
  failures, run unaffected publisher adapter tests, push the RED commit and
  obtain independent `APPROVE` per `docs/skills/red-review.md`. A failing
  environment or unresolved review is not permission for GREEN; AC1-AC16.

## GREEN: Only after independent RED approval

Assign the Implementer a different Track B ticket. Implement against the
approved tests, commit each behavior slice separately, and do not edit tests
to force a pass. The same public host/core/UI boundaries in the plan apply
throughout.

- [ ] **Extension shell and protocol:** Create the independent extension
  package, activation command, webview lifecycle, local bundle and typed,
  bounded host/webview messages. Verify command and restricted CSP tests;
  AC1, AC15-AC16.
- [ ] **Byte reader and reconciliation:** Implement source selection,
  incremental decoder, offset/generation checks, watcher plus fallback
  reconcile, stale/recovery semantics and session diagnostics. Verify parser,
  lifecycle and no-write tests; AC2-AC3, AC9-AC11, AC13, AC15.
- [ ] **Pure activity projection:** Implement statuses, intervals, reactivation,
  advisory metadata, ambiguous tools, orphan/cycle handling, chronological
  history and counts. Verify batch/incremental equivalence and projection
  tests; AC3, AC5-AC9, AC12-AC13.
- [ ] **Stable graph and inspection:** Implement persistent coordinates,
  parent edges, camera and Fit All, default/all and last-reported filter,
  inspector, clock and accessible keyboard node navigator. Verify layout,
  focus, theme and responsive tests; AC3-AC8, AC12, AC14.
- [ ] **Host integration and hardening:** Wire local selection, read failure,
  reload/disposal, limits, diagnostics and untrusted-workspace policy into
  the panel. Reject hostile telemetry and stale/invalid messages. Verify
  recovery, privacy and envelope behavior end-to-end; AC2, AC10-AC11,
  AC13-AC15.
- [ ] **Package, documentation and measured verification:** Document
  install/selection/recovery/limits; run extension lint, format check,
  typecheck, build, tests with >=80% extension coverage, dependency audit
  and publisher adapter tests. Measure representative ingest/update and
  64 MiB behavior with hardware recorded. Audit VSIX file list for private
  logs/credentials; AC1, AC15-AC16.
- [ ] **Actual editor smoke and compatibility report:** Install the built
  VSIX in recorded installed VS Code and Trae versions. On synthetic files
  check command, complete history, live append, failure, reactivation,
  switch, reload and read-error recovery; exercise keyboard/three themes
  and narrow panel where available. Mark unavailable or failing editor
  versions **unverified**, never passed. Return to Zack if the chosen API
  floor/support envelope cannot be met; AC1-AC16.

## Delivery gate

- [ ] **Coordinator:** Only on a later explicit shipping request, create a
  Track B ship ticket and use the full `ship` procedure: checks, fresh
  reviewer rounds and merge gate. Coordinate any `.github/workflows/ci.yml`
  change with Track C, and reconcile shared indexes without overwriting
  other tracks. Do not treat this planning handoff as a PR or merge request.
