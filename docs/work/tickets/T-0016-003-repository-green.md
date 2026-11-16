# T-0016: Implement Feature 003 schema and repositories

## Assignment

- Status: ready
- Owner actor: R-0019/coordinator (pending Implementer dispatch)
- Role: Implementer after dispatch
- Run: [R-0019](../runs/R-0019.md)
- Feature / task: [Feature 003 GREEN](../../specs/003-schema-repositories/tasks.md#green-after-the-red-handoff-only)
- Authorization: Zack approved [plan](../../specs/003-schema-repositories/plan.md)
  and [tasks](../../specs/003-schema-repositories/tasks.md) at `15d27fa`,
  reviewed RED at `d6c5682`, and required/passed one additional lookup RED
  test (`31a0fa6`) before GREEN. Ship requested after full verification.
- Dependencies: [T-0014](T-0014-plan-schema-repositories.md) and
  [T-0015](T-0015-003-repository-red.md) complete.
- Branch / worktree: `feature/003-schema-repositories-architecture`
- Worktree path: `../tallyhold-feature-003-architecture`
- Issue / PR: issue #17; no PR yet
- Updated: 2026-11-16T08:02:31Z

## Scope

Implement the five ordered GREEN tasks in the approved task list, one logical
commit per task: SQLAlchemy models/Alembic revision, shared/root adapters and
error translation, scoped account adapter, scoped transaction adapter, then
CI/docs/full verification. No Feature 002 domain changes, RLS, positions
tables, auth/application wiring, API or frontend feature changes. Keep RED
tests unchanged and escalate significant schema changes to Zack before coding.

## Acceptance

- [ ] All Feature 003 integration tests pass on disposable real PostgreSQL 17
  and Feature 002 tests still pass, including the mixed-case lookup addition.
- [ ] Migration upgrade/downgrade/re-upgrade and catalog/constraint/tenant
  checks cover the six approved verification items.
- [ ] Ruff lint and format, strict mypy, import-linter, pytest >=80% coverage,
  and relevant CI/frontend checks pass; no unapproved scope.
- [ ] GREEN tasks checked off, commits separated by task, branch pushed and
  handed to ship coordinator.

## Checkpoint

- Last completed action: coordinator allocated GREEN after the test-only RED
  lookup commit `31a0fa6` and ticket checkpoint `7db7134` were pushed.
- Evidence: Zack's RED approval with the requested addition, 1 focused
  PostgreSQL failure for missing instrument adapter, RED ticket T-0015.
- Worktree state: coordinator tracking edits pending handoff commit; no GREEN
  production code yet.
- Remaining work: Implementer completes five GREEN tasks and verification.
- Blocker / unblock action: none; significant schema changes require Zack's
  approval before proceeding.
- Next action: commit RED-to-GREEN handoff records and dispatch Implementer on
  the clean branch.
- Handoff recipient: Implementer after verified dispatch.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T08:02:31Z | R-0019/coordinator | Allocated GREEN-only task following Zack-approved RED addition `31a0fa6` | Commit handoff, dispatch Implementer; stop on significant schema change |
