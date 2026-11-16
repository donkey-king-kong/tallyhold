# T-0015: Feature 003 repository RED contract

## Assignment

- Status: ready
- Owner actor: R-0018/coordinator (pending Test writer dispatch)
- Role: Test writer after dispatch
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
- Updated: 2026-11-16T07:42:59Z

## Scope

Write only `backend/tests/integration/` pytest fixtures and tests for the four
RED task groups in the approved task list: migrations, schema/constraints,
five repository ports, ordering/scoped upsert/audit. Use real Compose
PostgreSQL, prove failures are missing Feature 003 behavior, and commit RED
separately. No production code, migrations, domain edits, or GREEN work.
Preserve plan choices; escalate material schema changes to Zack.

## Acceptance

- [ ] Collecting integration tests cover AC1-AC7 and all six numbered plan
  verification items, through agreed repository and PostgreSQL seams.
- [ ] Real PostgreSQL fixture creates and cleans disposable databases, applies
  Alembic and never uses SQLite or production/developer data.
- [ ] Targeted pytest fails due to absent schema/repositories, not test
  collection, configuration, or DB connectivity; existing Feature 002 tests pass.
- [ ] RED tests committed separately and the exact failing command, counts,
  revision and next action recorded for Zack's checkpoint review.

## Checkpoint

- Last completed action: coordinator created the RED assignment and checked
  the Compose database; Docker daemon is currently unavailable.
- Evidence: reviewed plan/tasks `15d27fa`, remaining planning edits pushed
  at `485e314`, T-0014 approval checkpoint.
- Worktree state: approval/tracking edits uncommitted pending handoff commit.
- Remaining work: start local Docker, launch Test writer, write and verify RED,
  then stop for Zack.
- Blocker / unblock action: local Docker daemon unavailable; try starting
  Docker and recheck PostgreSQL. No GREEN until Zack reviews the RED checkpoint;
  any material schema change requires Zack's approval.
- Next action: commit the approval/assignment handoff, start Docker, and
  dispatch the Test writer on the clean branch.
- Handoff recipient: Test writer after verified launch.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T07:41:31Z | R-0018/coordinator | Created RED-only assignment after Zack approved `15d27fa` | Commit handoff, launch Test writer; stop before GREEN |
| 2026-11-16T07:42:59Z | R-0018/coordinator | `docker compose ps db` could not connect to Docker daemon | Start Docker locally, recheck; no PostgreSQL evidence yet |
