# T-0016: Implement Feature 003 schema and repositories

## Assignment

- Status: ready
- Owner actor: R-0019/coordinator (pending replacement Implementer)
- Role: Implementer
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
- Updated: 2026-11-16T08:11:01Z

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

- Last completed action: Test writer corrected only the invalid PostgreSQL
  catalog assertion in pushed `cf9f09c`; targeted real-PostgreSQL
  migration/isolation suite passed 17/17.
- Evidence: PostgreSQL stores explicit `ON DELETE NO ACTION` as
  `pg_constraint.confdeltype='a'`; Test writer preserved composite FK/key
  assertions. No approved schema decision changed. Ruff lint/format passed
  for the corrected test.
- Worktree state: uncommitted task-one schema files retained, unstaged;
  coordinator run/ticket checkpoints uncommitted. No adapter/CI work yet.
- Remaining work: fix two known import-order lint findings in task-one WIP,
  verify/commit it, then tasks two through five and full checks.
- Blocker / unblock action: catalog-test blocker resolved; significant schema
  changes still require Zack's approval before proceeding.
- Next action: dispatch replacement Implementer to preserve task-one WIP,
  verify against corrected RED and commit task one when checks pass.
- Handoff recipient: replacement Implementer after confirmed dispatch.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T08:02:31Z | R-0019/coordinator | Allocated GREEN-only task following Zack-approved RED addition `31a0fa6` | Commit handoff, dispatch Implementer; stop on significant schema change |
| 2026-11-16T08:04:02Z | R-0019/implementer-01 | Claimed GREEN; clean synced `2b9fe0e`, approved spec/plan/tasks and RED tests read, Compose PostgreSQL healthy | Implement schema/migration task first |
| 2026-11-16T08:05:47Z | R-0019/implementer-01 | Task-one schema WIP; targeted PostgreSQL suite 16 passed, one invalid catalog expectation failed; independent DB reproduced PG default-action normalization (`confdeltype='a'`); WIP has two import-order lint findings | Stop without changing RED or committing incomplete schema; coordinator corrects test contract |
| 2026-11-16T08:11:01Z | R-0019/coordinator | Test writer fixed catalog assertion in `cf9f09c`; targeted real-PostgreSQL suite 17 passed, test lint/format passed | Resume task one from preserved unstaged schema WIP; no schema deviation |
