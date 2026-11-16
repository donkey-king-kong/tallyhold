# T-0016: Implement Feature 003 schema and repositories

## Assignment

- Status: in_progress
- Owner actor: R-0019/implementer-02
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
- Updated: 2026-11-16T08:19:00Z

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

- Last completed action: Task-one commit `1d66a5b`; root/shared adapter slice
  implemented and verified for commit.
- Evidence: mixed-case PostgreSQL instrument lookup passed; ruff, format,
  mypy and import-linter pass. Other repository tests require scoped adapters.
- Worktree state: task-two adapters and checkpoint ready for commit.
- Remaining work: commit task two, then scoped account and transaction
  adapters and final verification.
- Blocker / unblock action: catalog-test blocker resolved; significant schema
  changes still require Zack's approval before proceeding.
- Next action: commit task two, then implement scoped account adapter.
- Handoff recipient: ship coordinator after full GREEN verification.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T08:02:31Z | R-0019/coordinator | Allocated GREEN-only task following Zack-approved RED addition `31a0fa6` | Commit handoff, dispatch Implementer; stop on significant schema change |
| 2026-11-16T08:04:02Z | R-0019/implementer-01 | Claimed GREEN; clean synced `2b9fe0e`, approved spec/plan/tasks and RED tests read, Compose PostgreSQL healthy | Implement schema/migration task first |
| 2026-11-16T08:05:47Z | R-0019/implementer-01 | Task-one schema WIP; targeted PostgreSQL suite 16 passed, one invalid catalog expectation failed; independent DB reproduced PG default-action normalization (`confdeltype='a'`); WIP has two import-order lint findings | Stop without changing RED or committing incomplete schema; coordinator corrects test contract |
| 2026-11-16T08:11:01Z | R-0019/coordinator | Test writer fixed catalog assertion in `cf9f09c`; targeted real-PostgreSQL suite 17 passed, test lint/format passed | Resume task one from preserved unstaged schema WIP; no schema deviation |
| 2026-11-16T08:12:53Z | R-0019/implementer-02 | Claimed replacement assignment after confirmed predecessor stop; fixed two import-order findings in preserved task-one WIP | Verify schema and migration against corrected RED before commit |
| 2026-11-16T08:15:00Z | R-0019/implementer-02 | Verified schema on Compose PostgreSQL 17 (17/17), ruff lint/format, mypy and import-linter all passed; task one checked | Commit schema task, then root adapters |
| 2026-11-16T08:19:00Z | R-0019/implementer-02 | Committed task one `1d66a5b`; added root/shared ports and error translation; mixed-case lookup passed, lint/format/mypy/import-linter pass | Commit task two and implement scoped account adapter |
