# T-0015: Feature 003 repository RED contract

## Assignment

- Status: in_review
- Owner actor: R-0018/test-writer
- Role: Test writer
- Run: [R-0018](../runs/R-0018.md)
- Feature / task: [Feature 003 RED](../../specs/003-schema-repositories/tasks.md#red-after-approval-only)
- Authorization: Zack approved the schema/architecture
  [plan](../../specs/003-schema-repositories/plan.md) and
  [tasks](../../specs/003-schema-repositories/tasks.md) as written at `15d27fa`
  on 2026-11-16. RED tests only; stop for Zack's checkpoint review before GREEN.
- Dependencies: [T-0014](T-0014-plan-schema-repositories.md) approved.
- Branch / worktree: `feature/003-schema-repositories-architecture`
- Worktree path: `../tallyhold-feature-003-architecture`
- Issue / PR: issue #17; no PR requested
- Updated: 2026-11-16T07:53:29Z

## Scope

Write only `backend/tests/integration/` pytest fixtures and tests for the four
RED task groups in the approved task list: migrations, schema/constraints,
five repository ports, ordering/scoped upsert/audit. Use real Compose
PostgreSQL, prove failures are missing Feature 003 behavior, and commit RED
separately. No production code, migrations, domain edits, or GREEN work.
Preserve plan choices; escalate material schema changes to Zack.

## Acceptance

- [x] Collecting integration tests cover AC1-AC7 and all six numbered plan
  verification items, through agreed repository and PostgreSQL seams.
- [x] Real PostgreSQL fixture creates and cleans disposable databases, applies
  Alembic and never uses SQLite or production/developer data.
- [x] Targeted pytest fails due to absent schema/repositories, not test
  collection, configuration, or DB connectivity; existing Feature 002 tests pass.
- [x] RED tests committed separately and the exact failing command, counts,
  revision and next action recorded for Zack's checkpoint review.

## Checkpoint

- Last completed action: test-only RED committed at `6538271` after 29 cases
  collected and PostgreSQL 17 returned 28 missing-behavior failures, 1 pass.
- Evidence: reviewed plan/tasks `15d27fa`, remaining planning edits `485e314`,
  approval gate `075ea6c`; `uv run pytest --collect-only -q tests/integration`
  collects; Compose-targeted `uv run pytest -q tests/integration --tb=no`
  with `TALLYHOLD_TEST_DATABASE_URL=postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test`
  returns 28 failed, 1 passed, 0 errors on `6538271`; 58 existing tests pass.
- Worktree state: test-only commit `6538271`; coordinator run checkpoint
  remains uncommitted and untouched by Test writer.
- Remaining work: Zack reviews RED checkpoint, then coordinator assigns GREEN.
- Blocker / unblock action: none for RED; no GREEN until Zack reviews this
  checkpoint; any material schema change requires Zack's approval.
- Next action: Zack reviews `6538271` and approves or requests RED corrections;
  coordinator handles subsequent GREEN assignment. Do not push or open PR.
- Handoff recipient: Zack for RED checkpoint review.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T07:41:31Z | R-0018/coordinator | Created RED-only assignment after Zack approved `15d27fa` | Commit handoff, launch Test writer; stop before GREEN |
| 2026-11-16T07:42:59Z | R-0018/coordinator | `docker compose ps db` could not connect to Docker daemon | Start Docker locally, recheck; no PostgreSQL evidence yet |
| 2026-11-16T07:44:26Z | R-0018/coordinator | Pushed approved RED assignment at `075ea6c`; Docker Desktop opened but engine socket still absent | Dispatch Test writer; PostgreSQL verification remains pending |
| 2026-11-16T07:45:09Z | R-0018/test-writer | Accepted RED-only assignment on `075ea6c`, mapped approved seams and preserved existing dispatch changes | Write integration fixtures and four test groups; verify against Compose |
| 2026-11-16T07:52:46Z | R-0018/test-writer | PostgreSQL 17 RED verified: 29 collected, 28 absent-003 failures, 1 cleanup pass; ruff check/format clean; 58 existing tests pass | Commit only integration tests, record SHA, stop for Zack's RED review |
| 2026-11-16T07:53:29Z | R-0018/test-writer | Committed test-only RED at `6538271`; no production or migration changes | Zack review of RED checkpoint; no GREEN or push |
