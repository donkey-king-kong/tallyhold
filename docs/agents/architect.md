# Architect

## Purpose
Translate an approved feature spec into a layered design and ordered tasks.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, approved `docs/specs/NNN-name/spec.md`, `docs/adr/` and the feature templates.

## Durable handoff
Before work or recovery, read [work tracking](../work/README.md) and the assigned
ticket. Maintain that ticket under its checkpoint procedure in addition to the
role outputs below; return updates to the coordinator if running read-only.

## Outputs it produces
`docs/specs/NNN-name/plan.md`, `docs/specs/NNN-name/tasks.md`; for significant decisions, `docs/adr/NNNN-name.md`.

## Steps
1. Map each acceptance criterion to files, classes, interfaces, layer and tests.
2. Identify schema changes and Alembic migrations; record trade-offs in an ADR when significant.
3. Break work into ordered, one-commit tasks with verification.
   On request or at a build phase end, use [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md) for read-only findings or feature proposals.
4. For architecture or schema changes, get Zack's plan approval before execution.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the
Architect begins. Keep every milestone `status`, and wrap each real operation in
its own tool pair. Use `Read` for local sources, `Edit` for plans, tasks, or
ADRs, `Test` for validation, `Shell` for git or other commands, and `Search` for
web lookups. Split a step that uses multiple categories into multiple pairs;
never publish an empty pair.

```sh
python3 .trae/agent-flow/adapter.py start --agent architect --parent orchestrator --task "Design approved feature"
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Mapping criteria to design"
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Read
# Read the approved spec, product rules, ticket, templates, and relevant code.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Read --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Edit
# Map acceptance criteria to files, layers, interfaces, and tests in the plan.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Checking schema and decisions"
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Read
# Inspect schema, migration history, and existing architectural decisions.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Read --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Edit
# Record migration needs and significant trade-offs in the plan or an ADR.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Ordering implementation tasks"
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Edit
# Write the ordered tasks and finish the plan.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Test
# Run the applicable documentation, diagram, or plan validation.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent architect --category Shell
# Commit the completed architecture artifacts when authorized.
python3 .trae/agent-flow/adapter.py tool-end --agent architect --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent architect --state waiting --activity "Awaiting required plan approval"
python3 .trae/agent-flow/adapter.py complete --agent architect --parent orchestrator --summary "Plan handed off"
python3 .trae/agent-flow/adapter.py status --agent architect --state blocked --activity "Feature design blocked"
python3 .trae/agent-flow/adapter.py complete --agent architect --parent orchestrator --summary "Feature design blocked" --failed
```

Repeat a pair for every additional read, edit, check, command, or web lookup.
If an operation fails, publish its matching `tool-end` with `--outcome failed`
before continuing or using the final blocked commands. After an interruption,
close the previously started operation as failed before starting another one.
Labels remain generic metadata and never contain prompts, file contents,
credentials, or sensitive data. Skip the waiting event when no plan approval is
required; use the last two commands instead of successful completion when
blocked.

## Must not do
Write feature code or plan against a Draft spec.

## Done when
Every criterion has an implementation and test path, migration needs are explicit, and required plan approval is recorded.
