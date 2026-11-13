# T-0011: Draft schema and repositories spec

## Assignment

- Status: done
- Owner actor: R-0012/coordinator
- Role: Planner
- Run: [R-0012](../runs/R-0012.md)
- Feature / task:
  [003 Draft spec](../../specs/003-schema-repositories/spec.md)
- Authorization: Zack approved Gate 1 as drafted and deferred PostgreSQL RLS to
  the authentication and accounts phase on 2026-11-13.
- Dependencies: Feature 002 spec approval and merge; issue
  [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)
- Branch / worktree: `feature/003-schema-repositories`
- Worktree path: `../tallyhold-feature-003`
- Issue / PR: issue #17; no PR requested
- Updated: 2026-11-13T08:20:19Z

## Scope

Draft the persistence feature contract requested in issue #17. Cover Alembic
migrations for Feature 002 entities, SQLAlchemy implementations of domain
repository interfaces, and pytest repository tests against real PostgreSQL via
Docker Compose. Exclude application services, APIs, and frontend work. Commit
and push, then stop at Gate 1 without architecture or implementation.

## Acceptance

- [x] Issue #17 has the requested title, `feature` label, scope, dependency,
  and assignee.
- [x] Draft spec covers migrations, repositories, user scoping, and real
  PostgreSQL repository tests.
- [x] Acceptance criteria are observable Given/When/Then statements.
- [x] Feature 002 approval and merge are explicit prerequisites.
- [x] Draft spec and recovery records are checked, committed, and pushed.
- [x] Handoff stops at Gate 1 without planning or implementation.
- [x] Gate 1 approval and the RLS deferral are recorded.

## Checkpoint

- Last completed action: validated the approved status, RLS deferral, dependency
  boundary, tracking links, and whitespace.
- Evidence: `docs/specs/003-schema-repositories/spec.md` is Approved and retains
  repository-level user scoping while listing RLS as out of scope.
- Worktree state: uncommitted approval and tracking updates.
- Remaining work: commit and push this approval checkpoint; Feature 003
  architecture still waits for Feature 002 to merge.
- Blocker / unblock action: Feature 002 must merge before Feature 003
  architecture begins, as required by AC1.
- Next action: commit and push the validated approval checkpoint when
  authorized, then wait for Feature 002 to merge.
- Handoff recipient: Feature 003 Architect after Feature 002 merges.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T07:13:58Z | R-0009/coordinator | Created issue #17, isolated worktree, Agent Flow session, and assignment | Planner drafts, validates, commits, pushes, and stops at Gate 1 |
| 2026-11-13T07:17:24Z | R-0009/planner-01 | Drafted the Feature 003 spec with migration, repository, tenant-isolation, and real-PostgreSQL criteria | Validate the spec and confirm only the authorized files changed |
| 2026-11-13T07:18:20Z | R-0009/planner-01 | Initial validation failed because its regex required unwrapped Given/When/Then lines; whitespace and file scope passed | Rerun a paragraph-aware criteria check |
| 2026-11-13T07:18:50Z | R-0009/planner-01 | Paragraph-aware validation passed for two authorized files, Draft status, 24 criteria, whitespace, and absent plan/tasks | Inspect, commit, and push |
| 2026-11-13T07:19:35Z | R-0009/planner-01 | Committed and pushed the validated Draft spec at `bee1cb5` | Commit and push this closeout checkpoint, then wait at Gate 1 |
| 2026-11-13T07:21:13Z | R-0009/coordinator | Verified clean remote parity at `4714c04`, completed the Planner lifecycle, and accepted the Gate 1 handoff | Await Zack; no architecture or implementation |
| 2026-11-13T08:20:19Z | R-0012/coordinator | Recorded Zack's Gate 1 approval and RLS deferral | Validate and commit; wait for Feature 002 merge before architecture |
| 2026-11-13T08:20:19Z | R-0012/coordinator | Validation passed for approved status, RLS scope, dependency boundary, tracking links, and whitespace | Commit and push when authorized; do not start architecture before Feature 002 merges |
