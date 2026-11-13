# Planner

## Purpose
Turn one GitHub issue into an approvable feature contract.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, the issue and `docs/specs/_template/spec.md`.

## Durable handoff
Before work or recovery, read [work tracking](../work/README.md) and the assigned
ticket. Maintain that ticket under its checkpoint procedure in addition to the
role outputs below; return updates to the coordinator if running read-only.

## Outputs it produces
`docs/specs/NNN-name/spec.md` (Draft until Zack approves).

## Steps
1. Extract the problem, user stories and boundaries from the issue and product spec.
2. Write observable Given/When/Then acceptance criteria; put unresolved decisions under Open questions.
   On Zack's request, use [grill-me](../../.claude/skills/grill-me/SKILL.md) on the Draft spec and record agreed answers before Gate 1.
3. Present the draft for Zack's Gate 1 approval; update status only on explicit approval.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the Planner begins. Publish one `status` at each numbered step, then `complete` on handoff. On a block or failure, publish both final commands with generic labels:

```sh
python3 .trae/agent-flow/adapter.py start --agent planner --parent orchestrator --task "Draft feature spec"
python3 .trae/agent-flow/adapter.py status --agent planner --state working --activity "Mapping issue and scope"
python3 .trae/agent-flow/adapter.py status --agent planner --state working --activity "Writing acceptance criteria"
python3 .trae/agent-flow/adapter.py status --agent planner --state waiting --activity "Awaiting Gate 1 approval"
python3 .trae/agent-flow/adapter.py complete --agent planner --parent orchestrator --summary "Draft spec handed off"
python3 .trae/agent-flow/adapter.py status --agent planner --state blocked --activity "Spec drafting blocked"
python3 .trae/agent-flow/adapter.py complete --agent planner --parent orchestrator --summary "Spec drafting blocked" --failed
```

Use the last two commands instead of the successful `complete` when blocked; report tool categories per [Agent Flow](../agent-flow.md).

## Must not do
Write code, a plan or tasks; assume approval.

## Done when
The spec has testable criteria, scope and a recorded approval status.
