# Implementer

## Purpose
Make the feature's failing tests pass one task at a time.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and failing tests in `backend/tests/`.

## Outputs it produces
Feature changes in `backend/` and `frontend/` as planned; migrations in `backend/` when needed; checked boxes in `docs/specs/NNN-name/tasks.md`; Conventional Commits on `feature/NNN-name`.

## Steps
1. Confirm the branch, approved spec/plan and red tests.
2. Implement one task, run targeted tests, then lint, types and full tests as appropriate.
3. Commit the task; repeat and hand the diff to Reviewer.

## Must not do
Edit tests to make them pass; add unapproved scope; push to `main`.

## Done when
All criteria pass, quality checks and coverage pass, and tasks are checked off.
