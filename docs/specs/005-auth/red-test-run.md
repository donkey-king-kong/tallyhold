# Feature 005 RED test run

## Revision and environment

- RED test commit: `c0d0601a4f4fe3cfe3cf97179f76996e088bad30`.
- Rechecked at merge commit `60d96cd92e797d92aaeadc7c2baffc6f23aa2fda`;
  the merge from PR #29 did not change `backend/tests/` or the new frontend
  component test files relative to the RED test commit.
- Disposable local PostgreSQL 17 through the repository's guarded
  `TALLYHOLD_TEST_DATABASE_URL` fixture; no production database or Supabase
  network, credentials, or project signing keys. The test URL is omitted.
- New tests are the four backend files named below and two frontend auth
  files; existing-suite commands exclude only those new files. No tests were
  skipped.

## Commands and results

Run backend commands from `backend/` with `TALLYHOLD_TEST_DATABASE_URL` set
to a guarded, disposable local `tallyhold_test` PostgreSQL URL; run frontend
commands from `frontend/`.

| Scope | Command | Exit | Collected / failed / passed / skipped |
| --- | --- | ---: | --- |
| Backend RED | `uv run --locked pytest -q --tb=line tests/test_auth_jwt.py tests/test_auth_http.py tests/integration/test_auth_schema.py tests/integration/test_auth_resolution.py` | 1, expected RED | 37 / 36 / 1 / 0 |
| Backend existing | `uv run --locked pytest -q --ignore=tests/test_auth_jwt.py --ignore=tests/test_auth_http.py --ignore=tests/integration/test_auth_schema.py --ignore=tests/integration/test_auth_resolution.py` | 0 | 91 / 0 / 91 / 0 |
| Frontend RED | `npm test -- components/auth-status.test.tsx components/auth-callback.test.tsx --reporter=dot` | 1, expected RED | 7 / 7 / 0 / 0 |
| Frontend existing | `npm test -- components/health-status.test.tsx --reporter=dot` | 0 | 3 / 0 / 3 / 0 |

Backend failure reasons: 19 JWT cases stop at the absent
`identity.infrastructure.jwt_verifier.SupabaseJwtVerifier`; five HTTP cases
return 404 because `/api/v1/me` is absent and one stops at the absent
shared current-user dependency (the existing CORS preflight passes);
three schema cases find the absent `0003_auth_identity` revision or its two
tables; eight provisioning cases find the absent `ResolveCurrentUser` or
`erasure_deny_markers` table. Frontend: five component cases fail importing
the absent `auth-status` component, and two callback cases fail importing
the absent `/auth/callback/route`. No collection, syntax, missing test
dependency, connection, or live-network failures occurred.

## Acceptance and plan mapping

The plan's verification table has five rows rather than literal numbers;
they are numbered 1-5 below in table order. Tests describe intended
behavior; they have not yet passed, and production/runbook work remains
GREEN.

| Criterion / plan verification item | RED tests and observable assertion |
| --- | --- |
| AC1 / 1: Google PKCE, session and bearer UI | `signed-out visitor starts Google OAuth without exposing tokens`, `callback exchanges only the one-time code and redirects without tokens`, `cancelled callback returns a safe signed-out redirect`, `session fetches only its own current user with bearer and omitted credentials`, `sign-out and expiry remove protected user details`, `an expired session never fetches protected data`, `cancelled or failed sign-in shows a safe signed-out state` |
| AC2 / 2: ES256-only verification, keys and denial | `test_valid_es256_token_resolves_only_verified_identity`, 11 parametrized `test_invalid_claims_and_attacker_headers_never_resolve_identity` cases (expiry, issuer, audience, role, sub, HS256/none and unknown kid), `test_missing_subject_never_resolves_identity`, `test_signed_token_cannot_redirect_the_jwks_request`, `test_forged_signature_is_rejected`, `test_untrusted_jwks_key_types_are_never_accepted`, `test_cached_keys_expire_at_600_seconds`, `test_random_kid_flood_refreshes_at_most_once_per_process_per_window`, `test_jwks_fetch_uses_three_second_timeout_and_fails_closed`, `test_me_rejects_missing_invalid_or_cookie_only_authentication` |
| AC3 / 3: first login, returning identity and isolation | `test_first_and_returning_login_keep_one_user_and_existing_settings`, `test_different_auth_subjects_with_same_provider_stay_distinct`, `test_same_subject_from_another_issuer_never_reuses_a_user`, `test_simultaneous_first_logins_create_no_duplicate_or_orphan_user`, `test_identity_unique_pair_and_user_foreign_key_are_enforced`, `test_0003_upgrade_downgrade_reupgrade_adds_only_approved_tables` |
| AC4 / 4: `/me`, bearer, CORS, health | `test_me_returns_only_the_authenticated_internal_user` (two users and an attempted caller-selected ID), `test_me_rejects_missing_invalid_or_cookie_only_authentication`, `test_only_configured_frontend_origin_may_preflight_bearer_request`, `test_health_stays_public_while_me_is_protected`, `session fetches only its own current user with bearer and omitted credentials` |
| AC5 / 5: marker, transaction ordering and minimal schema | `test_operator_marker_commits_while_first_login_waits_and_denies_creation`, `test_first_login_commits_before_operator_marker_then_erasure_stays_denied`, `test_expired_marker_still_denies_until_operator_purges_it`, `test_marker_denies_even_an_existing_identity_before_lookup`, `test_identity_and_marker_columns_match_the_approved_minimal_contract`, `test_0003_upgrade_downgrade_reupgrade_adds_only_approved_tables` |

