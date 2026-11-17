# Feature 006 RED review

- Round: 1
- Reviewer: fresh Trae RED Reviewer (`donkey-king-kong` GitHub identity)
- Base: `82ec809`
- Pushed RED head: `112848554a86aae44d605dfa7e5052c0fe8d4c1a`
- Scope: approved spec/plan/tasks, cumulative base-to-head diff, `red-test-run.md`, and relevant existing tests. No implementation changes or test writes.

## Coverage mapping

| Approved criterion / numbered plan verification | RED evidence | Uncovered behavior |
| --- | --- | --- |
| AC1 / 1 | `test_brokers_are_shared_read_only_and_account_reads_are_scoped`; migration seed, pre-existing-ID round-trip and reserved-ID collision tests; account-manager catalog test | Reserved UUID already occupying the *matching* seed pair is not rejected by a test; explicit migration decision. |
| AC2 / 2 | `test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels`; two-user HTTP list/detail; fake scoped ports | Missing broker referenced by an account is not asserted as an integrity failure; no direct proof that HTTP ownership uses resolved internal `User.id` rather than a JWT `sub` or caller-supplied identity. |
| AC3 / 3 | Application name/currency/PATCH tests; HTTP 201/Location, validation and 409 tests; direct SQL index and two-connection race | Boundary name length 255, padded duplicate, and concurrent HTTP 409 are not directly asserted; PostgreSQL race does check the authoritative invariant. |
| AC4 / 4 | `test_partial_edit_and_transaction_free_delete`, foreign delete, transaction-preserving 409, guarded downgrade | Unknown DELETE and its indistinguishable response from foreign DELETE are not asserted. |
| AC5 / 5 | Strict POST/PATCH errors, opaque duplicate text, list 401/503, local connection outage, retained rows | Protected detail/write routes lack unauthenticated/invalid-token tests; unknown versus foreign PATCH/DELETE response equivalence, malformed PATCH/DELETE UUIDs, and generic 503 for broker/write paths are untested. |
| AC6 / 6 | Home link; `account-manager.test.tsx` lists, defaults `/me` currency, CRUD, confirmation, form recovery, bearer/omit, loading/empty/outage, session transitions | No test renders `/accounts` page to prove it mounts the manager; no post-sign-out/expiry attempted write or narrow-layout/focus assertion. Browser verification may supplement visual layout later, but the required page wiring needs RED evidence. |
| AC7 / 7 | Existing scoped repository tests, direct PostgreSQL migration/index/race tests, two-user HTTP and CORS preflight, existing auth tests | Application purity/import-boundary and metadata/index drift are not directly asserted by RED; import-linter, mypy, coverage, full frontend checks and scans remain GREEN/ship checks, not claimed RED passes. |

## Checklist findings

1. **Acceptance and verification mapping: changes requested.** All AC1-AC7 and plan items 1-7 have at least a related test, but the explicitly uncovered behaviors above cannot be inferred from those tests. In particular, `test_account_routes_require_bearer_and_preserve_public_health` tests only `GET /brokers` and `GET /accounts`; no protected detail or mutation is exercised without a token (`backend/tests/integration/test_accounts_http.py`). Add rejected unauthenticated/invalid-token requests for GET detail, POST, PATCH and DELETE, with retained rows after denied writes.
2. **Observable plan decisions: changes requested.** `test_reserved_seed_id_collision_rejects_upgrade_without_overwriting` uses `Unrelated Fixture`, so an upgrade that silently reuses a reserved UUID already attached to `IBKR, SG` would pass, contrary to the migration plan's "even on a matching pair" rule (`backend/tests/integration/test_accounts_migration.py`). Add that case and assert the revision and rows stay unchanged. The fake-port read test always supplies every broker; add an orphaned account/broker read to reject returning an empty list or leaking a driver error (`backend/tests/test_accounts_application.py`). Test absent versus foreign PATCH/DELETE response equality, not only GET equality.
3. **RED cause: none.** `red-test-run.md` reports 44 targeted backend failures with zero collection/setup errors (missing 0004, account operations and routes), and nine frontend failures from the missing component/home link. The earlier run without the local test URL is explicitly excluded. These are missing feature behavior, not network or fixture failures. The pushed head contains no production migration or account implementation.
4. **Behavioral assertions: changes requested.** The HTTP tests do exercise public routes and persisted rows, and the migration race would reject a precheck-only uniqueness implementation. However, `account-manager.test.tsx` imports the component directly and `auth-status.test.tsx` checks only the link href: `/accounts` can remain an empty page while both pass. Add a page-level render test. The UI session tests clear an in-flight list or hide existing rows, but never attempt a write after sign-out/expiry; assert no POST/PATCH/DELETE occurs when a stale form action is attempted. The approved narrow-screen/focus behavior also has no direct assertion or recorded browser evidence.
5. **Infrastructure: none.** Existing `integration/conftest.py` restricts disposable databases to local PostgreSQL 17 test URLs and drops them. New API tests use dependency overrides, UI tests use offline auth/fetch fakes, and the outage test uses a local closed port. No real secrets or external network calls appear in the test diff.
6. **Existing suite: none on available evidence.** The cumulative diff changes historical migration assertions to 0002 and replaces colliding Tiger fixtures with a non-seed broker while retaining the original assertions. `red-test-run.md` records 146 pre-existing backend passes and 13 frontend passes with the one new home-link test deliberately excluded; no existing test was deleted or skipped. These are recorded runs, not independently rerun in this read-only review. `git diff --check` passes.

