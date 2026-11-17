# 006: Accounts architecture plan

## Status and approvals

- [Spec](spec.md), [issue #36](https://github.com/donkey-king-kong/tallyhold/issues/36):
  Zack approved Gate 1 on 2026-11-17; pushed as `c5469b8`.
- **Approved by Zack on 2026-11-17 as written at `ab58947`.**
  RED tests may start; migration and implementation remain gated on an
  independent RED `APPROVE`. Track A alone writes Alembic until 006 merges.
- The plan covers the SG broker seed, replacement of 003's case-sensitive
  account-name constraint, the 005 current-user dependency, 003 repository
  ports and a minimal `/accounts` UI. No CI, Compose or AGENTS.md edits.

## Approach and boundaries

1. Keep `/api/v1/health` public; protect `GET /api/v1/brokers` and all
   `/api/v1/accounts` methods with the existing top-level
   `app.dependencies.get_current_user`. Feed only the resolved internal
   `User.id` to account use cases. A route also uses the same cached
   `get_db_session` dependency for repositories, so identity resolution and
   account writes share one request transaction; commit on success and
   rollback on failure. A missing session or verifier is 503, never an
   anonymous list. Do not import identity-module internals into accounts.
2. Use the existing `BrokerRepository.get/list_all` and
   `AccountRepository.get/list_for_user/save/delete` ports. One accounts
   application module exposes account CRUD and the read-only broker list
   through those two ports; it hides name normalization, scoped lookup,
   ordering and broker enrichment from callers without an extra
   pass-through catalog class. It depends on pure account models, not
   SQLAlchemy or FastAPI. A pure account-name validator trims input, requires
   1-255 characters and preserves display case; the existing currency
   normalizer accepts ASCII letters only and uppercases them. Construct
   immutable `Account` objects with a generated UUID and the resolved owner.
   On PATCH load the scoped account first and replace only supplied fields;
   never pass `broker_id`, `id` or `user_id` from a body to `save`.
3. Account list results are assembled from one scoped account list and one
   shared broker list, sorted by `(name, id)`; broker results use the same
   stable ordering. Detail uses scoped account lookup and broker lookup.
   The application read model includes `broker_name`; Pydantic serializes
   it in presentation. Shared broker rows have no fake `user_id`. A missing
   broker referenced by an account is an integrity failure, not an empty
   account or a leaked driver error.
4. Validate extra/immutable fields and empty PATCH in presentation request
   schemas (`extra="forbid"`); domain/application validate names and currency.
   The application raises account-module, framework-free missing/duplicate/
   in-use failures. The SQLAlchemy adapter maps only recognized account
   unique and FK constraint names to these failures; unknown persistence
   errors are not disguised as user mistakes. A presentation error mapping
   turns them into 404/409 without SQL or other-user details. Malformed
   UUIDs/fields are 422. There is no precheck-only duplicate guarantee:
   PostgreSQL's unique index is authoritative under concurrent writes.
5. Deleting first checks scoped ownership through `get`, then calls the
   existing scoped `delete`. The transaction/account composite FK remains
   `NO ACTION`; its named constraint maps to an in-use 409 with rollback.
   Missing and foreign-owned account IDs have identical 404 responses.
   No transaction data is deleted or archived by this feature.

## Files and layers

| Planned path | Responsibility |
| --- | --- |
| `backend/app/modules/accounts/domain/{models,repositories}.py`, new `domain/errors.py` | Keep `Broker`/`Account` and existing ports; add pure name validation and account-specific failures. No framework/DB dependency. |
| `backend/app/modules/accounts/application/accounts.py` | One accounts use-case module for scoped CRUD, broker list, UUID generation, immutable updates and response read model. No identity internals, SQL or HTTP status codes. |
| `backend/app/modules/accounts/infrastructure/{models,repositories}.py` | Replace the mapped old name constraint with a unique expression index, preserve tenant predicates and adapt named DB violations to account failures. Broker writes remain infrastructure-only for seed/testing, not exposed by HTTP. |
| `backend/app/modules/accounts/presentation/{router,schemas,errors}.py` | `GET /brokers`, `GET/POST /accounts`, `GET/PATCH/DELETE /accounts/{account_id}` under `/api/v1`; strict request schemas, response serialization, 201 `Location`, 204, generic 404/409 mappings. |
| `backend/app/dependencies.py`, `backend/app/main.py` | Compose repositories against the request session, register account router, add only GET/POST/PATCH/DELETE to configured-origin CORS. Retain bearer auth, public health, omitted credentials and origin allow-list. |
| `backend/alembic/versions/0004_accounts_catalog.py` | Follow `0003_auth_identity`: seed Tiger and IBKR with country SG, replace `uq_broker_accounts_user_id_name` with unique `(user_id, lower(name))` expression index; reversible, preflighted migration below. Do not edit earlier revisions. |
| `backend/tests/{unit,integration}/test_accounts_*.py`, `backend/tests/integration/test_migrations.py` | Application isolation/validation tests, FastAPI authenticated two-user/error/CORS tests, direct PostgreSQL uniqueness/race/delete tests and migration round-trip. Adapt 003 tests that assumed `head` retained 003's old constraint. |
| `frontend/lib/authenticated-session.ts`, `frontend/lib/accounts-api.ts`, `frontend/components/auth-status.tsx`, `frontend/components/account-manager.tsx`, `frontend/app/{page.tsx,accounts/page.tsx}` | Reuse 005 session lifecycle, authenticate bearer-only account requests, link signed-in home to focused account manager. Preserve auth behavior and clear private state on sign-out, expiry or user switch. |
| `frontend/components/{auth-status,account-manager}.test.tsx`, `frontend/lib/accounts-api.test.ts` | Mock token/session and API; assert UI CRUD, recovery, accessibility, no stale account display or post-expiry mutation. Existing 005 tests remain green. |
| `docs/adr/0004-account-name-and-broker-catalog.md`, `GLOSSARY.md`, `README.md` (if needed) | Record migration trade-offs, domain terms and local catalog/account API usage without CI/Compose/AGENTS changes. |

No new persistence port, broker-write route, identity API, cross-module import,
live credentials, position table or FX calculation is needed. Add no dependency
lock change unless implementation reveals a separately approved necessity.

## Migration and existing data

`0004_accounts_catalog` is the only new revision and points to
`0003_auth_identity`. The legacy `UNIQUE (user_id, name)` must be **replaced**,
not left alongside the new uniqueness rule. `UNIQUE (user_id, id)`, account
and transaction FKs, currency checks and other columns stay unchanged.
Reflect the index in SQLAlchemy metadata to avoid Alembic drift.

Upgrade uses a transactional PostgreSQL migration. Lock `broker_accounts`
against concurrent writes during preflight and DDL. Before altering any
row or constraint, detect noncanonical existing names (blank or differing
from the same trimming rule used by the application), and grouped
`(user_id, lower(name))` collisions. Abort with a concise, non-identifying
remediation error if any exist; do not rename or merge an investor's
accounts automatically. Remediation of real production rows is a separate
operator-approved step. For a clean table, create the named unique index
`uq_broker_accounts_user_id_name_ci` on `(user_id, lower(name))`, then drop
`uq_broker_accounts_user_id_name`. Creation and drop happen atomically so
a failure leaves the 003 constraint and rows intact. PostgreSQL's
database collation defines `lower` comparisons; app code does not rely
on a weaker precheck. Keep the display spelling in `name`.

Seed the two literal catalog keys `(Tiger, SG)` and `(IBKR, SG)` with
reserved, stable UUIDs in the migration. Insert only a missing
`(name, country)` pair using the existing broker unique key; reuse any
pre-existing row/ID and never update its name or country. Before insertion,
fail if **any** reserved UUID already exists, even on a matching pair;
otherwise downgrade could mistake a pre-existing row for its own seed.
Do not overwrite. A repeated safe upgrade cannot duplicate catalog entries.
Seed rows remain shared reference data and have no `user_id`.

Downgrade restores the old named unique constraint **before** dropping
the new index; the stronger index ensures no exact duplicates. Delete
only rows matching the reserved seed IDs and literal keys, never an
existing row with a different ID. If a seeded row is referenced by an
account, downgrade must stop with a clear error, leaving the entire
transaction, rows and index unchanged; operators must not cascade or
silently reassign accounts. Test downgrade/re-upgrade on fresh and
pre-seeded disposable PostgreSQL databases, and blocked downgrade when
referenced. No automatic destructive production downgrade is promised.

The historical 003 migration remains unchanged. Its tests of `0002`
must assert 003's original constraint at `0002`; tests against new `head`
must assert only the 006 expression index, both tenant candidate keys and
the broker seed. Adjust catalog comparisons that currently equate a
`0002` snapshot to `head`; compare like revisions instead. A fresh
PostgreSQL test also plants legacy `Main`/`main` or padded rows before
0004 and proves the failed upgrade rolls back without rewriting rows or
advancing `alembic_version`.

## API and browser contracts

| Route | Use case and response |
| --- | --- |
| `GET /api/v1/brokers` | Read-only, authenticated, 200 plain array of `{id,name,country}`, ordered by name then ID. |
| `GET /api/v1/accounts` | Scoped list, 200 plain array, including `[]`, ordered by name then ID. |
| `GET /api/v1/accounts/{id}` | Scoped detail, 200 object or indistinguishable 404 for absent/foreign. |
| `POST /api/v1/accounts` | Body `{broker_id,name,currency}`; 201 object and detail `Location`; unknown broker 404, duplicate name 409. Server owns account/user IDs. |
| `PATCH /api/v1/accounts/{id}` | Nonempty body with `name` and/or `currency`; 200 object. Omitted values stay; broker/user/ID fields 422. |
| `DELETE /api/v1/accounts/{id}` | 204 for owned transaction-free account; 404 for absent/foreign and 409 on transaction FK, without deletion. |

The response account object is `{id,broker_id,broker_name,name,currency}`.
For any route, invalid token gets 401 and auth/DB unavailability is not
reported as a successful empty result. Map actual session/connection
outages to a generic 503 in the top-level request composition as well as
the existing missing-config cases; do not change the identity trust model.
Strict schema errors and malformed UUIDs are 422; recognized conflicts
are 409. Do not echo raw SQL or user identifiers from exceptions.
Preserve Feature 005's request session commit/rollback and never return
an ORM row to a router.

The `/accounts` page uses the same browser Supabase client/session source
as `AuthStatus`, not a second identity system. Extract a small reusable
session hook or equivalent shared abstraction without changing 005's
observable sign-in/out behavior. On a valid session fetch `/me` for the
default account currency, then brokers and the scoped list; every account
request has `Authorization: Bearer` and `credentials: "omit"`. Expiry,
sign-out, user switch or a 401 invalidates displayed account data,
aborts/ignores in-flight responses and prevents further writes. Distinguish
503/network outage from a true empty list; preserve form values on
validation/409 failures, offer a broker-not-listed explanation, use a
clear delete confirmation and accessible focus/feedback on mobile.
Currency is only an entry default; Phase 4 reporting and FX are untouched.

## Verification map

| Criterion | Test seam and expected evidence |
| --- | --- |
| AC1 | Offline bearer-injected FastAPI broker list: same SG catalog for two users, stable ordering, no writes; PostgreSQL seed with pre-existing row/ID and idempotent upgrade. |
| AC2 | FastAPI two-user list/detail and foreign/unknown 404, no owner parameter, broker-name response; application fake ports for sorting and missing broker integrity. |
| AC3 | Unit name/currency/immutable PATCH tests; PostgreSQL index direct SQL and two-connection duplicate race; create/update response/Location and rollback on 409. |
| AC4 | Two-user delete, unknown/foreign 404 and transaction FK 409 with account/transaction preservation; blocked migration downgrade. |
| AC5 | Strict schema 422, opaque 404/409, token 401, verifier/DB 503, aborted transaction and no driver internals. |
| AC6 | Vitest CRUD, `/me` currency default, sign-out/expiry/user-switch abort, bearer with omitted credentials, empty/loading/error states, confirmation, keyboard labels and narrow layout; 005 auth tests still pass. |
| AC7 | Import-linter, mypy strict, PostgreSQL catalog/upgrade/downgrade/re-upgrade, scoped repository tests, configured-origin CORS/preflight, backend/frontend full checks. |

The Test writer starts with failing tests mapped to these criteria,
commits/pushes RED evidence and stops for a fresh independent RED review.
Only after RED approval does the Implementer write schema/code. Reuse
Feature 003's disposable PostgreSQL 17 fixture; do not use a live
database, SQLite substitute, `create_all()` or live Supabase calls.
Account tests should use local JWT fixtures or dependency overrides and
assert no unauthenticated data access. Existing full backend ruff check/
format, mypy, import-linter, pytest coverage >=80%, frontend lint/
Prettier/typecheck/Vitest/build, migration round-trip and dependency/
secret scans remain required before ship.

## Plan-gate decision

Zack's approval accepts one 0004 transactional revision after 0003; safe
seed reuse with stable reserved IDs and guarded rollback; legacy-name
preflight with no silent data rewrites; a PostgreSQL unique expression
index `(user_id, lower(name))` replacing 003's named constraint; typed
account failures at the module boundary; composition through the 005
request session/current user and 003 ports; a focused `/accounts` UI
sharing 005's session lifecycle; and the RED/review/GREEN order above.
The explicit plan approval was given at `ab58947`, separately from Gate 1.
Material changes to this schema or architecture return to Zack before
execution.