The plan decisions on only two additive tables, canonical advisory lock and
both orderings, SGD first login, `(issuer, sub)` isolation, marker checked
even after expiry until manual purge, ES256/P-256 only, pinned JWKS, 600s
cache, per-process 60s random-`kid` limit with concurrent thread/async
callers, and a 3s fetch timeout are exercised in the named tests. The
current HTTP tests assert 401 for invalid bearer, but do not yet directly
assert the planned 503 response for a JWKS transport outage or database
non-provisioning for a rejected JWT. JWT and marker negative cases currently
assert rejection with `pytest.raises(Exception)`, not a specific domain
exception. There is no explicit rotated-key replacement or restored-backup
test. These are coverage limits for the independent reviewer to judge; do
not infer that a missing test has passed.

The production Data API OFF checkpoint was confirmed by Zack in the approved
spec. Operator erasure runbook, provider retention verification and the
disposable operator walkthrough are planned GREEN work, not live operations
performed by these RED tests. No CI test uses a real Supabase Auth user.

## Round 2 RED revision (supersedes the counts above)

- Test commit: `24a079782b5ccd848d006db350dda08ce1c4c50e`.
- Checked on 2026-11-17 with guarded disposable local PostgreSQL 17 and
  in-memory P-256 keys/fake HTTP. No production DB, live signing key, Supabase
  call or external network. The local test URL is deliberately omitted.
- The backend RED command now also includes
  `tests/integration/test_auth_boundary.py`; the existing backend command
  additionally excludes only that new file. All other commands are the same
  as in the table above.

| Scope | Exit | Collected / failed / passed / skipped | Observed reason |
| --- | ---: | --- | --- |
| Backend RED | 1, expected | 55 / 54 / 1 / 0 | JWT verifier, `/me` composition, `0003` tables and resolution service are absent; CORS preflight passes. The new composed boundary fails explicitly because `app.dependencies` is absent. |
| Backend existing | 0 | 91 / 0 / 91 / 0 | Existing tests remain green. |
| Frontend RED | 1, expected | 9 / 9 / 0 / 0 | Auth status, browser client and callback modules are absent. |
| Frontend existing | 0 | 3 / 0 / 3 / 0 | Existing tests remain green. |

Backend command (from `backend/`, with the guarded disposable test URL set):

```sh
uv run --locked pytest -q --tb=line tests/test_auth_jwt.py tests/test_auth_http.py tests/integration/test_auth_schema.py tests/integration/test_auth_resolution.py tests/integration/test_auth_boundary.py
uv run --locked pytest -q --ignore=tests/test_auth_jwt.py --ignore=tests/test_auth_http.py --ignore=tests/integration/test_auth_schema.py --ignore=tests/integration/test_auth_resolution.py --ignore=tests/integration/test_auth_boundary.py
```

Frontend commands (from `frontend/`):

```sh
npm test -- components/auth-status.test.tsx components/auth-callback.test.tsx --reporter=dot
npm test -- components/health-status.test.tsx --reporter=dot
```

Backend ruff lint/format and frontend lint/typecheck passed before the test
commit; `git diff --check` passed. No collection errors, skipped tests,
unavailable dependencies, failed connections or live network calls occurred.
Direct database tests expecting 0003 fail on its absent tables; the constraint
rollback case's temporary CHECK is installed only after that migration exists.
New assertions for verifier rejection use `ValueError`, JWKS transport failures
use `ConnectionError`, and marker denial uses `PermissionError`; FastAPI cases
assert generic 401/503 and zero provisioned users instead of internal errors.

Round-1 findings mapped to new RED assertions:

| Criterion / verification item | Revised coverage |
| --- | --- |
| AC1 / 1 | `browser Supabase client requests the PKCE OAuth flow`, `callback-created session becomes authenticated without leaking its token`, and both callback tests now check token/provider detail absence in redirects, response bodies and logs; cancelled callback redirects to `/`. Real provider OAuth remains outside CI. |
| AC2 / 2 | `test_auth_boundary.py` drives valid/expired/wrong-issuer/anon/empty-sub/HS256/forged JWTs and JWKS outage through the composed `/me` dependency with zero provisioning on denial (401/503). `test_auth_jwt.py` now tests `x5u`, rotated key acceptance, cache expiry and outage, failed refresh retaining an unexpired known key, unknown-kid gating after expiry and rejected untrusted/HTTP JWKS configuration. It does not demand immediate revocation of an unexpired cached key. |
| AC3 / 3 | `test_provisioning_constraint_failure_rolls_back_candidate_not_caller_work` checks savepoint rollback with a deliberate PostgreSQL constraint failure while preserving unrelated caller work. Existing simultaneous-login and same-email/different-sub cases remain. |
| AC4 / 4 | Composed bearer mapping returns the internal UUID, ignores attempted client user ID/email, isolates two subjects, rejects duplicate Authorization headers and gives 503 on JWKS outage without user detail. CORS and public health remain covered by the original route tests. |
| AC5 / 5 | Marker denial assertions now require a denial category rather than any exception; two real PostgreSQL advisory-lock orderings, late purge and schema checks remain. Data API inspection, actual backup/log retention and disposable operator walkthrough remain explicit GREEN/deployment gates, not claims of completed CI coverage. |

## Authorized round 3: targeted RED evidence

Zack authorized one additional, targeted RED round on 2026-11-17 after the
round-2 `CHANGES_REQUESTED` verdict. Test revision
`dc8e0875dcbf8aedbdaf450de45ed3682f507f77` was pushed and matched
`origin/feature/005-auth` before the commands below ran. This is the exact
pushed head on which the new and existing suites were rerun. The guarded
disposable PostgreSQL 17 fixture and in-memory P-256 keys/fake HTTP were
used; no project secrets or live Supabase/network calls.

Finding 3's previous revision gap is content-equivalent:
`git diff --name-only 24a079782b5ccd848d006db350dda08ce1c4c50e..d5cee6c86839f8a227191c721c6ae4c43f4c10cc`
lists **only** `red-test-run.md`, `R-0031.md`, `T-0026-auth-red-review.md`
and `T-0028-auth-red-review-fixes.md`, all under `docs/`. No test or
production file changed between the previous test commit and reviewed
evidence head. From that reviewed head to `dc8e087`, only
`backend/tests/test_auth_jwt.py` changed among tests. The prior rejection,
rotation, 59/60-second gate, 600-second cache, known-key fetch and all
existing tests/assertions remain; the diff adds a shared monotonic fake-time
base that advances by 2,000,000 seconds between test cases and adds a second
distinct unknown `kid` after a failed refresh. It requires `ValueError`
(rejection) and still exactly two total fetches, including after verifying
the unexpired known key. This catches a limiter that records only successful
refresh attempts without resetting production process state or limiting per
`kid`. The test file's largest within-case fake-time offset is 1,000,120
seconds, so consecutive cases do not overlap their 60-second windows.

Commands at pushed `dc8e087` (backend commands from `backend/` with the
strictly guarded disposable local test URL set; value omitted):

```sh
uv run --locked pytest -q --tb=no --disable-warnings tests/test_auth_jwt.py tests/test_auth_http.py tests/integration/test_auth_schema.py tests/integration/test_auth_resolution.py tests/integration/test_auth_boundary.py
uv run --locked pytest -q --tb=no --disable-warnings --ignore=tests/test_auth_jwt.py --ignore=tests/test_auth_http.py --ignore=tests/integration/test_auth_schema.py --ignore=tests/integration/test_auth_resolution.py --ignore=tests/integration/test_auth_boundary.py
uv run --locked ruff check tests
uv run --locked ruff format --check tests
```

Frontend commands at that same pushed head (from `frontend/`):

```sh
npm test -- components/auth-status.test.tsx components/auth-callback.test.tsx --reporter=dot
npm test -- components/health-status.test.tsx --reporter=dot
npm run lint
npm run typecheck
```

| Scope | Exit | Collected / failed / passed / skipped | Observed reason |
| --- | ---: | --- | --- |
| Backend RED | 1, expected | 55 / 54 / 1 / 0 | Unimplemented JWT verifier, identity resolution, `0003` tables and `/me` wiring; existing public preflight case passes. |
| Backend existing | 0 | 91 / 0 / 91 / 0 | Unchanged existing suite remains green. |
| Frontend RED | 1, expected | 9 / 9 / 0 / 0 | Unimplemented auth callback, browser client and status component. |
| Frontend existing | 0 | 3 / 0 / 3 / 0 | Unchanged health tests remain green. |
| Backend Ruff lint / format | 0 / 0 | all tests / all tests | `ruff check` and `ruff format --check` pass. |
| Frontend ESLint / TypeScript | 0 / 0 | all / all | `npm run lint` and `npm run typecheck` pass. |

The RED failures are expected missing-feature behavior, not test collection,
missing test dependencies, unrelated fixture failures or live network
errors. The evidence commit following `dc8e087` changes only documentation
and work tracking; its test tree is identical to the pushed test revision.
