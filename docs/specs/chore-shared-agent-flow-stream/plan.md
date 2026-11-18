# Shared Agent Flow stream plan

## Status and approvals

[Spec](spec.md) approved at Gate 1 by Zack on 2026-11-18 (`96aa563`).
This plan is **awaiting Zack's approval before RED**. No tests, adapter code,
or workflow changes are authorized by this plan alone. No paid provider action
is planned.

## Approach

Keep the CLI and existing role/ship start, status, tool, and complete examples
unchanged. Resolve the stream root and source worktree once at CLI startup;
pass that context to `Store`. Resolve every agent and parent ID at the Store
boundary so direct Store calls and CLI calls behave consistently. Retain the
current non-Git behavior, including its default root and bare IDs.

1. **Root and source:** If `--root` is supplied, use it verbatim for storage,
   but still derive attribution from the invoking checkout. Otherwise run
   `git rev-parse --show-toplevel` and
   `git rev-parse --path-format=absolute --git-common-dir` from the invoking
   working directory (including subdirectories). For this non-bare worktree
   repo, resolve the common `.git` directory's parent as the main checkout,
   and store in its `.agent-flow/`. Resolve symlinks; do not derive the root
   from the adapter file's worktree. On `git` failure/outside a checkout,
   fall back to the existing script-relative `ROOT`, with no namespace.
   Check non-bare/common-dir shape rather than silently selecting a wrong
   checkout; `--root` remains the escape hatch for an unusual layout.
2. **Slug:** Use `git symbolic-ref --quiet --short HEAD` from the invoking
   worktree; detached HEAD uses that worktree's directory name. Lowercase
   ASCII, replace runs outside `[a-z0-9_-]` with `-`, strip leading/trailing
   separators, and use `worktree` if empty. The exact branch `main` yields
   slug `main`. Every other slug is at most 24 characters:
   up to 15 normalized characters, `-`, and the first eight hex characters
   of SHA-256 of the **raw branch name**; for detached HEAD hash the canonical
   worktree path (the display stem still comes from its directory name).
   Hash even short names so `feature/a.b`, `feature/a-b`, case variants,
   normalization collisions, and long-name truncations retain distinct IDs.
   Do not put an absolute path in the JSONL; only the derived slug.
3. **Namespace:** Define `root_id = "wt-" + slug` (maximum 27 characters).
   Bare `orchestrator` resolves to `root_id`, including from `main`; the
   shared literal `orchestrator` is reserved for internal session creation.
   All other bare IDs become `root_id + "-" + agent_id`. Validate input
   identifiers first. For a combined ID longer than 64, retain the available
   leading agent characters plus `-` and eight SHA-256 hex characters of the
   original agent ID. An ID equal to `root_id` or starting with
   `root_id + "-"` is already resolved and must remain unchanged. Apply this
   same resolver to explicit and default parents on start/complete, agent
   fields on status/tools/complete, and heartbeat filenames and parent IDs.
   Preserve the existing single shared `orchestrator` as the real main node.
4. **Registration:** Under the shared stream lock, before a worktree's first
   regular event, check the existing JSONL for `agent_spawn` of `root_id`.
   If absent, append its `subagent_dispatch` and `agent_spawn` beneath the
   shared `orchestrator` and write its namespaced starting heartbeat. Scanning
   the log under the lock recognizes manually prefixed existing nodes and
   avoids a second registration; no unchecked sidecar marker can get ahead of
   an append. Subsequent `init` calls may register their own worktree root,
   but must never touch the shared orchestrator's heartbeat or re-spawn it.
   `status --agent orchestrator` acts on the worktree root and reactivates
   only that node, using its namespaced heartbeat and parent relationship.
5. **Session and writes:** Use one persistent lock file in the chosen root
   with POSIX `fcntl.flock(LOCK_EX)`. Hold it across the existence check,
   atomic `session.json` creation (temp file and `os.replace`), session
   initialization event, registration check/append, heartbeat read/write,
   and every event append. If a session exists, `init` ignores a different
   requested ID, returns success and keeps both session bytes and prior log
   bytes unchanged except for any missing worktree-root registration. If a
   log exists without a valid session, fail closed without replacing it.
   Exactly the first initializer creates the session and shared orchestrator
   heartbeat/spawn. Serialize a fully encoded UTF-8 JSON line under the same
   lock with `O_APPEND|O_CREAT` and a write-all loop (handle short writes);
   never rewrite or truncate the log. Emit events before releasing the lock
   so simultaneous processes cannot interleave lines or race registration.
   Close descriptors and release the lock on failure. Keep the existing
   atomic heartbeat JSON replacement, now serialized with event operations.