No approved spec or plan revision is proposed. Add focused RED tests for the stated gaps, rerun targeted RED and existing suites, and submit a fresh round 2 review before GREEN.
VERDICT: CHANGES_REQUESTED

## Round 2 independent review

- Reviewer: fresh Trae RED Reviewer, round-2 session (distinct from the round-1 reviewer; GitHub commenter `donkey-king-kong`)
- Base: `82ec809`
- Pushed RED head: `47c2fdb6ca7fa71b431fe4aeef627db6f523569e`
- Scope: approved spec/plan/tasks, cumulative base-to-head test diff, corrected RED run, round-1 review, relevant existing tests and read-only reruns at the reviewed head.

### Coverage mapping

| Criterion / numbered plan verification | Tests and remaining gap |
| --- | --- |
| AC1 / 1 | `test_head_seeds_shared_sg_brokers_and_replaces_exact_name_constraint`, pre-existing-ID round-trip, both reserved-ID collision parameters, shared HTTP catalog and account-manager broker choice. **Uncovered:** broker catalog ties by name must sort by stable ID; the unit brokers have different names and the HTTP assertion filters only Tiger/IBKR. |
| AC2 / 2 | `test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels`, orphaned-broker error, two-user HTTP list/detail and absent/foreign 404; no uncovered AC2 item. |
| AC3 / 3 | Application trim/255-character/currency/PATCH cases, HTTP 201/Location/422/409 and concurrent 201/409, direct PostgreSQL uniqueness/race; no uncovered AC3 item. |
| AC4 / 4 | Owned/foreign/absent DELETE, transaction-preserving 409 and guarded downgrade; no uncovered AC4 item. |
| AC5 / 5 | Invalid IDs/fields, opaque conflicts, bearer 401 on detail/writes, verifier/database 503, retained rows; no uncovered AC5 item. |
| AC6 / 6 | Home link, page mount, account-manager CRUD, confirmation, loading/empty/outage, session transitions, bearer/omit, labeled focus and invalid currency. **Uncovered:** visible broker name on a populated account row; editable lowercase three-letter currency normalized to uppercase in the form/write. Narrow-screen pixel usability remains a GREEN browser check, not a jsdom claim. |
| AC7 / 7 | PostgreSQL migration/index/race and scoped repository tests, two-user HTTP/CORS, existing auth tests. Import boundaries, metadata drift, mypy, coverage, lint, build and scans remain GREEN/ship checks; no RED test is claimed for those tool checks. |

### Round-1 findings

