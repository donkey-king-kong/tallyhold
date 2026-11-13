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
- Updated: 2026-11-13T07:18:50Z

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
- [ ] Draft spec and recovery records are checked, committed, and pushed.
- [ ] Handoff stops at Gate 1 without planning or implementation.

## Checkpoint

- Last completed action: validated the Draft spec and authorized file scope
  with a paragraph-aware check.
- Evidence: `git diff --check` passed; exactly two authorized files changed;
  Status is Draft; 24 Given/When/Then criteria were found; no plan or tasks
  exist.
- Worktree state: spec and ticket changes are uncommitted.
- Remaining work: inspect the final diff, commit, and push.
- Blocker / unblock action: none for drafting; architecture and implementation
  remain blocked on Feature 002 approval and merge plus Feature 003 Gate 1.
- Next action: inspect the final diff and create the authorized documentation
  commit.
- Handoff recipient: Zack at Gate 1 after push.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T07:13:58Z | R-0009/coordinator | Created issue #17, isolated worktree, Agent Flow session, and assignment | Planner drafts, validates, commits, pushes, and stops at Gate 1 |
| 2026-11-13T07:17:24Z | R-0009/planner-01 | Drafted the Feature 003 spec with migration, repository, tenant-isolation, and real-PostgreSQL criteria | Validate the spec and confirm only the authorized files changed |
| 2026-11-13T07:18:20Z | R-0009/planner-01 | Initial validation failed because its regex required unwrapped Given/When/Then lines; whitespace and file scope passed | Rerun a paragraph-aware criteria check |
| 2026-11-13T07:18:50Z | R-0009/planner-01 | Paragraph-aware validation passed for two authorized files, Draft status, 24 criteria, whitespace, and absent plan/tasks | Inspect, commit, and push |
