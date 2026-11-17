# T-0023: Feature 005 RED tests

## Assignment

- Status: in_review
- Owner actor: R-0028/coordinator
- Role: Test writer
- Run: [R-0028](../runs/R-0028.md)
- Feature / task: [Feature 005 spec](../../specs/005-auth/spec.md), [approved plan](../../specs/005-auth/plan.md), [RED tasks](../../specs/005-auth/tasks.md#red-approved-stop-for-zacks-review-before-green)
- Authorization: Zack explicitly approved the 005 plan on 2026-11-17 with per-process JWKS correction and authorized RED, directing a stop before GREEN
- Dependencies: [T-0021](T-0021-draft-auth-spec.md) and [T-0022](T-0022-plan-auth.md)
- Branch / worktree: `feature/005-auth`
- Worktree path: `../tallyhold-feature-005-auth`
- Issue / PR: [issue #27](https://github.com/donkey-king-kong/tallyhold/issues/27); no PR
- Updated: 2026-11-17T03:21:31Z

## Scope

Write failing backend and frontend tests at the approved seams for AC1-AC5,
including offline ES256/JWKS matrix, per-process unknown-kid flood and timeout,
PostgreSQL migration/provisioning/advisory-lock interleavings, `/me`/CORS,
and session UI. Collect tests and verify failures are missing behavior,
not broken tests or network/secret dependencies. Commit RED separately from
implementation; no production code, migrations, GREEN or Feature 006 work.

## Acceptance

- [x] Focused tests cover approved 005 criteria with offline auth fixtures.
- [x] RED test invocations collect and fail for missing feature behavior;
  existing tests remain green where test infrastructure is available.
- [x] RED tests are committed and pushed in focused `test:` commits; Zack
  receives exact commands, failures and tested revisions before GREEN.

## Checkpoint

- Last completed action: seven RED/fixture commits through `c0d0601` pushed to `origin/feature/005-auth`; Test writer handoff prepared for Zack.
- Evidence: at code revision `c0d0601`, `TALLYHOLD_TEST_DATABASE_URL=postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test uv run --locked pytest -qq --tb=no --disable-warnings` yielded 36 expected missing-feature failures and 92 passes. Old backend suite 91 passed. Frontend `npm test -- --reporter=dot` yielded 7 absent-component/route failures and 3 passes; old frontend suite 3 passed. Backend ruff/format/mypy/import-linter and frontend lint/typecheck/Prettier passed.
- Worktree state: code pushed at `c0d0601`; this terminal tracking checkpoint awaits its documentation commit and push.
- Remaining work: Zack reviews RED and authorizes or redirects GREEN; no production code/migration exists yet.
- Blocker / unblock action: GREEN requires Zack's review of the RED checkpoint.
- Next action: commit/push this terminal checkpoint, then stop and await Zack's RED review before GREEN.
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
| 2026-11-17T03:21:31Z | R-0028/coordinator | Final RED code `c0d0601` retested with 36 expected backend failures/92 passes and pushed; frontend 7 expected failures/3 passes; no production code | Commit/push handoff checkpoint, await Zack's review |
