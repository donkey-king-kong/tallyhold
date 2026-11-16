# 003: Schema and repositories tasks

## Approval gate

The [revised plan](plan.md) supersedes the previous design. Feature 003 Gate 1
and the Feature 002 ports are approved. **Zack approved the schema/architecture
plan as written at `15d27fa` on 2026-11-16.** Zack reviewed RED and approved
GREEN after the requested mixed-case instrument lookup test was committed and
pushed at `31a0fa6`. RLS, application wiring, domain changes and production
provisioning are out of scope.

- [x] **Architect, T-0014:** Adopt Zack's replacement plan, add its five-table
  ERD, map AC1-AC7 and verification items 1-6 to ordered work, and hand it
  back for review. Trace: plan "Status and gate", "Relational design and
  Architecture Q2", "Acceptance and test map"; AC1-AC7.
- [x] **Zack plan gate:** Decide on every choice in plan "Decision for
  approval", including `entry_seq`, composite tenant/currency FKs, scoped
  upsert, error translation, audit and unique constraints, `NO ACTION`, exact
  numeric limits, five-table scope and deferred behavior. Record approval or
  requested edits before assigning implementation; AC1, AC2, AC5, AC7.

## RED: After approval only

The Test writer commits collecting, behavior-failing tests separately from
GREEN. All repository/migration evidence uses real PostgreSQL from Compose
locally (equivalent PostgreSQL 17 service in CI), never SQLite or `create_all()`.
Test each repository only for operations exposed by its Feature 002 port.

- [x] **PostgreSQL harness and migration RED:** Create unique disposable
  databases from an explicit test URL, apply Alembic before tests, roll back
  each test and drop databases even after failure. Assert fresh
  `base -> 0001_baseline -> 0002_core_persistence`, catalog table/column/type/
  key/check/index agreement, no positions table, `0002 -> 0001 -> 0002`
  normalized catalog equivalence, and failing revision/direction diagnostics.
  Trace: plan "Persistence boundary", "Migrations and real PostgreSQL
  verification" items 1-2; AC1-AC3, AC6.
- [x] **Schema and constraint RED:** Exercise all five mapped tables, UUID
  keys, mandatory/canonical currency, BUY/SELL and positive quantity/price/
  nonnegative fee checks, `NUMERIC(20,6)`/`NUMERIC(18,8)` exactness and
  overprecision rejection. Direct SQL must reject cross-user account links
  through `(user_id, broker_account_id)`, mismatched instrument/currency
  links, duplicate `(user_id, name)` accounts, duplicate `(name, country)`
  brokers and `upper(symbol), upper(exchange)` collisions. Assert all FKs
  use `ON DELETE NO ACTION`, referenced-account deletion fails, scoped
  indexes and composite candidate keys exist. Trace: plan "Relational design
  and Architecture Q2", verification items 1, 3, 6; AC2, AC4-AC6.
- [x] **Five-port adapter RED:** Test domain/row round trips and supported
  CRUD for `UserRepository`, `BrokerRepository`, `AccountRepository`,
  `InstrumentRepository`, `TransactionRepository`; shared reference access,
  case-insensitive `find_by_symbol`, owner mismatch, two-user read/write/
  delete isolation, `Money`/`TransactionType`/date/Decimal preservation,
  failed-flush rollback, and no partial commit. Require one
  `PersistenceConstraintError` carrying the constraint name for SQL integrity
  failures without leaking driver exceptions. Trace: plan "Persistence
  boundary", "Repository behavior and transaction ownership", verification
  item 3; AC1, AC4-AC7.
- [x] **Ordering, upsert and audit RED:** Insert same-day BUY then SELL with
  UUIDs in opposite order; assert `(trade_date, entry_seq)` listing supports
  Feature 002 average cost. Assert `entry_seq` is DB-generated, omitted from
  insert/upsert and unchanged by replace-save. For an account and transaction
  ID owned by another user, scoped `ON CONFLICT (id) DO UPDATE ... WHERE
  user_id = EXCLUDED.user_id` affects zero rows, raises one generic error,
  and leaves the foreign row byte-identical. Assert `created_at` on all five
  tables and `updated_at` on accounts/transactions, advancing on update.
  Trace: plan "Relational design and Architecture Q2", "Repository behavior
  and transaction ownership", verification items 4-6; AC2, AC4-AC6.