- Protected detail/write 401 and retained-row checks: addressed by `test_detail_and_writes_reject_missing_or_invalid_bearer_without_mutation`.
- Matching reserved UUID collision: addressed by the `IBKR` parameter in `test_reserved_seed_id_collision_rejects_upgrade_without_overwriting`; preflight rollback/revision is checked.
- Orphaned broker: addressed by `test_orphaned_account_broker_is_an_integrity_error_not_an_empty_read`.
- Absent/foreign PATCH and DELETE equality, malformed write IDs, broker/write 503, 255-character name and padded/concurrent conflicts: addressed in the application and HTTP tests.
- `/accounts` page mount and post-sign-out stale action: addressed by `page.test.tsx` and the sign-out/in-flight account-manager case. Labeled input focus is asserted; narrow-screen layout still needs browser verification after implementation. Application import purity and metadata drift remain explicit GREEN checks.

### Checklist findings

1. **Acceptance/verification mapping: changes requested.** Every AC and numbered verification item has related RED evidence, but AC1's broker `(name, id)` tie and AC6's populated-row broker name and lowercase editable currency behaviors lack the assertions identified above.
2. **Observable plan decisions: changes requested.** `backend/tests/test_accounts_application.py:59-73` lists only distinctly named brokers, and `backend/tests/integration/test_accounts_http.py:76-83` checks only the two distinct seed names. A broker catalog ordered by name alone can pass even when two countries share a broker name. Add a same-name/different-ID ordering case. In `frontend/components/account-manager.test.tsx:107-152`, a created row has `broker_name` in the mock response but only `Main`/`Growth` are asserted visible; omitting the displayed broker passes. The form test checks default `SGD` and rejects `US1` but never types `usd` and checks uppercase normalization (`:68-88`, `:302-336`). Add those UI assertions.
3. **RED cause: none.** At this head, targeted backend rerun collected 49 failures (10 migration, 27 HTTP, 12 application), no collection/setup errors; frontend rerun collected 18 cases, 10 feature failures and eight passes. Failures stem from missing 0004, account service/routes/CORS and UI, not fixtures or a remote network. The handoff names `4843f4d` while frontend tests changed before the supplied head; the independent head-level reruns confirm the same reported counts and causes.
4. **Behavioral assertions: changes requested.** Most new tests exercise public HTTP/SQL interfaces and DOM interactions, and the two-connection race rejects a precheck-only uniqueness implementation. The three uncovered behaviors above still admit plausible wrong implementations (unstable broker ties, accounts without visible broker labels, and a UI that never uppercases an editable lowercase currency).
5. **Allowed infrastructure: none.** Existing `backend/tests/integration/conftest.py` confines database creation to disposable local PostgreSQL 17 targets; HTTP overrides and frontend fakes use offline auth, and the outage test targets a local closed port. No live credentials or external network appear in the reviewed tests.
6. **Existing suite: none.** Cumulative diff retains existing assertions while moving 003 constraint checks to revision 0002 and renaming broker fixtures to avoid seed collisions. Independently rerun at the reviewed head: 146 existing backend tests pass; 13 existing frontend tests pass with only the new home-link test excluded (one skip). No pre-existing test is deleted or weakened. `git diff --check 82ec809 47c2fdb6ca7fa71b431fe4aeef627db6f523569e` passes.

Round 2 is the last reviewer round. These gaps require coordinator escalation before GREEN; no spec or plan change is proposed here.
VERDICT: CHANGES_REQUESTED

## Exceptional round 3 independent review

- Reviewer: fresh Trae RED Reviewer, this round-3 session, distinct from the round-1 and round-2 sessions; GitHub commenter `donkey-king-kong`.
- Base: `82ec809`
- Pushed RED head: `c21ef065e9e3ecfabe9eb5d26901f8da95dbb713`
- Scope: approved spec/plan/tasks, cumulative base-to-head diff, RED run, prior rounds, relevant existing tests and independent read-only reruns at this head.

### Coverage mapping

