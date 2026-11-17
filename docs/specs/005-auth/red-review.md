# Feature 005 RED review, round 1

Base: `a96c0dae42889b8196b6ec3f9ae3b2bb79dcb25a`
Reviewed pushed RED head: `9d4b723e22f339a95c0e1266d2efbd75b241fefa`

## Coverage mapping (checklist 1)

The approved plan's verification table has five rows, mapped here in order.

| Criterion / verification item | RED evidence | Uncovered behavior |
| --- | --- | --- |
| AC1 / 1 | `frontend/components/auth-status.test.tsx` exercises Google invocation, bearer fetch, sign-out event, expired initial session and failed sign-in; `auth-callback.test.tsx` exercises code exchange and cancelled redirect. | No assertion of PKCE configuration, authenticated app session after callback, token-free logs or public responses, or signed-out UI after a cancelled callback. |
| AC2 / 2 | `backend/tests/test_auth_jwt.py` mints P-256 tokens and checks claims, signature, key types, pinned request URL, cache boundary, concurrent unknown-`kid` requests and timeout setting; `test_auth_http.py` checks some 401 responses. | No HTTP 503 on JWKS outage, no HTTP rejection/non-provisioning for individually invalid JWTs, no rotated-key acceptance or failed-refresh cache behavior, no invalid trusted configuration/HTTPS check, and no `x5u` adversary case. |
| AC3 / 3 | `test_auth_resolution.py` exercises SGD, returning settings, pair isolation, eight simultaneous logins; `test_auth_schema.py` checks unique pair, FK and migration round-trip. | No test of conflicting first-login savepoint rollback or other constraint failure; no client-supplied metadata/ID against the real resolution path. |
| AC4 / 4 | `test_auth_http.py` exercises two overridden current users, query `user_id`, missing/bad/cookie-only requests, CORS and public health; frontend bearer fetch is asserted. | No integrated verified-token-to-`/me` request with real resolution; no test that two `Authorization` values are rejected, nor layer/import-linter assertion in RED. |
| AC5 / 5 | `test_auth_resolution.py` checks marker denial, manual purge and both PostgreSQL lock orders; `test_auth_schema.py` checks minimal tables and downgrade. | No automated verification of runbook order/retry/restore, 30-day record, backup/log retention, or Data API deployment setting. The plan explicitly places operator walkthrough and production-setting inspection outside CI; these remain GREEN/deployment gates, not passed RED checks. |

## Findings (checklists 2-6)

1. **Behavioral gaps in the API security boundary (2, 4).** `test_auth_http.py` overrides `get_current_user` for success and sends `"Bearer invalid"` for one generic rejection. It never drives an offline minted invalid JWT through the composed dependency, checks that a rejected token creates no user, or distinguishes the planned 503 for a JWKS outage from 401. A dependency that accepts forged but syntactically bearer tokens could satisfy the successful route tests and still violate AC2. Add offline composition assertions for the specified 401/503 distinctions and no provisioning.
2. **Verifier negative assertions are too broad (2, 4).** `test_auth_jwt.py` and marker tests in `test_auth_resolution.py` use `pytest.raises(Exception)`. An implementation that crashes on every invalid token, times out incorrectly, or exposes an internal exception can satisfy these tests. Assert the expected rejection category and HTTP status through the approved interfaces; check that failures do not disclose identity or credentials.
3. **Key lifecycle and trust configuration are under-tested (2, 4).** `test_auth_jwt.py` checks a 600-second refetch and at most one unknown-`kid` fetch across verifier instances, but not successful rotation to a new key, failure after cache expiry, use of a still-valid cached known key on refresh failure, rejection of token-supplied `x5u`, or rejection of untrusted JWKS configuration. These are explicit observable decisions in the plan. Add fake-HTTP/clock cases, including the unknown-`kid` path after cache expiry.
4. **First-login and frontend security cases remain incomplete (2, 4).** `test_auth_resolution.py` checks concurrent success but not the stipulated savepoint rollback on a unique conflict or other constraint failure. `auth-status.test.tsx` checks `signInWithOAuth` parameters but cannot prove PKCE is configured; `auth-callback.test.tsx` checks only the redirect location, not response headers/logging or resulting session and signed-out state after cancellation. Add targeted assertions at the repository and frontend session boundaries. The real provider flow remains an acknowledged non-CI check.
5. **RED and infrastructure evidence (3, 5).** `red-test-run.md` reports backend RED 37 collected/36 failed/1 passed and frontend RED 7/7 failed, caused by absent 005 modules/routes/tables, not collection, dependencies, fixture or network. The test diff uses in-memory P-256 keys, `httpx.MockTransport` and the guarded disposable PostgreSQL 17 fixture in `backend/tests/integration/conftest.py`; no real secrets or Supabase network are evident. The evidence was rechecked at `60d96cd92e797d92aaeadc7c2baffc6f23aa2fda`, not explicitly at the supplied head; confirm the pushed head's test content/run before GREEN.
6. **Existing-suite regression check (6).** The cumulative diff adds auth tests and modifies only `backend/tests/integration/test_migrations.py` among existing tests: its exact table-name assertion now excludes the two planned auth tables, which `test_auth_schema.py` independently requires. No existing test was deleted. `red-test-run.md` reports 91/91 existing backend and 3/3 existing frontend passing, with no skips. No further regression finding from the permitted evidence.

The uncovered observable decisions in findings 1-4 make this RED checkpoint insufficient to constrain a plausible incorrect GREEN implementation. Operational AC5 checks remain explicit later gates rather than claims of CI coverage.

VERDICT: CHANGES_REQUESTED

---

# Feature 005 RED review, round 2

Base: `a96c0dae42889b8196b6ec3f9ae3b2bb79dcb25a`
Reviewed pushed RED head: `d5cee6c86839f8a227191c721c6ae4c43f4c10cc`