- [x] **RED checkpoint:** Commit tests separately from production work only
  after confirming their failures come from missing Feature 003 behavior,
  not collection or PostgreSQL setup; verify Feature 002 tests still pass.
  Trace: plan "Acceptance and test map"; AC1-AC7.

## GREEN: After the RED handoff only

Complete in order, with a distinct logical commit and targeted verification
per task. The Implementer does not change tests merely to make them pass.

- [x] **SQLAlchemy rows and Alembic revision:** Add shared Base, per-module
  infrastructure rows and explicit metadata imports. Create all and only the
  five plan tables in `0002_core_persistence` after empty `0001_baseline`,
  with every ERD column, server-generated `entry_seq`, `created_at` everywhere
  and `updated_at` on accounts/transactions; named keys, checks, precise
  numeric types, `NO ACTION` FKs, composite ownership/currency FKs, unique
  constraints, case-insensitive unique index and user-scoped indexes. Reverse
  FK order on downgrade. Trace: plan "Persistence boundary", "Relational
  design and Architecture Q2", "Migrations and real PostgreSQL verification"
  items 1-2, 6; AC1-AC3, AC5, AC7.
- [x] **Shared/root adapters and error type:** Implement the `User`, `Broker`
  and `Instrument` repository ABCs within their infrastructure modules;
  map frozen domain values without ORM leakage, preserve instrument spelling,
  use case-insensitive market lookup, permit shared broker/instrument saves,
  validate exact numeric/currency values when present, and consistently
  translate `IntegrityError` into `PersistenceConstraintError` carrying the
  constraint name. Keep callers in charge of session commit/rollback.
  Trace: plan "Persistence boundary", "Repository behavior and transaction
  ownership", verification items 3, 6; AC1, AC4-AC7.
- [x] **Scoped account adapter:** Implement owner-checked, user-predicated
  get/list/save/delete and scoped `ON CONFLICT (id) DO UPDATE ... WHERE
  broker_accounts.user_id = EXCLUDED.user_id`; check rowcount 0 and raise the
  generic foreign-ID error without changing or disclosing the row. Set
  `updated_at` on replacement, never change `created_at`, flush but do not
  commit, and preserve `NO ACTION` account deletion behavior.
  Trace: plan "Relational design and Architecture Q2", "Repository behavior
  and transaction ownership", verification items 3, 5-6; AC2, AC4-AC5.
- [ ] **Scoped transaction adapter:** Map BUY/SELL, exact quantity, Money
  amounts and explicit instrument currency; reject over-scale/out-of-range
  values before the DB rounds. Use `user_id` in every operation and
  `(trade_date, entry_seq)` listing. Omit server-generated `entry_seq` from
  insert/upsert and UPDATE the owned row on conflict with rowcount check;
  never delete/reinsert or overwrite `entry_seq`/`created_at`. Set
  `updated_at` on replacement, flush without committing, and let the
  composite FK reject cross-user accounts and mismatched instrument currency.
  Trace: plan "Relational design and Architecture Q2", "Repository behavior
  and transaction ownership", verification items 3-6; AC2, AC4-AC5.
- [ ] **CI/docs and final verification:** Document Compose setup and safe
  disposable DB URLs in `README.md`; include integration tests in CI alongside
  the existing fresh-Postgres upgrade/downgrade check without database
  interference. Run all six numbered plan verification items, five-port tests,
  ruff lint/format, strict mypy, import-linter and pytest >=80% coverage;
  verify cleanup after success/failure and no SQLite substitution. Inspect
  the diff for no RLS, positions/P&L tables, domain edits, app services, API
  or frontend. Preserve the plan's "Known limitations" as deferred follow-up
  work only: fee FX, execution time, ISIN/symbol history, GBX normalization,
  non-BUY/SELL types, product-column naming reconciliation and back-dated
  edit validation are not implemented here. Trace: plan "Migrations and real
  PostgreSQL verification" items 1-6, "Known limitations", "Acceptance and
  test map"; AC1-AC7.

The planning handoff is [T-0014](../../work/tickets/T-0014-plan-schema-repositories.md)
and [R-0017](../../work/runs/R-0017.md). RED was completed through
[T-0015](../../work/tickets/T-0015-003-repository-red.md) and
[R-0018](../../work/runs/R-0018.md), with the lookup addition under R-0019.
GREEN is assigned through [T-0016](../../work/tickets/T-0016-003-repository-green.md).
Significant schema changes return to Zack for approval.
