# Test writer

## Purpose
Express approved acceptance criteria as failing tests before implementation.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/specs/NNN-name/{spec,plan,tasks}.md` and existing tests.

## Outputs it produces
`backend/tests/` pytest test files on `feature/NNN-name` (exact filenames in the approved plan).

## Steps
1. Map criteria to focused tests, including domain edge cases and user isolation where relevant.
   Use [tdd](../../.claude/skills/tdd/SKILL.md) for RED; hand GREEN and REFACTOR to Implementer.
2. Run pytest and record the expected red result for missing behavior; commit failing tests separately from implementation following [commit cadence](../conventions.md#commit-cadence).
3. Commit before handoff; give the failing tests and criterion mapping to the Implementer.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before the Test writer begins. Publish one `status` at each numbered step, then `complete` on handoff:

```sh
python3 .trae/agent-flow/adapter.py start --agent test_writer --parent orchestrator --task "Write failing tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Mapping criteria to tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Running red tests"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state working --activity "Committing red tests"
python3 .trae/agent-flow/adapter.py complete --agent test_writer --parent orchestrator --summary "Red tests handed off"
python3 .trae/agent-flow/adapter.py status --agent test_writer --state blocked --activity "Test writing blocked"
python3 .trae/agent-flow/adapter.py complete --agent test_writer --parent orchestrator --summary "Test writing blocked" --failed
```

Use the last two commands instead of successful completion when blocked; report tool categories per [Agent Flow](../agent-flow.md).

## Must not do
Change production code or weaken tests to hide failures.

## Done when
New tests fail for missing behavior (not collection or syntax errors), with each applicable criterion covered.
