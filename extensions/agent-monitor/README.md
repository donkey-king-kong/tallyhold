# Tallyhold Agent Monitor

Read-only VS Code/Trae extension for inspecting one local Tallyhold Agent Flow
JSONL stream at a time. It reconstructs reported identities, activity,
relationships and tool outcomes without changing the publisher or its files.

## Install

1. Build the package with `npm ci && npm run package`.
2. In VS Code or Trae, open **Extensions: Install from VSIX...**.
3. Select `tallyhold-agent-monitor-0.1.0.vsix`.
4. Run **Tallyhold Agent Monitor: Open** from the Command Palette.

The candidate API floor is VS Code `1.80.0`. Compatibility is established only
for editor/version combinations listed in
[`docs/verification.md`](docs/verification.md).

## Select A Stream

Choose a local `.jsonl` file when the panel opens. For a Tallyhold worktree,
select:

```text
.agent-flow/agent-flow-events.jsonl
```

Use **Choose Source** in the panel to replace the selected stream. A switch
creates a new source generation, so identities and events from the previous
file are not merged into the new view.

The header reports the selected path, session ID and reader state separately.
The default view includes terminal identities. **Last reported nonterminal**
filters by published status only and does not claim that a process is alive.

## Inspect And Navigate

- Use the navigator to search and select a reported identity.
- Use **Zoom in**, **Zoom out**, the four directional pan controls and
  **Fit All** to navigate the graph.
- The inspector reports task, status, relationship certainty, intervals and
  chronological activity with reported relative times when available.
- Valid sibling heartbeat observations appear separately as provisional
  companions and never overwrite event history.
- Failed tool outcomes remain distinct from agent status.
- All controls are keyboard accessible and use editor theme tokens.

## Failure And Recovery

The extension rereads the selected file while the panel is open. Temporary read
failures preserve the last valid graph and mark it stale. Restore the file or
its permissions to recover, or use **Choose Source** to select another stream.
Truncation and replacement reconstruct a fresh file generation without writing
to the source.

Limit errors are explicit and leave the last valid view available:

- 64 MiB selected file
- 100,000 complete records
- 2,000 reported identities
- 1 MiB per line

## Privacy And Limitations

- Local read-only access; no network requests or publisher mutations.
- One selected stream at a time. Multi-worktree aggregation is tracked
  separately in issue #38.
- Companion `session.json` and heartbeat files are advisory and cannot
  overwrite event history.
- Agent activity is cooperative telemetry. Missing reports, process liveness,
  independence and unreported work cannot be inferred.
- Tool events have no call IDs, so concurrent pairing may be labelled
  ambiguous.
- Editor behaviors not completed in the compatibility checklist remain
  explicitly unverified.

## Development

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:coverage
npm run benchmark
npm run package
```
