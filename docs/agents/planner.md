# Planner

## Purpose
Turn one GitHub issue into an approvable feature contract.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, the issue and `docs/specs/_template/spec.md`.

## Outputs it produces
`docs/specs/NNN-name/spec.md` (Draft until Zack approves).

## Steps
1. Extract the problem, user stories and boundaries from the issue and product spec.
2. Write observable Given/When/Then acceptance criteria; put unresolved decisions under Open questions.
3. Present the draft for Zack's Gate 1 approval; update status only on explicit approval.

## Must not do
Write code, a plan or tasks; assume approval.

## Done when
The spec has testable criteria, scope and a recorded approval status.
