# 002: Core domain model and calculations plan

## Status and authorization

- [Approved spec](spec.md): Gate 1 approved by Zack on 2026-11-13; pure domain
  repository ports approved as a contract amendment on 2026-11-16.
- Plan approval: not required before execution because this feature changes no
  schema or established architecture.
- Scope clarification: the approved contract includes pure abstract repository
  interfaces required by Feature 003. Persistence, SQLAlchemy implementations,
  and migrations remain out of scope.

## Module design

Feature 002 uses the seven established business modules instead of adding a
new `core` module. Business modules exchange stable UUIDs and structural domain
views rather than importing one another, preserving the existing import-linter
independence contract.

| Owner | Domain files | Responsibilities |
| --- | --- | --- |
| shared | `backend/app/shared/domain/money.py` | Immutable `Money` value object shared by transaction and portfolio domains. This is cross-cutting currency-safe value behavior, not a business module. |
| identity | `backend/app/modules/identity/domain/{models,repositories}.py` | Immutable `User`; abstract `UserRepository`. |
| accounts | `backend/app/modules/accounts/domain/{models,repositories}.py` | Immutable `Broker` and `Account`; account stores one `user_id` and one `broker_id`; abstract `BrokerRepository` and user-scoped `AccountRepository`. |
| instruments | `backend/app/modules/instruments/domain/{models,repositories}.py` | Immutable `Instrument`; abstract `InstrumentRepository`. |
| transactions | `backend/app/modules/transactions/domain/{models,repositories}.py` | `TransactionType`, immutable BUY/SELL `Transaction`, invariants, and user-scoped abstract `TransactionRepository`. |
| portfolio | `backend/app/modules/portfolio/domain/{models,cost_basis,calculations}.py` | Immutable derived `Position`, per-sale `RealisedResult`, abstract `CostBasisStrategy`, concrete `AverageCostStrategy`, and pure calculation functions. |

Each domain package `__init__.py` exports its public contract. No Feature 002
source imports a database, ORM, API, HTTP, market-data, FX, or other external
package. Only Python's standard library and `app.shared.domain` are allowed.

## Classes and invariants

- `Money(amount: Decimal, currency: str)` is frozen. It rejects `float` and
  non-`Decimal` amounts, normalizes and validates three-letter currency codes,
  allows negative/zero values, and supports exact same-currency addition and
  subtraction plus multiplication by `Decimal` only.
- `User(id: UUID, base_currency: str)` is frozen and validates its currency.
- `Broker(id: UUID, name: str, country: str)` is frozen.
- `Account(id: UUID, user_id: UUID, broker_id: UUID, name: str,
  currency: str)` is frozen and records exactly one owner and broker.
- `Instrument(id: UUID, symbol: str, exchange: str, name: str,
  asset_type: str, currency: str)` is frozen.
- `Transaction(id, user_id, account_id, instrument_id, trade_date, type,
  quantity, unit_price, fee, instrument_currency)` is frozen. It accepts only
  BUY and SELL, positive `Decimal` quantity and positive unit price,
  non-negative fee, and matching price/fee/instrument currencies. A read-only
  `transaction_kind` property lets portfolio code consume it structurally
  without importing the transactions module.
- `Position(account_id, instrument_id, quantity, cost_basis)` is a frozen,
  derived output with positive remaining quantity and exact cost basis.
- `RealisedResult(transaction_id, net_proceeds, consumed_basis,
  realised_pnl)` is a frozen per-sale output.
- `CostBasisStrategy` is an `ABC` with abstract `derive()` returning positions
  and realised sale results from an ordered transaction iterable.
- `AverageCostStrategy` is the only concrete strategy. It stable-sorts by trade
  date, tracks holdings per `(account_id, instrument_id)`, rejects oversells,
  consumes full basis on full sale, omits closed positions, and resets history
  after closure.

Repository interfaces are `ABC`s with abstract methods only:

