# T-0011: Draft schema and repositories spec

## Assignment

- Status: in_progress
- Owner actor: R-0009/planner-01
- Role: Planner
- Run: [R-0009](../runs/R-0009.md)
- Feature / task:
  [003 Draft spec](../../specs/003-schema-repositories/spec.md)
- Authorization: Zack requested issue creation, Planner Draft, commit, and push,
  followed by a stop at Gate 1 on 2026-11-13.
- Dependencies: Feature 002 spec approval and merge; issue
  [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)
- Branch / worktree: `feature/003-schema-repositories`
- Worktree path: `../tallyhold-feature-003`
- Issue / PR: issue #17; no PR requested
- Updated: 2026-11-13T07:13:58Z

## Scope

Draft the persistence feature contract requested in issue #17. Cover Alembic
migrations for Feature 002 entities, SQLAlchemy implementations of domain
repository interfaces, and pytest repository tests against real PostgreSQL via
Docker Compose. Exclude application services, APIs, and frontend work. Commit
and push, then stop at Gate 1 without architecture or implementation.

## Acceptance

- [x] Issue #17 has the requested title, `feature` label, scope, dependency,
  and assignee.
- [ ] Draft spec covers migrations, repositories, user scoping, and real
  PostgreSQL repository tests.
- [ ] Acceptance criteria are observable Given/When/Then statements.
- [ ] Feature 002 approval and merge are explicit prerequisites.
- [ ] Draft spec and recovery records are checked, committed, and pushed.
- [ ] Handoff stops at Gate 1 without planning or implementation.

## Checkpoint

- Last completed action: created issue #17 and the isolated Feature 003
  worktree from merged `main`.
- Evidence: `feature/003-schema-repositories` at `1f88780`; issue #17.
- Worktree state: ticket and run records are uncommitted.
- Remaining work: draft the spec, validate, commit, and push.
- Blocker / unblock action: none for drafting; architecture and implementation
  remain blocked on Feature 002 approval and merge plus Feature 003 Gate 1.
- Next action: dispatch R-0009/planner-01 to draft the spec.
- Handoff recipient: R-0009/planner-01.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T07:13:58Z | R-0009/coordinator | Created issue #17, isolated worktree, Agent Flow session, and assignment | Planner drafts, validates, commits, pushes, and stops at Gate 1 |
