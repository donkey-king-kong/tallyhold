# T-0014: Plan Feature 003 schema and repositories

## Assignment

- Status: in_review
- Owner actor: R-0017/coordinator
- Role: Architect
- Run: [R-0017](../runs/R-0017.md)
- Feature / task: [Feature 003](../../specs/003-schema-repositories/spec.md)
- Authorization: Zack approved Feature 003 Gate 1 on 2026-11-13 and the
  Feature 002 repository-port amendment on 2026-11-16. Planning only;
  schema/architecture plan requires Zack's approval before execution.
- Dependencies: [T-0011](T-0011-draft-schema-repositories-spec.md),
  [T-0012](T-0012-implement-core-domain.md); Feature 002 merged via PR #21.
- Branch / worktree: `feature/003-schema-repositories-architecture`
- Worktree path: `../tallyhold-feature-003-architecture`
- Issue / PR: issue #17; no planning PR requested
- Updated: 2026-11-16T07:23:16Z

## Scope

Resolve the Feature 003 architecture questions against the merged Feature 002
domain ports; produce only `spec.md` question resolution, `plan.md`, `tasks.md`,
and work-tracking records. No tests, feature code, migrations, or implementation.
RLS is deferred to the authentication phase.

## Acceptance

- [x] Q1 is recorded as resolved against merged Feature 002 repository ports.
- [x] Plan maps AC1-AC7 to schema, mappings, user-scoped adapters, migrations,
  real PostgreSQL integration tests and architectural verification.
- [x] Ordered tasks stop at Zack's schema/architecture plan gate; no execution.
- [x] Revised plan and tasks are handed to Zack for explicit approval.

## Checkpoint

- Last completed action: verified Zack's attached plan matches the repository
  plan byte-for-byte outside the inserted ERD and checked tasks/ERD coverage.
- Evidence: merged Feature 002 PR #21 (`272d0a9`) contains all five ports;
  revised plan covers all six numbered verification items, with tasks tracing
  AC1-AC7. Attachment comparison passed; no factual discrepancy found against
  Feature 002. Final `git diff --check` follows this checkpoint.
- Worktree state: uncommitted planning documents and tracking records only.
- Remaining work: final `git diff --check`, then Zack's explicit plan decision;
  no implementation.
- Blocker / unblock action: execution awaits Zack's plan approval.
- Next action: run `git diff --check`, present ERD/task summary to Zack, and
  wait for explicit schema/architecture-plan approval.
- Handoff recipient: Zack.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T06:25:30Z | R-0017/coordinator | Claimed architecture-only scope after verifying Gate 1, merged domain ports, and clean synchronized base | Draft plan and tasks; stop before execution |
| 2026-11-16T06:28:00Z | R-0017/coordinator | Resolved Q1 and drafted Q2 composite FK, five-table schema, mappings, migrations and PostgreSQL test design; whitespace and coverage-language checks passed | Handoff plan/tasks for Zack's approval; no tests or implementation |
| 2026-11-16T07:20:38Z | R-0017/coordinator | Resumed T-0014 on Zack's replacement plan; compared the attachment with prior draft and checked its repo references | Replace plan verbatim plus ERD; regenerate tasks; no commit or implementation |
| 2026-11-16T07:22:31Z | R-0017/coordinator | Replaced plan content from the attachment, inserted five-table ERD, and regenerated task mapping | Verify fidelity and diff; then hand off without commit |
| 2026-11-16T07:23:16Z | R-0017/coordinator | Compared plan to attachment excluding only the ERD; exact match, no repo-factual discrepancies found; task mapping covers AC1-AC7 and verification 1-6 | Run final `git diff --check`, hand off to Zack; leave uncommitted |
