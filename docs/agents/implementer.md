# Implementer

## Purpose
Make the feature's failing tests pass one task at a time.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and failing tests in `backend/tests/`.

## Outputs it produces
Feature changes in `backend/` and `frontend/` as planned; migrations in `backend/` when needed; checked boxes in `docs/specs/NNN-name/tasks.md`; Conventional Commits on `feature/NNN-name`.

## Steps
1. Confirm the branch, approved spec/plan and red tests.
   Use [tdd](../../.claude/skills/tdd/SKILL.md) for GREEN then REFACTOR after the Test writer's committed RED handoff.
2. Implement one task, run targeted tests, then lint, types and full tests as appropriate.
3. Commit at least once per task, before switching tasks or handing off, following [commit cadence](../conventions.md#commit-cadence). Repeat and hand the diff to Reviewer.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the Implementer begins. Publish `status` at each numbered step, repeating the implementation and commit events for every task:

```sh
python3 .trae/agent-flow/adapter.py start --agent implementer --parent orchestrator --task "Implement approved feature"
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Checking branch and red tests"
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Implementing and checking task"
python3 .trae/agent-flow/adapter.py status --agent implementer --state working --activity "Committing task and handing off"
python3 .trae/agent-flow/adapter.py complete --agent implementer --parent orchestrator --summary "Implementation handed off"
python3 .trae/agent-flow/adapter.py status --agent implementer --state blocked --activity "Implementation blocked"
python3 .trae/agent-flow/adapter.py complete --agent implementer --parent orchestrator --summary "Implementation blocked" --failed
```

Use the last two commands instead of successful completion when blocked; report tool categories per [Agent Flow](../agent-flow.md).

## Must not do
Edit tests to make them pass; add unapproved scope; push to `main`.

## Done when
All criteria pass, quality checks and coverage pass, and tasks are checked off.
