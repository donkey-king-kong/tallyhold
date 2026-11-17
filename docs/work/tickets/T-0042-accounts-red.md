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
- Updated: 2026-11-17T07:45:26Z

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

- [x] New tests map AC1-AC7 and the plan's verification items.
- [x] RED failures show missing feature behavior, not collection/fixture errors.
- [x] Existing tests pass unchanged and no tests are weakened.
- [ ] Test SHA, command counts/failure causes and mapping are pushed before review.

## Checkpoint

- Last completed action: committed test-only RED at `771e9ad`; reran new and existing suites separately at that SHA and drafted sanitized evidence.
- Evidence: [RED run](../../specs/006-accounts/red-test-run.md): backend 44 expected failures, 146 existing passes; frontend 9 expected failures and 8 passes, 13 existing passes plus one deliberately excluded new case. First rerun omitted the local test URL and had fixture errors; corrected run has zero setup errors.
- Worktree state: test commits through `771e9ad` local, evidence and checkpoint uncommitted; no production code.
- Remaining work: commit/push evidence, verify remote head and dispatch independent RED review.
- Blocker / unblock action: none; RED review after handoff is mandatory before GREEN.
- Next action: push RED evidence and checkpoint, verify remote head, then dispatch fresh reviewer with base `82ec809` and test head `771e9ad`.
- Handoff recipient: independent RED Reviewer via coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:31:13Z | R-0040/coordinator | Claimed T-0042 after explicit plan approval at `ab58947` | Add RED tests only; no migration/feature code |
| 2026-11-17T07:35:09Z | R-0040/coordinator | Approval `82ec809` pushed after one transient remote rejection; locked dependencies installed; shared PG17 test port usable, own Compose start failed on occupied port | Use only uniquely named disposable DBs; adapt 003 seed fixtures and write RED |
| 2026-11-17T07:45:26Z | R-0040/coordinator | Five RED slices and a focused browser expansion committed through `771e9ad`; pinned reruns show missing behavior only; existing suites pass | Commit/push evidence and hand off to a fresh RED Reviewer; no GREEN before approval |
