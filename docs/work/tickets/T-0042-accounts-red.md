# T-0042: Feature 006 RED tests

## Assignment

- Status: done
- Owner actor: R-0040/coordinator
- Role: Test writer (coordinator; separate RED scope from later Implementer)
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [006 spec](../../specs/006-accounts/spec.md), [approved plan](../../specs/006-accounts/plan.md), [RED tasks](../../specs/006-accounts/tasks.md)
- Authorization: Zack's Gate 1 and explicit schema/architecture-plan approval as written at `ab58947` on 2026-11-17
- Dependencies: [T-0041](T-0041-plan-accounts.md), Feature 003/005
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / none
- Updated: 2026-11-17T07:50:33Z

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
- [x] Test SHA, command counts/failure causes and mapping are pushed before review.

## Checkpoint

- Last completed action: Zack-authorized exceptional test-only correction
  `161a3d9` covers all three round 2 gaps; four suite partitions rerun.
- Evidence: [round 1 review](../../specs/006-accounts/red-review.md),
  identical [comment](https://github.com/donkey-king-kong/tallyhold/commit/112848554a86aae44d605dfa7e5052c0fe8d4c1a#commitcomment-210413865).
- Worktree state: corrected tests committed, evidence/checkpoint uncommitted.
- Remaining work: push evidence, then fresh exceptional review.
- Blocker / unblock action: GREEN gated on fresh exceptional review APPROVE.
- Next action: push revised evidence and assign different fresh RED Reviewer.
- Handoff recipient: independent RED Reviewer via coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:31:13Z | R-0040/coordinator | Claimed T-0042 after explicit plan approval at `ab58947` | Add RED tests only; no migration/feature code |
| 2026-11-17T07:35:09Z | R-0040/coordinator | Approval `82ec809` pushed after one transient remote rejection; locked dependencies installed; shared PG17 test port usable, own Compose start failed on occupied port | Use only uniquely named disposable DBs; adapt 003 seed fixtures and write RED |
| 2026-11-17T07:45:26Z | R-0040/coordinator | Five RED slices and a focused browser expansion committed through `771e9ad`; pinned reruns show missing behavior only; existing suites pass | Commit/push evidence and hand off to a fresh RED Reviewer; no GREEN before approval |
| 2026-11-17T07:45:26Z | R-0040/coordinator | Evidence and checkpoint committed/pushed at `a0f8435`; remote SHA matches; T-0043 assigned for independent review | Dispatch a fresh reviewer; GREEN still gated |
| 2026-11-17T07:50:33Z | R-0040/coordinator | Reopened Test writer after independent round 1 `CHANGES_REQUESTED`; added test-only auth, matching reserved-ID, orphan, page wiring and session assertions | Commit correction and rerun suites before fresh round 2 |
| 2026-11-17T07:56:14Z | R-0040/coordinator | Corrected test-only commit `4843f4d`: 49 backend RED failures, 146 existing passes; 10 frontend RED failures and 8 passes, 13 existing passes with one deliberately excluded new case | Push updated evidence and dispatch different fresh round 2 reviewer |
| 2026-11-17T07:56:14Z | R-0040/coordinator | Corrected evidence pushed `dcb3c87`; assigned distinct reviewer ticket T-0044 | GREEN remains gated |
| 2026-11-17T07:56:14Z | R-0040/coordinator | Zack authorized one additional corrective RED round after T-0044 escalation | Add exactly three missing assertions and seek a different fresh review; no GREEN yet |
| 2026-11-17T08:08:26Z | R-0040/coordinator | Exceptional test-only `161a3d9` covers broker tie, row broker name, lowercase currency; pinned runs show 50 backend RED/146 existing pass and 10 frontend RED/13 existing pass | Push revised evidence; different fresh reviewer before GREEN |
