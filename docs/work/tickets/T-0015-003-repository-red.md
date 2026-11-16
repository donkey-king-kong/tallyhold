# T-0015: Feature 003 repository RED contract

## Assignment

- Status: done
- Owner actor: R-0019/test-writer-01
- Role: Test writer
- Run: [R-0019](../runs/R-0019.md) (original RED: [R-0018](../runs/R-0018.md))
- Feature / task: [Feature 003 RED](../../specs/003-schema-repositories/tasks.md#red-after-approval-only)
- Authorization: Zack approved the schema/architecture
  [plan](../../specs/003-schema-repositories/plan.md) and
  [tasks](../../specs/003-schema-repositories/tasks.md) as written at `15d27fa`
  on 2026-11-16. RED tests only; stop for Zack's checkpoint review before GREEN.
- Dependencies: [T-0014](T-0014-plan-schema-repositories.md) approved.
- Branch / worktree: `feature/003-schema-repositories-architecture`
- Worktree path: `../tallyhold-feature-003-architecture`
- Issue / PR: issue #17; no PR requested
- Updated: 2026-11-16T08:02:01Z

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
- [x] Zack's requested case-insensitive instrument lookup test proves
  `("aapl", "nasdaq")` and `("Aapl", "NASDAQ")` find the saved
  `("AAPL", "NASDAQ")` instrument without changing stored case; it fails
  against the missing adapter and is committed/pushed separately before GREEN.

## Checkpoint

- Last completed action: committed the focused RED test only at `31a0fa6`
  with Zack's exact message and pushed it to the feature branch.
- Evidence: reviewed plan/tasks `15d27fa`, remaining planning edits `485e314`,
  approval gate `075ea6c`; `uv run pytest --collect-only -q tests/integration`
  collects; Compose-targeted `uv run pytest -q tests/integration --tb=no`
  with `TALLYHOLD_TEST_DATABASE_URL=postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test`
  returns 28 failed, 1 passed, 0 errors on `6538271`; 58 existing tests pass.
  Coordinator's independent `-x --tb=short` run fails because
  `app.modules.identity.infrastructure.repositories` is not yet present.
  On `d6c5682` plus the new test, from `backend/`:
  `TALLYHOLD_TEST_DATABASE_URL=postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test uv run pytest -q tests/integration/test_repositories.py::test_instrument_lookup_ignores_case_without_changing_stored_spelling --tb=short`
  returned 1 failed, 0 errors, naming absent
  `app.modules.instruments.infrastructure.repositories`; ruff check and
  format check on the test file passed.
- Worktree state: `31a0fa6` and checkpoint `7db7134` pushed; coordinator
  run/assignment records pending commit.
- Remaining work: none for RED; coordinator assigns GREEN under T-0016.
- Blocker / unblock action: no RED blocker; any material schema change requires
  Zack's approval.
- Next action: R-0019/coordinator assigns the Implementer for GREEN against
  pushed `31a0fa6`.
- Handoff recipient: R-0019/coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T07:41:31Z | R-0018/coordinator | Created RED-only assignment after Zack approved `15d27fa` | Commit handoff, launch Test writer; stop before GREEN |
| 2026-11-16T07:42:59Z | R-0018/coordinator | `docker compose ps db` could not connect to Docker daemon | Start Docker locally, recheck; no PostgreSQL evidence yet |
| 2026-11-16T07:44:26Z | R-0018/coordinator | Pushed approved RED assignment at `075ea6c`; Docker Desktop opened but engine socket still absent | Dispatch Test writer; PostgreSQL verification remains pending |
| 2026-11-16T07:45:09Z | R-0018/test-writer-01 | Accepted RED-only assignment on `075ea6c`, mapped approved seams and preserved existing dispatch changes | Write integration fixtures and four test groups; verify against Compose |
| 2026-11-16T07:52:46Z | R-0018/test-writer-01 | PostgreSQL 17 RED verified: 29 collected, 28 absent-003 failures, 1 cleanup pass; ruff check/format clean; 58 existing tests pass | Commit only integration tests, record SHA, stop for Zack's RED review |
| 2026-11-16T07:53:29Z | R-0018/test-writer-01 | Committed test-only RED at `6538271`; no production or migration changes | Zack review of RED checkpoint; no GREEN or push |
| 2026-11-16T07:54:24Z | R-0018/coordinator | Confirmed RED-only commit scope and independently reproduced missing identity adapter failure against PostgreSQL | Mark RED checkpoint ready; push and await Zack's review |
| 2026-11-16T07:58:34Z | R-0019/coordinator | Zack approved RED with one requested mixed-case instrument lookup test before GREEN | Reopen ticket and assign Test writer; no schema change |
| 2026-11-16T08:00:29Z | R-0019/test-writer-01 | Claimed requested RED-only lookup addition; branch synchronized, Compose PostgreSQL 17 healthy at 127.0.0.1:55432 | Add focused repository test, verify missing-adapter failure, commit test only, checkpoint separately and push |
| 2026-11-16T08:01:28Z | R-0019/test-writer-01 | Added case-insensitive lookup and original-case round-trip assertion; targeted PostgreSQL test failed solely on absent instrument adapter (1 failed, 0 errors); ruff lint/format passed | Commit only test, then checkpoint SHA separately and push branch |
| 2026-11-16T08:02:01Z | R-0019/test-writer-01 | Committed only test code as `31a0fa6` (`test: cover case-insensitive instrument lookup`) and pushed to origin | Commit and push ticket checkpoint separately; hand GREEN assignment to coordinator |
| 2026-11-16T08:02:31Z | R-0019/coordinator | Verified exact requested assertions in `31a0fa6` and pushed ticket checkpoint `7db7134` | T-0015 done; allocate GREEN T-0016 |