- `UserRepository`: `get(user_id)`, `save(user)`.
- `BrokerRepository`: `get(broker_id)`, `list_all()`, `save(broker)`.
- `AccountRepository`: `get(user_id, account_id)`, `list_for_user(user_id)`,
  `save(user_id, account)`, `delete(user_id, account_id)`.
- `InstrumentRepository`: `get(instrument_id)`,
  `find_by_symbol(symbol, exchange)`, `save(instrument)`.
- `TransactionRepository`: `get(user_id, transaction_id)`,
  `list_for_account(user_id, account_id)`, `save(user_id, transaction)`,
  `delete(user_id, transaction_id)`.

The interfaces define persistence ports only. They contain no implementation,
session, query, transaction-management, or infrastructure behavior.

## Calculation APIs

- `derive_positions(transactions, strategy)` delegates through
  `CostBasisStrategy` and returns open positions.
- `calculate_realised_pnl(transactions, strategy)` returns per-sale results and
  their same-currency aggregate `Money`; mixed realised currencies fail.
- `calculate_unrealised_pnl(position, current_price)` returns exact market
  value and unrealised P&L; current price must match cost-basis currency.
- `calculate_portfolio_weights(market_values)` accepts explicit per-instrument
  `Money` values in one currency and returns `dict[UUID, Decimal]`. Empty or
  zero-total input returns `{}`; mixed currencies or negative total fail.

All functions are deterministic and perform no file, clock, database, network,
price lookup, FX conversion, or presentation rounding.

## Public test seams

Tests import only domain package exports and exercise observable results:

- `Money` arithmetic catches Decimal and currency regressions, but not display
  formatting, which is outside the domain.
- Entity constructors catch ownership, relationship, immutability, and trade
  invariant regressions, but not persistence mappings.
- Repository ABC inspection catches domain ownership and abstractness, but not
  infrastructure behavior deferred to Feature 003.
- `derive_positions(..., strategy)` and `calculate_realised_pnl(..., strategy)`
  catch ordering, strategy substitution, oversells, partial/full sells, reset
  behavior, and exact realised values.
- `calculate_unrealised_pnl` and `calculate_portfolio_weights` catch exact
  valuation, empty/zero, per-instrument, and currency behavior without mocking
  any boundary.
- Source/import inspection plus import-linter catches forbidden dependencies;
  it does not attempt runtime calls because this pure domain has no external
  boundary.

Tests live in `backend/tests/domain/` as `test_money.py`,
`test_entities.py`, `test_repositories.py`, `test_average_cost.py`,
`test_pnl.py`, `test_weights.py`, and `test_domain_purity.py`. During RED they
load the existing domain packages and fail inside tests on missing public
members, avoiding collection or syntax failures.

## Acceptance mapping

| Acceptance criterion | Implementation path | Test path |
| --- | --- | --- |
| AC1 | shared `Money` | `test_money.py` |
| AC2, AC10 | identity/accounts/instruments/transactions models | `test_entities.py` |
| AC3, AC5 | portfolio strategy and position model | `test_average_cost.py` |
| AC4 | abstract strategy and calculation delegation | `test_average_cost.py` |
| AC6 | average-cost sale results and realised aggregation | `test_pnl.py` |
| AC7 | unrealised calculation | `test_pnl.py` |
| AC8 | portfolio weights | `test_weights.py` |
| AC9 | all domain files and deterministic calculation seams | `test_domain_purity.py` plus exact-value tests |
| AC11 / Feature 003 dependency | five repository ABCs | `test_repositories.py` |

## Schema, dependencies, and decisions

There are no schema changes, migrations, infrastructure adapters, application
services, FastAPI/Pydantic types, or external dependencies. Existing ADR 0001
already decides the modular monolith, clean layers, and dependency inversion;
this plan applies it without introducing a new significant architecture
decision, so no ADR is added.

The Test writer commits the complete RED contract separately. The Implementer
then completes the ordered tasks in `tasks.md`, runs the five required backend
checks after every task, checks off that task, and commits before moving on.
