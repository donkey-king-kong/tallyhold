# T-0023: Feature 005 RED tests

## Assignment

- Status: in_progress
- Owner actor: R-0028/coordinator
- Role: Test writer
- Run: [R-0028](../runs/R-0028.md)
- Feature / task: [Feature 005 spec](../../specs/005-auth/spec.md), [approved plan](../../specs/005-auth/plan.md), [RED tasks](../../specs/005-auth/tasks.md#red-approved-stop-for-zacks-review-before-green)
- Authorization: Zack explicitly approved the 005 plan on 2026-11-17 with per-process JWKS correction and authorized RED, directing a stop before GREEN
- Dependencies: [T-0021](T-0021-draft-auth-spec.md) and [T-0022](T-0022-plan-auth.md)
- Branch / worktree: `feature/005-auth`
- Worktree path: `../tallyhold-feature-005-auth`
- Issue / PR: [issue #27](https://github.com/donkey-king-kong/tallyhold/issues/27); no PR
- Updated: 2026-11-17T03:15:14Z

## Scope

Write failing backend and frontend tests at the approved seams for AC1-AC5,
including offline ES256/JWKS matrix, per-process unknown-kid flood and timeout,
PostgreSQL migration/provisioning/advisory-lock interleavings, `/me`/CORS,
and session UI. Collect tests and verify failures are missing behavior,
not broken tests or network/secret dependencies. Commit RED separately from
implementation; no production code, migrations, GREEN or Feature 006 work.

## Acceptance

- [ ] Focused tests cover all approved 005 criteria with offline auth fixtures.
- [ ] RED test invocations collect and fail for missing feature behavior;
  existing tests remain green where test infrastructure is available.
- [ ] RED tests are committed and pushed in focused `test:` commits; Zack
  receives exact commands, failures and tested revisions before GREEN.

## Checkpoint

- Last completed action: frontend RED committed at `a709cbc`; full backend/frontend RED and existing suites verified. Corrected the cold-cache flood assertion, added async callers, and kept legacy migration catalog assertion additive.
- Evidence: full backend `uv run --locked pytest -q --tb=no` had 36 missing-feature failures, 92 passes; old backend suite 91 passed with disposable PostgreSQL 17. Full frontend `npm test -- --reporter=dot` had 7 absent-component/route failures, 3 passes; old frontend suite 3 passed. Backend ruff/format/mypy/import-linter and frontend lint/typecheck/targeted Prettier all passed. No live keys, Supabase network or production schema use.
- Worktree state: flood correction, additive existing test, tasks and this checkpoint not yet committed; branch ahead of remote.
- Remaining work: commit final RED test refinements and checkpoint; rerun at final revision, push and hand off to Zack. GREEN remains held.
- Blocker / unblock action: GREEN requires Zack's review of the RED checkpoint.
- Next action: commit final RED adjustments, verify final revision, push, then stop at Zack's checkpoint.
- Handoff recipient: Zack at RED checkpoint.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T02:52:38Z | R-0028/coordinator | Claimed Test writer assignment after plan approval; GREEN remains held | Commit/push plan, then start RED |
| 2026-11-17T02:55:18Z | R-0028/coordinator | Approved plan pushed at `a96c0da`; inspected JWT `/me`, repository, migration and frontend test seams | Add offline test-only signing fixture; begin JWT RED |
| 2026-11-17T02:59:30Z | R-0028/coordinator | Installed locked test-only cryptography; 19 offline JWT cases collect, all fail because verifier is absent; ruff passes | `uv run --locked pytest -q --tb=short tests/test_auth_jwt.py`; commit first RED slice |
| 2026-11-17T03:01:00Z | R-0028/coordinator | JWT RED committed at `07fc854`; disposable PostgreSQL baseline 4 passed, schema RED 3 failed at absent 0003/tables; no PostgreSQL setup errors | Commit schema RED and test application/race |
| 2026-11-17T03:04:48Z | R-0028/coordinator | Schema RED committed at `9369949`; eight identity/marker/lock cases fail on absent 005 behavior after correcting test SQL casts | Commit resolution RED, proceed to HTTP |
| 2026-11-17T03:07:00Z | R-0028/coordinator | Resolution RED committed at `af9ec9b`; HTTP suite has 6 absent-route/dependency failures and 1 pre-existing CORS pass | Commit HTTP RED, then frontend |
| 2026-11-17T03:10:49Z | R-0028/coordinator | HTTP RED committed at `b95bf48`; frontend auth component/callback RED 7 missing-feature failures; typecheck, lint, Prettier pass | Commit frontend RED; verify baseline/full RED |
| 2026-11-17T03:15:14Z | R-0028/coordinator | Frontend RED committed at `a709cbc`; baseline backend 91 and frontend 3 pass, full backend 36 expected failures/92 passes and frontend 7 expected failures/3 passes; static checks green | Commit final flood/additive refinements, rerun and push; stop before GREEN |
