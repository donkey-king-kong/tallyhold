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

## Must not do
Change production code or weaken tests to hide failures.

## Done when
New tests fail for missing behavior (not collection or syntax errors), with each applicable criterion covered.
