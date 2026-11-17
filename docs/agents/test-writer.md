# Test writer

## Purpose
Express approved acceptance criteria as failing tests before implementation.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/specs/NNN-name/{spec,plan,tasks}.md` and existing tests.

## Durable handoff
Before work or recovery, read [work tracking](../work/README.md) and the assigned
ticket. Maintain that ticket under its checkpoint procedure in addition to the
role outputs below; return updates to the coordinator if running read-only.

## Outputs it produces
`backend/tests/` pytest test files on `feature/NNN-name` (exact filenames in
the approved plan) and `docs/specs/NNN-name/red-test-run.md`.

## Steps
1. Map criteria to focused tests, including domain edge cases and user isolation where relevant.
   Use [tdd](../../.claude/skills/tdd/SKILL.md) for RED; hand GREEN and REFACTOR to Implementer.
2. Commit the failing tests separately from implementation, then run new RED
   cases and the existing tests separately at that test commit. Exclude only
   the new RED cases from the existing-suite command. Record sanitized
   commands, counts, failure reasons, existing-suite results and criterion/plan
   verification mapping in `red-test-run.md`.
3. Commit and push the evidence with the tests following [commit cadence](../conventions.md#commit-cadence). Hand the pushed RED head to the coordinator for [independent RED review](../skills/red-review.md); on changes requested, fix in a new commit and push. Hand GREEN to the Implementer only after `APPROVE`.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the
Test writer begins. Keep every milestone `status`, and wrap each real operation
in its own tool pair. Use `Read` for local sources, `Edit` for test or checkpoint
changes, `Test` for every test, lint, or type-check command, `Shell` for git or
other commands, and `Search` for web lookups. Split a step that uses multiple
categories into multiple pairs; never publish an empty pair.

```sh
python3 .trae/agent-flow/adapter.py start --agent test_writer --parent orchestrator --task "Write failing tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Mapping criteria to tests"
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Read
# Read approved criteria, plans, tasks, the ticket, and existing tests.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Read --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Edit
# Add focused tests and their acceptance-criterion mapping.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Shell
# Commit RED tests before running checks at the pinned test revision.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Checking red and existing tests"
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Test
# Run the targeted RED test command.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Test --outcome failed
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Test
# Run the existing suite excluding only new RED cases.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Edit
# Record RED and existing-suite evidence and mapping in red-test-run.md.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Pushing RED evidence"
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Shell
# Inspect evidence changes before handoff.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent test_writer --category Shell
# Commit the evidence and push both commits before review.
python3 .trae/agent-flow/adapter.py tool-end --agent test_writer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py complete --agent test_writer --parent orchestrator --summary "Red tests handed off"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state blocked --activity "Test writing blocked"
python3 .trae/agent-flow/adapter.py complete --agent test_writer --parent orchestrator --summary "Test writing blocked" --failed
```

Repeat a pair for every additional read, edit, check, command, or web lookup.
Each distinct test, lint, or type-check invocation gets its own `Test` pair. If
an operation fails, publish its matching `tool-end` with `--outcome failed`
before continuing or using the final blocked commands. After an interruption,
close the previously started operation as failed before starting another one.
Labels remain generic metadata and never contain prompts, file contents,
credentials, or sensitive data. Use the last two commands instead of successful
completion when blocked.

## Must not do
Change production code or weaken tests to hide failures.

## Done when
New tests fail for missing behavior (not collection or syntax errors), existing tests pass, evidence is pushed, and the coordinator has the RED review handoff.
