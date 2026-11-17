# Feature 006 RED handoff

- Approved contract: `spec.md` and `plan.md` (plan approved at `ab58947`).
- Base before RED: `82ec809`; pinned test-only commit: `771e9ad`.
- Local PostgreSQL 17 target: disposable, uniquely named `tallyhold_test_*`
  databases created by the existing integration fixture. No live auth,
  external service or production database was used.
- Run date: 2026-11-17 UTC. Test writer has not written 006 production code.

## Pinned results

Run from `backend/` with
`TALLYHOLD_TEST_DATABASE_URL=postgresql+psycopg://tallyhold@127.0.0.1:55432/tallyhold_test`
(a local test-only URL, not a secret):

| Command | Exit | Result and failure cause |
| --- | --- | --- |
| `uv run pytest -q --tb=no tests/integration/test_accounts_migration.py tests/integration/test_accounts_http.py tests/test_accounts_application.py` | 1 | 44 collected, 44 failed, 0 setup/collection errors. Missing `0004` and its seeds/index (9 migration cases); missing HTTP routes or write CORS (25 HTTP cases); missing application operations (10 cases). |
| `uv run pytest -q --tb=short --ignore=tests/integration/test_accounts_migration.py --ignore=tests/integration/test_accounts_http.py --ignore=tests/test_accounts_application.py` | 0 | 146 collected and passed, none failed or skipped. Existing 003 historical-schema assertions were relocated to their original revision; existing broker fixtures use a non-seed name without dropping assertions. |

Run from `frontend/`:

| Command | Exit | Result and failure cause |
| --- | --- | --- |
| `npm test -- components/account-manager.test.tsx components/auth-status.test.tsx` | 1 | 17 collected: 9 failed, 8 passed, none skipped. Eight account-manager cases cannot import the as-yet-unwritten component; the new home-link case cannot find the link. |
| `npm test -- --exclude components/account-manager.test.tsx --testNamePattern='^(?!signed-in home links to accounts)'` | 0 | 14 collected: 13 passed, 1 deliberately skipped (the new link case); no existing failure. Existing React `act(...)` warnings remain. |

The first attempted backend run lacked the test URL and produced fixture setup
errors. It is **not** RED evidence; the two backend results above are the
subsequent reruns at the same pinned SHA with the required local test URL.
Warnings are existing Starlette/httpx, Alembic configuration and React test
environment warnings, not test failures.

## Coverage map

| Approved criterion and plan verification item | RED tests at the public seam |
| --- | --- |
| AC1 / verification 1 | `test_head_seeds_shared_sg_brokers_and_replaces_exact_name_constraint`, `test_preexisting_broker_id_survives_upgrade_downgrade_and_reupgrade`, `test_reserved_seed_id_collision_rejects_upgrade_without_overwriting`, `test_brokers_are_shared_read_only_and_account_reads_are_scoped`, account-manager broker catalog and broker-not-listed case. |
| AC2 / verification 2 | `test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels`, `test_brokers_are_shared_read_only_and_account_reads_are_scoped`, `test_second_user_cannot_read_edit_or_delete_first_users_account`, `test_unknown_broker_and_foreign_account_leave_rows_untouched`. |
| AC3 / verification 3 | Application create/invalid-name/currency/partial-update cases; HTTP create, invalid payloads, partial PATCH, duplicate POST/PATCH and immutable-field cases; `test_name_index_rejects_case_variant_within_user_but_not_across_users`, `test_concurrent_case_variants_have_one_winner`; account-manager create/edit case. |
| AC4 / verification 4 | `test_partial_edit_and_transaction_free_delete`, `test_second_user_cannot_read_edit_or_delete_first_users_account`, `test_delete_with_transactions_returns_conflict_without_losing_data`, `test_downgrade_rejects_seed_referenced_by_an_account`, account-manager confirmation case. |
| AC5 / verification 5 | HTTP invalid/unknown/foreign/conflict/bearer/503 cases, including local connection outage and retained rows; account-manager conflict/outage, expired-session and API-401 cases. |
| AC6 / verification 6 | `signed-in home links to accounts and hides link on sign-out`; account-manager list, `/me` default, CRUD, form validation, conflict, loading/empty/outage, sign-out/in-flight, identity switch, expiry and 401 cases. Auth-status existing cases cover the unchanged login lifecycle. Narrow-layout usability and actual browser focus behavior also require implementation-stage browser verification; the current RED assertions cover labeled keyboard-reachable controls, not pixel layout. |
| AC7 / verification 7 | PostgreSQL upgrade/downgrade/re-upgrade, legacy preflight and concurrent index tests; two-user HTTP and local CORS-preflight tests; the 146 existing backend tests include scoped 003 repositories and migration chain. Strict mypy, import-linter, full coverage, frontend lint/types/build and scans are GREEN/ship checks, not falsely claimed as RED test cases. |

The application seam uses fake existing 003 ports, the HTTP seam uses
FastAPI dependency overrides and a disposable PostgreSQL database, and the
browser seam uses offline Supabase/fetch fakes. Database conflicts are
observed through PostgreSQL; no precheck-only implementation could pass the
two-connection race test.