6. **Attribution:** Add `sourceWorktree: slug` to every new event payload,
   including the initial shared `orchestrator` spawn and each worktree root's
   dispatch/spawn. Keep the existing event types, session ID, time, labels,
   redaction, and metadata-only policy. Existing log records are not rewritten.

## Files and layers

| Path | Responsibility |
| --- | --- |
| `.trae/agent-flow/adapter.py` | CLI context resolution; private slug/ID helpers; Store locking, idempotent init/root registration, heartbeat and append semantics. Local tooling, not application layers. |
| `.trae/agent-flow/test_adapter.py` | Unit and subprocess/multiprocess contract tests below, using temporary Git repositories/worktrees and synthetic paths. |
| `docs/agent-flow.md` | Shared default location/watch path, worktree attribution, single-session init/reuse, explicit-root and non-Git behavior; remove per-worktree stream advice. |
| `docs/skills/ship.md` | Replace the worktree-local session-file guard with safe unconditional shared `init` (or a shared-root guard plus `init`); keep bare role commands untouched. |
| `docs/work/README.md`, `docs/workflow.md`, `AGENTS.md` | During implementation, reconcile any remaining claims of one isolated JSONL session per worktree; keep durable work tracking worktree-local and reviewer isolation unchanged. |

No application module, external interface, class hierarchy, database schema,
Alembic migration, CI workflow, or constitution edit is needed. No ADR is
needed for this local-tooling design; this plan records the concurrency and
identity choices for Zack's approval.

## Verification

Add the following named tests to `.trae/agent-flow/test_adapter.py` **after
plan approval**. Use a temporary main checkout and two linked worktrees,
invoke the actual CLI from each working directory, and use multiple processes
for races (not threads sharing a process). Preserve and update existing
single-root tests for the outside-Git compatibility path.

| Criterion | Design and target tests |
| --- | --- |
| 1 | Common-dir default, explicit override and outside-Git fallback: `test_shared_default_root_from_main_and_linked_worktrees`, `test_explicit_root_wins`, `test_outside_git_keeps_legacy_root_and_ids`. Include invocation from a nested worktree directory. |
| 2 | Root registration once and uniform parent/agent mapping: `test_bare_roles_and_ship_review_rounds_are_isolated`, `test_default_and_explicit_parents_resolve_consistently`. Assert start/status/tool/complete payload references and hierarchy from two worktrees. |
| 3 | Branch/detached slug and 64-character valid IDs with distinct hashes: `test_slug_branch_and_detached_head`, `test_normalization_collisions_and_long_names_remain_distinct`. Exercise same normalized spelling, long branch/role IDs, and invalid input. |
| 4 | Payload attribution for all events: `test_every_payload_has_source_worktree`, including first init spawn, registrations, and same bare ID from two sources. |
| 5 | One session, preserved log and idempotent init: `test_init_reuses_existing_session_without_rewriting`, `test_concurrent_init_creates_exactly_one_session`, `test_orphan_log_is_not_overwritten`. Assert common session ID across later events and only one shared orchestrator spawn. |
| 6 | Complete JSONL under simultaneous writers: `test_concurrent_process_appends_are_complete_and_unique`. Tag events with distinct generic labels; parse every line, assert exact event count/unique labels with no partial line. |
| 7 | Documentation and CLI contract: `test_documented_commands_share_one_stream` exercises unchanged ship/role command forms and shared watch path; additionally review `docs/agent-flow.md`, `docs/skills/ship.md`, and a path hygiene diff (only synthetic fixture paths may be committed). |
| 8 | Main is namespaced too: `test_main_orchestrator_maps_to_wt_main`, asserting only init touches the literal shared orchestrator, while start/status/tool/complete target `wt-main`. |
| 9 | Exact-root and already-prefixed IDs: `test_prefixed_ids_and_parents_are_idempotent`, including a hand-prefixed existing root, nested role ID, and another worktree's different namespace. |
| 10 | Silent reuse and namespaced heartbeat reactivation: `test_reused_init_does_not_reactivate_shared_orchestrator`, `test_status_reactivates_only_namespaced_heartbeat`. Compare shared heartbeat/session bytes and counts of orchestrator spawn/status events before/after reuse. |

Run `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`,
`git diff --check`, and the applicable repository CI checks after GREEN.
RED must fail for missing behavior and leave existing tests passing. Do not
claim execution or coverage at the planning stage.

## Decisions and open questions

- The stream and its lock, heartbeats and session are local, ignored runtime
  data. There is no remote service or cost-bearing action.
- Hash suffixes are short, deterministic disambiguators, not a mathematical
  guarantee against SHA-256-prefix collision; tests cover the specified
  similarly normalized and long-name examples.
- Zack's explicit plan approval is the next gate. Only then begin RED, fresh
  independent RED review, GREEN, and eventual ship on separate assignments.