## Coverage mapping (checklist 1)

The plan verification table has five rows, mapped in order. These are RED assertions, not passing feature tests.

| Criterion / verification item | Tests and evidence | Uncovered or deferred |
| --- | --- | --- |
| AC1 / 1 | `frontend/components/auth-status.test.tsx` checks PKCE browser configuration, Google invocation, callback-created signed-in state, bearer fetch with omitted credentials, sign-out and expiry; `auth-callback.test.tsx` checks code exchange, cancellation redirect and token/provider-detail absence in response and logs. | Real OAuth and an operator/provider session are outside offline CI; the cancelled redirect's signed-out UI is inferred from the null-session component case, not exercised in one flow. |
| AC2 / 2 | `backend/tests/test_auth_jwt.py` mints local P-256 JWTs and exercises signature, issuer, audience, role/sub, alg, key type, pinned JWKS, rotation, cache expiry, flood limit and timeout; `tests/integration/test_auth_boundary.py` asserts composed 401/503 and no user creation. | Failed unknown-`kid` fetches are not tested against the next unknown key in the same 60-second window; the rotation and limiter clock setup conflict as described below. |
| AC3 / 3 | `tests/integration/test_auth_resolution.py` checks SGD, returning settings, issuer/sub separation, concurrent first login, caller-work preservation on a constraint failure and no orphans; `test_auth_schema.py` checks unique pair/FK and migration round-trip. | No distinct email value is submitted to the resolver, which appropriately has no email identity input under the approved plan. |
| AC4 / 4 | `test_auth_http.py` checks `/me`, public health, CORS and cookie denial; `test_auth_boundary.py` composes minted bearer tokens with real PostgreSQL identity resolution, two-user isolation, client ID/email attempts, duplicate headers and generic denials. | Import-linter and type checks are GREEN verification, not RED behavior tests. |
| AC5 / 5 | `test_auth_resolution.py` checks marker denial before lookup, late manual purge and both real PostgreSQL advisory-lock orders; `test_auth_schema.py` checks only the approved additive tables and reversal. | Production Data API inspection, actual backup/log retention, 30-day records and the disposable operator walkthrough remain explicit GREEN/deployment gates, not verified CI outcomes. |

## Round-1 findings addressed

1. API boundary: `test_auth_boundary.py` now asserts verified-token provisioning, invalid-token 401 with zero users, and JWKS outage 503 with zero users.
2. Broad negative assertions: new verifier tests require `ValueError` for rejection and `ConnectionError` for transport failure; marker denial requires `PermissionError`, while HTTP tests check 401/503 without token disclosure.
3. Key lifecycle: `test_auth_jwt.py` adds rotation, expired-cache outage, surviving unexpired known key, `x5u`, trusted configuration and unknown-key behavior after cache expiry. The failed-attempt throttle and cross-test clock conflict below remain.
4. First-login/frontend: `test_provisioning_constraint_failure_rolls_back_candidate_not_caller_work` checks savepoint behavior; browser PKCE, callback response/log safety and signed-in event tests address the frontend cases. The cancellation flow is split across callback and null-session tests.
5. RED evidence: the round-2 addendum reports 55 backend tests (54 RED, one passing CORS), 9 frontend RED tests, no collection/setup/network failures, but identifies test commit `24a0797`, not this reviewed head.
6. Existing suite: the addendum reports 91/91 backend and 3/3 frontend existing tests passing, no skips. The cumulative base-to-head diff adds auth tests and changes only the existing migration test's table-name assertion to allow the two auth tables; `test_auth_schema.py` independently requires exactly those two. No existing test was deleted.

## Round-2 findings (checklists 2-6)

1. **Process-wide unknown-`kid` tests conflict (2, 4).** The parametrized unknown-key case in `test_auth_jwt.py:108-137` attempts a refresh with fake time `0.0`. Later, `test_new_es256_key_verifies_after_pinned_jwks_rotation` (`:206-225`) creates another verifier at the same time and requires a second unknown-key refresh to accept the rotated key. The approved limiter is shared across verifier instances within one process, across all kids, and permits at most one attempt per 60 seconds. No test resets the shared limiter between these cases. A conforming process-wide implementation cannot make both assertions pass in the same pytest process. Isolate/reset process state explicitly at the test boundary or advance a shared monotonic fake clock before the rotation.
2. **Failed refresh is not throttled by an assertion (2, 4).** `test_failed_unknown_key_refresh_keeps_unexpired_known_key` (`test_auth_jwt.py:252-269`) checks a single failed refresh and the known key. The flood test (`:321-358`) has a successful JWKS response. An implementation that records only successful unknown-`kid` refreshes passes both but allows unlimited external fetches during an outage, contrary to the approved synchronized claim-before-network decision. After a failed refresh, submit another distinct unknown kid inside 60 seconds and assert no second fetch/401.
3. **Exact-head RED evidence is missing (3, 6).** `red-test-run.md` reports the round-2 run at `24a079782b5ccd848d006db350dda08ce1c4c50e`, not `d5cee6c86839f8a227191c721c6ae4c43f4c10cc`, and does not state or prove that the reviewed head has identical test content. Its reported failure categories are missing feature modules/tables/routes, not fixture, dependency, collection or external-network errors, and the guarded PostgreSQL fixture plus in-memory keys/fake HTTP are allowed infrastructure. Recheck the pushed head or provide a content-equivalence checkpoint for the reported RED and existing-suite results.

The cumulative diff and evidence show no live keys, real Supabase calls or weakened existing behavior beyond the narrowly adjusted migration table-name assertion. The two verifier issues and unverifiable head checkpoint prevent approval in this final review round.

VERDICT: CHANGES_REQUESTED