| Criterion / numbered plan verification | Tests and uncovered behavior |
| --- | --- |
| AC1 / 1 | `test_head_seeds_shared_sg_brokers_and_replaces_exact_name_constraint`, pre-existing-ID and both reserved-ID collision cases, `test_brokers_with_the_same_name_are_ordered_by_stable_id`, shared authenticated HTTP catalog and UI broker choice. None uncovered. |
| AC2 / 2 | `test_brokers_and_owned_accounts_have_stable_name_order_and_broker_labels`, orphaned-broker failure, two-user HTTP list/detail and identical absent/foreign 404. None uncovered. |
| AC3 / 3 | Application trim, 255-character boundary, currency and partial PATCH; HTTP 201/Location, strict payloads, immutable broker, padded/renamed/concurrent conflicts; direct SQL per-user expression-index behavior and two-connection race. None uncovered. |
| AC4 / 4 | Owned and foreign/absent DELETE, transaction-preserving 409, blocked downgrade, UI confirmation. None uncovered. |
| AC5 / 5 | HTTP malformed/extra/empty 422, opaque 404/409, detail/write bearer 401 with row retention, verifier and local DB 503; UI conflict/outage/expiry/401. None uncovered. |
| AC6 / 6 | Home link, page mount, visible populated-row broker label, editable lowercase currency uppercase in form and POST, CRUD, loading/empty/errors, focus, sign-out/stale action, switch and expiry in `account-manager.test.tsx`. Narrow-screen pixel usability remains a GREEN browser check, not a jsdom claim. |
| AC7 / 7 | PostgreSQL migration/index/race, existing scoped repositories, two-user HTTP isolation, configured-origin CORS and denied foreign origin, existing auth tests. **Uncovered:** rejection of an unneeded CORS preflight method (for example PUT). Import-linter, mypy, metadata drift, coverage, lint/build and scans remain GREEN/ship checks. |

### Prior findings

Round-1 auth, collision, orphan, absent/foreign write, page and stale-action findings remain addressed by the cumulative tests as recorded in round 2. Round-2's three gaps are addressed: `test_brokers_with_the_same_name_are_ordered_by_stable_id` reverses input order and asserts stable IDs; the create/edit UI test asserts the populated row adds another visible `IBKR`, changes `usd` to `USD` in the form, and inspects POST currency `USD`. No approved spec or plan change is proposed.

### Checklist findings

1. **Acceptance and numbered verification: changes requested.** AC1-AC6 and plan items 1-6 have the mapped evidence above. AC7/verification 7 requires CORS to permit *only* the needed methods, but `test_write_preflight_allows_configured_origin_without_cookies` in `backend/tests/integration/test_accounts_http.py` tests only the four allowed methods and a denied origin. It never sends PUT (or another unneeded method) from an allowed origin.
2. **Observable plan decisions: changes requested.** `plan.md` specifies "add only GET/POST/PATCH/DELETE to configured-origin CORS." A middleware configured with PUT in addition would satisfy every current CORS assertion, including the attacker-origin denial. Add an allowed-origin preflight for an unneeded method asserting rejection/no permissive allow-methods result. Other tested decisions include reserved UUID collision even on a matching key, migration preflight/rollback and guarded downgrade, scoped internal-user operations, response codes, ordering and concurrent uniqueness.
3. **RED cause: none.** Independent targeted reruns at this head: 50 backend failures (10 missing migration/seed/index, 27 missing routes/CORS, 13 missing application operations), zero setup/collection errors; frontend 10 failures (eight missing manager, one missing link, one missing page) and eight passes. Local PostgreSQL responds; no external network failure explains RED.
4. **Behavioral assertions: changes requested only for the CORS negative case.** SQL tests inspect persisted rows and enforce a two-connection case-conflict race; HTTP tests exercise route responses and row retention; UI tests assert DOM, writes, bearer and stale-session effects. Those assertions reject plausible wrong implementations for the mapped behaviors. The missing PUT preflight permits the overbroad CORS implementation described in finding 2.
5. **Allowed infrastructure: none.** `backend/tests/integration/conftest.py` enforces uniquely named, disposable local PostgreSQL 17 databases; auth overrides and browser fetch/Supabase fakes are offline, and outage testing uses a local closed port. No live secrets or external calls appear in the test changes.
6. **Existing suite: none.** The cumulative diff preserves historical 003 assertions at revision 0002 and renames colliding broker fixtures without removing their assertions. Independently rerun: 146 pre-existing backend tests pass; 13 frontend tests pass with the one new home-link case deliberately excluded. No pre-existing test is deleted or weakened. `git diff --check 82ec809 c21ef065e9e3ecfabe9eb5d26901f8da95dbb713` passes.

Zack authorized this exceptional third round; this verdict does not begin GREEN. Add the focused CORS rejection RED case and rerun targeted and existing suites before coordinator resolution.
VERDICT: CHANGES_REQUESTED
