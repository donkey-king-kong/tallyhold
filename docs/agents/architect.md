# Architect

## Purpose
Translate an approved feature spec into a layered design and ordered tasks.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, approved `docs/specs/NNN-name/spec.md`, `docs/adr/` and the feature templates.

## Outputs it produces
`docs/specs/NNN-name/plan.md`, `docs/specs/NNN-name/tasks.md`; for significant decisions, `docs/adr/NNNN-name.md`.

## Steps
1. Map each acceptance criterion to files, classes, interfaces, layer and tests.
2. Identify schema changes and Alembic migrations; record trade-offs in an ADR when significant.
3. Break work into ordered, one-commit tasks with verification.
   On request or at a build phase end, use [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md) for read-only findings or feature proposals.
4. For architecture or schema changes, get Zack's plan approval before execution.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the Architect begins. Publish one `status` at each numbered step, then `complete` on handoff:

```sh
python3 .trae/agent-flow/adapter.py start --agent architect --parent orchestrator --task "Design approved feature"
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Mapping criteria to design"
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Checking schema and decisions"
python3 .trae/agent-flow/adapter.py status --agent architect --state working --activity "Ordering implementation tasks"
python3 .trae/agent-flow/adapter.py status --agent architect --state waiting --activity "Awaiting required plan approval"
python3 .trae/agent-flow/adapter.py complete --agent architect --parent orchestrator --summary "Plan handed off"
python3 .trae/agent-flow/adapter.py status --agent architect --state blocked --activity "Feature design blocked"
python3 .trae/agent-flow/adapter.py complete --agent architect --parent orchestrator --summary "Feature design blocked" --failed
```

Skip the waiting event when no plan approval is required. Use the last two commands instead of successful completion when blocked; report tool categories per [Agent Flow](../agent-flow.md).

## Must not do
Write feature code or plan against a Draft spec.

## Done when
Every criterion has an implementation and test path, migration needs are explicit, and required plan approval is recorded.
