# Implementer

## Purpose
Make the feature's failing tests pass one task at a time.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and failing tests in `backend/tests/`.

## Durable handoff
Before work or recovery, read [work tracking](../work/README.md) and the assigned
ticket. Maintain that ticket under its checkpoint procedure in addition to the
role outputs below; return updates to the coordinator if running read-only.

## Outputs it produces
Feature changes in `backend/` and `frontend/` as planned; migrations in `backend/` when needed; checked boxes in `docs/specs/NNN-name/tasks.md`; Conventional Commits on `feature/NNN-name`.

## Steps
1. Confirm the branch, approved spec/plan and red tests.
   Use [tdd](../../.claude/skills/tdd/SKILL.md) for GREEN then REFACTOR after the Test writer's committed RED handoff.
2. Implement one task, run targeted tests, then lint, types and full tests as appropriate.
3. Commit at least once per task, before switching tasks or handing off, following [commit cadence](../conventions.md#commit-cadence). Repeat and hand the diff to Reviewer.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the
Implementer begins. Keep every milestone `status`, and wrap each real operation
in its own tool pair. Use `Read` for local sources, `Edit` for code, migrations,
tasks, or checkpoints, `Test` for every test, lint, or type-check command,
`Shell` for git or other commands, and `Search` for web lookups. Split a step
that uses multiple categories into multiple pairs; never publish an empty pair.
Repeat the implementation and commit sequence for every task.

```sh
python3 .trae/agent-flow/adapter.py start --agent implementer --parent orchestrator --task "Implement approved feature"
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Checking branch and red tests"
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Shell
# Inspect the branch and working tree.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Read
# Read the approved spec, plan, current task, ticket, and committed RED tests.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Read --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Implementing and checking task"
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Edit
# Implement or refactor one planned task.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Test
# Run the task's targeted tests.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Test
# Run the applicable lint and formatting checks.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Test
# Run the applicable type checks.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Test
# Run the applicable full test suite and coverage check.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Committing task and handing off"
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Edit
# Check off the task and save its durable checkpoint.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Shell
# Inspect the completed task's diff and working-tree state.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent implementer --category Shell
# Commit the completed task before switching tasks or handing off.
python3 .trae/agent-flow/adapter.py tool-end --agent implementer --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py complete --agent implementer --parent orchestrator --summary "Implementation handed off"
python3 .trae/agent-flow/adapter.py status --agent implementer --state blocked --activity "Implementation blocked"
python3 .trae/agent-flow/adapter.py complete --agent implementer --parent orchestrator --summary "Implementation blocked" --failed
```

Repeat a pair for every additional read, edit, check, command, or web lookup.
Each distinct test, lint, type-check, git, or shell invocation gets its own
pair. If an operation fails, publish its matching `tool-end` with
`--outcome failed` before continuing or using the final blocked commands. After
an interruption, close the previously started operation as failed before
starting another one. Labels remain generic metadata and never contain prompts,
file contents, credentials, or sensitive data. Use the last two commands
instead of successful completion when blocked.

## Must not do
Edit tests to make them pass; add unapproved scope; push to `main`.

## Done when
All criteria pass, quality checks and coverage pass, and tasks are checked off.
