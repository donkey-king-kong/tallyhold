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
4. For architecture or schema changes, get Zack's plan approval before execution.

## Must not do
Write feature code or plan against a Draft spec.

## Done when
Every criterion has an implementation and test path, migration needs are explicit, and required plan approval is recorded.
