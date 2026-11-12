# Agent Flow for Tallyhold

This repo publishes **cooperative, metadata-only** agent activity to a local
Agent Flow JSONL stream. It does not connect to or read the SC3040 workspace.

## Connect

From the Tallyhold root, initialize a session once:

```bash
python3 .trae/agent-flow/adapter.py init --session-id tallyhold-run1 --task "Tallyhold work"
```

If `.agent-flow/session.json` already exists (as it does after this machine's
setup), skip `init` and publish to the existing stream.

In Trae's Command Palette, run **Agent Flow: Open Agent Flow**, then select
**Connect to Running Agent** and **Watch JSONL File**. Choose:

```text
/Users/bytedance/Desktop/tallyhold/.agent-flow/agent-flow-events.jsonl
```

The installed Agent Flow 0.9.4 supports this JSONL connection. The
`agentVisualizer.eventLogPath` setting does not activate the watcher; select
the file in the panel. Keep the panel connected while publishing events.
For another independent session, choose a different local `--root` directory
and watch its `agent-flow-events.jsonl`; `init` refuses to overwrite a previous
session. Do not delete or prune logs to start another session.

## Report work

The parent agent initializes the session and reports its own milestones.
Register a child **when it actually starts**, then publish transitions and
broad tool activity; complete both child and parent when they finish:

```bash
python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Coordinating work"
python3 .trae/agent-flow/adapter.py start --agent test_writer --parent orchestrator --task "Write tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Checking acceptance criteria"
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Test
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

## Check

```bash
python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v
```

Check the JSONL file for new events after publishing and the Agent Flow panel
for the corresponding nodes and activity. The file is private local runtime
data; do not commit or share it.
