# Agent Flow for Tallyhold

This repo publishes **cooperative, metadata-only** agent activity to a local
Agent Flow JSONL stream. It does not connect to or read the SC3040 workspace.

Durable assignments and pre-review checkpoints live in
[work tracking](work/README.md); post-dispatch ship checkpoints live in PR
comments. Publish live events here; the private JSONL stream is not the recovery
source or a full audit log.
Record the adapter-safe Agent Flow ID alongside the durable actor in the run
roster (for example, `R-0001/worker-01` maps to `R-0001-worker-01`; the existing
root uses `orchestrator`). The adapter accepts letters, digits, underscores and
hyphens, starting with a letter, up to 64 characters. Fresh Reviewer records
remain coordinator-owned in both systems.

## Connect

From the Tallyhold root, initialize a session once:

```bash
python3 .trae/agent-flow/adapter.py init --session-id tallyhold-run1 --task "Tallyhold work"
```

If `.agent-flow/session.json` already exists, skip `init` and publish to the
existing stream. The coordinator checks this before each ship run.

In Trae's Command Palette, run **Agent Flow: Open Agent Flow**, then select
**Connect to Running Agent** and **Watch JSONL File**. In this repository,
choose:

```text
.agent-flow/agent-flow-events.jsonl
```

On macOS, press Cmd+Shift+. in the file picker to show hidden folders.
Alternatively navigate to the repository root, then open `.agent-flow/`.
The installed Agent Flow 0.9.4 supports this JSONL connection. The
`agentVisualizer.eventLogPath` setting does not activate the watcher; select
the file in the panel. Keep the panel connected while publishing events.
If the graph is off-screen, press Shift+F (uppercase `F`) while focused on
the panel, or double-click the canvas, to fit all nodes. The review-mode reset
button restarts playback, not the camera. The extension exposes no layout or
node-style setting.
For another independent session, choose a different local `--root` directory
and watch its `agent-flow-events.jsonl`; `init` refuses to overwrite a previous
session. Do not delete or prune logs to start another session.

## Report work

The parent agent initializes the session and reports its own milestones.
`status` reactivates an agent that completed an earlier run in the same stream.
Register a child **when it actually starts**, publish transitions, and put
`tool-start` **before real work** and `tool-end` **after it finishes** (use
`--outcome failed` if it fails). Complete children and parent only after their
real work ends, while the panel is connected:

```bash
python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Coordinating work"
python3 .trae/agent-flow/adapter.py start --agent test_writer --parent orchestrator --task "Write tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Checking acceptance criteria"
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Test
# Run the tests here; do not close the tool call until the command finishes.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py complete --agent test_writer --parent orchestrator --summary "Tests written"
python3 .trae/agent-flow/adapter.py complete --agent orchestrator --summary "Work finished"
```

Use `status --state waiting` or `--state blocked` for those transitions;
`complete --failed` for failures. Tool categories are `Browser`, `Edit`,
`Read`, `Search`, `Shell`, `Test`, and `Other`. For parallel children give each
a distinct short ID. A child may report its own events; a parent may report
start and finish after receiving confirmation. A fresh Reviewer must **not**
receive this document, events, or the implementer's conversation as inputs;
the coordinator may report Reviewer lifecycle events externally.

Before dispatch, the coordinator labels the Reviewer `Reviewer active; CI
already green`. The isolated Reviewer emits no internal events while reading,
running permitted checks and writing its report, so its node may remain
`Running` without new JSONL lines. This is review work, not hidden coordinator
CI. Publish only verified dispatch and verdict transitions; never invent
intermediate review progress.

The hexagon is an **agent node** created by `agent_spawn`; it needs neither a
child nor a tool call. `tool_call_start` increments its tool count, with
`tool_call_end` closing the activity. Agent Flow calculates "alive" time while
the agent is active **in its running animation**, not from the gap between
historical JSONL timestamps. If a completed stream is ingested in one batch,
the node can remain transparent and show `0.0s` even when timestamps span
minutes; scrub Review playback to the active interval and connect before the
next live run. Never delay or fabricate events just to inflate these metrics.
Tokens stay `0k` because the adapter has no authoritative token usage and
reports no invented token cost. These display values are not a measure of
actual work done by Trae.

The JSONL contains timestamps, agent IDs, parent relationships, short
activities, broad tool categories, and outcomes. Heartbeat snapshots are in
`.agent-flow/heartbeats/`. Both paths are local and ignored by Git. Only use
generic labels: **never** pass prompts, responses, filenames containing
private data, tool arguments, file contents, environment variables, credentials,
or personal information. Redaction is a fallback, not a security guarantee.

This is *not* automatic full transcript capture. Agent Flow displays only
events an agent publishes; missed calls and earlier Trae history cannot be
reconstructed. Claude Code sessions may also appear via the extension's
native integration, independently of this adapter. The adapter does not
install extensions or alter Trae settings.

Trae documents project [PreToolUse and PostToolUse hooks](https://docs.trae.ai/ide/hook-configuration-reference)
for a defined set of tools. No hook is configured in this repo; its documented
tool list does not guarantee coverage of every tool or subagent lifecycle.
Any future hook bridge must emit metadata only and be verified in the running
Trae version before replacing cooperative reporting.

## Check

```bash
python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v
```

Check the JSONL file for new events after publishing and the Agent Flow panel
for the corresponding nodes and activity. The file is private local runtime
data; do not commit or share it.
