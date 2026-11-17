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
- Updated: 2026-11-17T02:59:30Z

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

- Last completed action: offline ES256/JWKS matrix collected and failed for missing `SupabaseJwtVerifier`; test-only signing dependency locked.
- Evidence: `uv run --locked ruff check tests/test_auth_jwt.py` passed; `uv run --locked pytest -q --tb=short tests/test_auth_jwt.py` collected 19 cases, all failed with `AC2: SupabaseJwtVerifier is not implemented yet`; MockTransport uses no Supabase network.
- Worktree state: JWT test, test-only dependency and this checkpoint not yet committed.
- Remaining work: commit JWT slice, write/run/commit PostgreSQL, HTTP and frontend RED slices; verify existing tests.
- Blocker / unblock action: GREEN requires Zack's review of the RED checkpoint.
- Next action: commit the offline JWT RED slice, then add disposable PostgreSQL schema/identity tests.
- Handoff recipient: Zack at RED checkpoint.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T02:52:38Z | R-0028/coordinator | Claimed Test writer assignment after plan approval; GREEN remains held | Commit/push plan, then start RED |
| 2026-11-17T02:55:18Z | R-0028/coordinator | Approved plan pushed at `a96c0da`; inspected JWT `/me`, repository, migration and frontend test seams | Add offline test-only signing fixture; begin JWT RED |
| 2026-11-17T02:59:30Z | R-0028/coordinator | Installed locked test-only cryptography; 19 offline JWT cases collect, all fail because verifier is absent; ruff passes | `uv run --locked pytest -q --tb=short tests/test_auth_jwt.py`; commit first RED slice |
