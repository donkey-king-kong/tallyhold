# Shared Agent Flow stream across worktrees

## Status

Draft. Zack's Gate 1 approval is required before planning, tests, or adapter
implementation.

## Problem

Each worktree currently publishes to its own git-ignored `.agent-flow/`
directory. Zack wants to watch one shared stream. A documentation-only change
is insufficient: [ship](../../skills/ship.md) and the
[role instructions](../../agents/) use bare IDs such as `orchestrator`,
`implementer`, and `reviewer_round_<R>` without `--root`. Pointing those
unchanged commands at one log would merge unrelated worktree nodes in the
viewer. PR #45 was closed without merging for this reason. Related: #38;
this chore does not change the Agent Monitor follow-up in #44.

## User stories

- As Zack, I want every worktree's activity in one JSONL stream so I can
  watch parallel tracks through one connection.
- As a role agent, I want the commands already documented in ship and role
  instructions to keep working unchanged while my events remain attributable
  to my worktree.
- As a coordinator, I want concurrent session starts and event publishing to
  preserve all existing events without duplicate or corrupted nodes.

## Acceptance criteria

1. Given the adapter runs from the main checkout or any linked worktree, when
   no `--root` is supplied, then all commands use the main checkout's
   `.agent-flow/` as their default root. Given an explicit `--root`, that root
   wins. Given execution outside Git, the adapter retains its current default
   behavior.
2. Given distinct worktrees use the unchanged commands in
   `docs/skills/ship.md` and `docs/agents/*.md`, when they publish events with
   bare agent IDs and parent IDs, then each worktree's agents appear as
   distinct nodes under its own automatically registered root node. The bare
   `orchestrator` maps to `wt-<slug>` for that worktree; that node is registered
   once under the real shared `orchestrator`. Explicit and default parent
   relationships, including the ship review-round IDs, resolve to the same
   worktree namespace across start, status, tool, and complete events.
3. Given an attached branch, when the adapter derives the source slug, then
   the slug identifies that branch. Given detached HEAD, it falls back to the
   worktree directory name. In either case, normalized and prefixed IDs start
   with a letter, contain only adapter-valid characters, are at most 64
   characters, and remain stable and distinct even for long or similarly
   normalized names by truncating and appending a short hash. Tests include
   distinct branches with the same normalized spelling and long names.
4. Given any event is emitted, when its JSONL record is read, then its payload
   carries the source worktree slug, including shared-root registration and
   session initialization events. Two worktrees publishing the same bare role
   ID are distinguishable by both node ID and source slug.
5. Given a shared session already exists, when any worktree runs `init`,
   including with a different requested session ID, then initialization
   succeeds and reuses the existing session ID without modifying its session
   or earlier log records. Given two worktrees initialize concurrently with
   no session, both succeed, exactly one session is created, and subsequent
   events use that same session ID. A new session does not replace or truncate
   a pre-existing log. The per-run session creation in
   `docs/skills/ship.md` is removed or reconciled with this behavior.
6. Given multiple worktrees append events at the same time, when the shared
   log is read line by line, then every emitted event appears exactly once as
   a complete, parseable JSON record; no records interleave or corrupt one
   another.
7. Given this change is delivered, when an agent follows
   `docs/agent-flow.md`, then it finds the shared default root, single stream,
   automatic worktree attribution, and safe initialization instructions.
   Existing start/status/tool/complete command examples in other role
   documents need no rewrites. Adapter behavior and concurrent cases are
   covered by `.trae/agent-flow/test_adapter.py`; committed files contain no
   absolute or personal paths, except synthetic paths in test fixtures.

## Out of scope

- Feature 004, installation of its VSIX, and the third-party Agent Flow viewer.
- New event types, transcript capture, or changes to application modules.
- Plans, code, and tests before Zack approves this Draft at Gate 1.

## Open questions

- None required for Gate 1; the subsequent plan selects the concurrency and
  identity mechanics while preserving the observable criteria above.
