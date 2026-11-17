# T-0042: Feature 006 RED tests

## Assignment

- Status: in_progress
- Owner actor: R-0040/coordinator
- Role: Test writer (coordinator; separate RED scope from later Implementer)
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [006 spec](../../specs/006-accounts/spec.md), [approved plan](../../specs/006-accounts/plan.md), [RED tasks](../../specs/006-accounts/tasks.md)
- Authorization: Zack's Gate 1 and explicit schema/architecture-plan approval as written at `ab58947` on 2026-11-17
- Dependencies: [T-0041](T-0041-plan-accounts.md), Feature 003/005
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / none
- Updated: 2026-11-17T07:31:13Z

## Scope

Write behavior-failing tests for the approved database, use-case, API and
frontend seams. Commit tests alone, verify RED for missing behavior and
existing-suite GREEN at the test SHA, then commit/push sanitized
`red-test-run.md` evidence. No production code, migration file, CI,
Compose or AGENTS.md edits. GREEN waits for a separate fresh RED review.

Approved seams and limits:

- PostgreSQL migration/repository public operations catch seed/index/
  downgrade and concurrent constraints; they do not prove HTTP auth.
- Accounts application operations with fake 003 ports catch owner scoping,
  validation, immutability and ordering; they do not prove PostgreSQL races.
- FastAPI routes with offline auth and disposable DB catch status, isolation
  and CORS; they do not prove browser session clearing.
- Browser UI with a fake network/session catches accessible CRUD and stale
  session behavior; it does not prove database constraints.

## Acceptance

- [ ] New tests map AC1-AC7 and the plan's verification items.
- [ ] RED failures show missing feature behavior, not collection/fixture errors.
- [ ] Existing tests pass unchanged and no tests are weakened.
- [ ] Test SHA, command counts/failure causes and mapping are pushed before review.

## Checkpoint

- Last completed action: claimed approved RED assignment after plan gate.
- Evidence: approved plan at `ab58947`, issue #36, clean branch at assignment.
- Worktree state: approval and ticket records uncommitted; no tests written.
- Remaining work: write focused tests, run new RED/existing GREEN separately, commit/push evidence.
- Blocker / unblock action: none; RED review after handoff is mandatory before GREEN.
- Next action: inspect 003/005 test fixtures and write first migration behavior tests.
- Handoff recipient: independent RED Reviewer via coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:31:13Z | R-0040/coordinator | Claimed T-0042 after explicit plan approval at `ab58947` | Add RED tests only; no migration/feature code |
