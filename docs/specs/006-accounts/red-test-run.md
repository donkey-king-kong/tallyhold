# Feature 006 RED handoff

- Approved contract: `spec.md` and `plan.md` (plan approved at `ab58947`).
- Base before RED: `82ec809`; round 1 test-only commit: `771e9ad`;
  corrected round 2 test-only commit: `4843f4d`; Zack-authorized exceptional
  correction: `161a3d9`.
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
| `uv run pytest -q --tb=no tests/integration/test_accounts_migration.py tests/integration/test_accounts_http.py tests/test_accounts_application.py` | 1 | 50 collected, 50 failed, 0 setup/collection errors. Missing `0004` and its seeds/index (10 migration cases); missing HTTP routes or write CORS (27 HTTP cases); missing application operations (13 cases). |
| `uv run pytest -q --tb=short --ignore=tests/integration/test_accounts_migration.py --ignore=tests/integration/test_accounts_http.py --ignore=tests/test_accounts_application.py` | 0 | 146 collected and passed, none failed or skipped. Existing 003 historical-schema assertions were relocated to their original revision; existing broker fixtures use a non-seed name without dropping assertions. |

Run from `frontend/`:

| Command | Exit | Result and failure cause |
| --- | --- | --- |
| `npm test -- components/account-manager.test.tsx components/auth-status.test.tsx app/accounts/page.test.tsx` | 1 | 18 collected: 10 failed, 8 passed, none skipped. Eight account-manager cases cannot import the as-yet-unwritten component; the new home-link case cannot find the link; the new `/accounts` page is absent. |
| `npm test -- --exclude components/account-manager.test.tsx --exclude app/accounts/page.test.tsx --testNamePattern='^(?!signed-in home links to accounts)'` | 0 | 14 collected: 13 passed, 1 deliberately skipped (the new link case); no existing failure. Existing React `act(...)` warnings remain. |

The first attempted round 1 backend run lacked the test URL and produced
fixture setup errors. It is **not** RED evidence; the backend results above
are exceptional-round reruns at `161a3d9` with the required local test URL.
Warnings are existing Starlette/httpx, Alembic configuration and React test
environment warnings, not test failures.

## Coverage map

| Approved criterion and plan verification item | RED tests at the public seam |
| --- | --- |
| AC1 / verification 1 | `test_head_seeds_shared_sg_brokers_and_replaces_exact_name_constraint`, `test_preexisting_broker_id_survives_upgrade_downgrade_and_reupgrade`, `test_reserved_seed_id_collision_rejects_upgrade_without_overwriting` (unrelated and matching reserved-ID occupants), `test_brokers_with_the_same_name_are_ordered_by_stable_id`, shared HTTP catalog, account-manager broker choice and broker-not-listed case. |
| AC2 / verification 2 | `test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels`, `test_orphaned_account_broker_is_an_integrity_error_not_an_empty_read`, two-user HTTP list/detail and absent/foreign comparisons, `test_unknown_broker_and_foreign_account_leave_rows_untouched`. HTTP auth override supplies an internal UUID independently of the opaque offline token; POST rejects client-supplied owner. |
| AC3 / verification 3 | Application create/invalid-name/currency/partial-update and exact 255-character boundary; HTTP create, invalid payloads, partial PATCH, padded duplicate, duplicate POST/PATCH, concurrent HTTP 201/409 and immutable-field cases; `test_name_index_rejects_case_variant_within_user_but_not_across_users`, `test_concurrent_case_variants_have_one_winner`; account-manager create/edit case. |
| AC4 / verification 4 | `test_partial_edit_and_transaction_free_delete`, `test_second_user_cannot_read_edit_or_delete_first_users_account` (also compares absent/foreign DELETE response), `test_delete_with_transactions_returns_conflict_without_losing_data`, guarded downgrade and account-manager confirmation. |
| AC5 / verification 5 | HTTP invalid/unknown/foreign/conflict/bearer/503 cases, including malformed PATCH/DELETE IDs, absent/foreign PATCH/DELETE equivalence, denied detail/writes with row retention, missing DB for broker/create and local connection outage; account-manager conflict/outage, expired-session and API-401 cases. |
| AC6 / verification 6 | `signed-in home links to accounts and hides link on sign-out`; `/accounts page mounts the account manager`; account-manager list and populated-row broker label, `/me` default, lowercase editable currency uppercased in form and POST, CRUD, validation, conflict, loading/empty/outage, focused labeled name input, sign-out/stale action/in-flight response, identity switch, expiry and 401 cases. Auth-status existing cases cover the unchanged login lifecycle. Actual narrow-screen layout remains an implementation-stage browser check because jsdom does not lay out pixels. |
| AC7 / verification 7 | PostgreSQL upgrade/downgrade/re-upgrade, legacy preflight and concurrent index tests; two-user HTTP, protection of writes and local CORS-preflight tests; the 146 existing backend tests include scoped 003 repositories and migration chain. Metadata/index drift, strict mypy, import-linter, full coverage, frontend lint/types/build and scans are GREEN/ship checks, not falsely claimed as RED test cases. |

The application seam uses fake existing 003 ports, the HTTP seam uses
FastAPI dependency overrides and a disposable PostgreSQL database, and the
browser seam uses offline Supabase/fetch fakes. Database conflicts are
observed through PostgreSQL; no precheck-only implementation could pass the
two-connection race test.

## Round 1 findings addressed

The independent [round 1 report](red-review.md) and its identical commit
comment requested missing auth coverage, matching reserved UUID collision,
orphaned broker read, absent/foreign write equivalence and page wiring. The
corrected test commit `4843f4d` adds each of these plus boundary-length,
padded/concurrent HTTP duplicate, malformed write IDs, broker/create 503,
stale UI action and focus assertions. The reviewed tests remain RED solely
because the 006 migration, application service, routes and UI are absent.
Narrow-layout usability needs browser verification after GREEN; no layout
claim is based on jsdom.

## Zack-authorized exceptional correction

After round 2 returned `CHANGES_REQUESTED`, Zack explicitly authorized one
more corrective RED round with a different fresh review. Test-only `161a3d9`
adds the three missing assertions: same-name broker stable-ID tie ordering,
a populated account row's visible broker name, and lowercase account
currency normalized to uppercase in the form and POST. The four commands
above were rerun at this pinned test SHA: 50 expected backend failures,
146 existing backend passes, 10 expected frontend failures with 8 passes,
and 13 existing frontend passes with one new case deliberately excluded.
