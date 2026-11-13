# 002: Core domain model and calculations

## Status

Approved — Gate 1, 2026-11-13

Issue: [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)

## Problem

Tallyhold needs a pure-Python domain contract before persistence, APIs, or UI
are built. Transactions must remain authoritative, positions must be derived,
and monetary calculations must be deterministic and currency-safe. Without
that contract, later layers could disagree about ownership, cost-basis
consumption, profit and loss, or portfolio weights.

## User stories

- As a long-term investor, I want my holdings and cost basis derived from
  transactions so that editable positions cannot contradict transaction
  history.
- As an investor who sells holdings, I want realised and unrealised profit and
  loss under the configured cost-basis strategy so that sold and remaining
  holdings have deterministic costs.
- As an investor, I want portfolio weights based on current position values so
  that I can see each holding's share of a portfolio.
- As a developer, I want the core rules represented by pure domain objects so
  that later database, API, frontend, and integration choices do not leak into
  business behavior.

## Domain contract

This feature defines these pure Python domain objects:

- `User` has stable identity and a chosen base currency.
- `Broker` identifies the institution that holds an account.
- `Account` belongs to one `User`, references one `Broker`, and has stable
  identity, a display name, and an account currency.
- `Instrument` has stable identity, symbol, exchange, name, asset type, and
  trading currency.
- `Money` carries a `Decimal` amount and an explicit uppercase three-letter
  currency. It rejects `float`. Addition and subtraction require the same
  currency; multiplication accepts only a `Decimal` scalar. Money may be zero
  or negative because profit and loss may be either.
- `Transaction` records an immutable BUY or SELL for one account and instrument
  with an ordering date, positive quantity, positive unit-price `Money`, and
  non-negative fee `Money`. Price and fee currency must equal the instrument
  currency.
- `Position` is an immutable result derived for one account and instrument. It
  contains remaining quantity and cost-basis `Money`. It is never accepted as
  authoritative input.
- `CostBasisStrategy` is a pure domain interface that derives positions and
  per-sale realised results from ordered transactions. Alternative methods are
  added by implementing this interface rather than changing callers.
- `AverageCostStrategy` is the concrete Feature 002 implementation of
  `CostBasisStrategy`. FIFO, LIFO, and strategy selection are deferred.

Calculations consume domain objects and explicit in-memory current prices.
They neither obtain data nor define ports to databases, HTTP services, market
data providers, or other external systems.

## Calculation rules

All quantities, prices, fees, percentages, and monetary amounts use `Decimal`;
`float` is rejected. Calculations preserve exact Decimal results without
presentation rounding.

### Average cost basis and positions

Transactions are processed in ascending date order and preserve supplied order
on the same date. Before a transaction, let `Q` be the held quantity and `C` be
its total cost basis. Each BUY updates both totals:

```text
buy cost = quantity * unit price + buy fee
Q after buy = Q + quantity
C after buy = C + buy cost
```

A SELL may consume all or part of the holding at the average unit cost
immediately before that sale:

```text
average unit cost = C / Q
consumed basis = sell quantity * average unit cost
Q after sell = Q - sell quantity
C after sell = C - consumed basis
```

A sale that exceeds the available quantity fails. A sale of the full remaining
quantity consumes the full remaining basis, avoiding a residual from repeating
decimals. A fully sold position is omitted from open positions; a later BUY
starts a new average-cost history.

### Realised and unrealised profit and loss

For each SELL:

```text
net proceeds = quantity * unit price - sell fee
realised P&L = net proceeds - cost basis consumed
```

The strategy returns the cost basis consumed and realised P&L for each sale.
Aggregate realised P&L is the exact sum of those sale results in their
transaction currency, without period or account filters in Feature 002. For
each open position and an explicitly supplied current price:

```text
market value = remaining quantity * current price
unrealised P&L = market value - remaining cost basis
```

The current price must use the instrument currency. This feature does not fetch
prices or FX rates.

### Portfolio weights

For open positions with current market values in one common currency:

```text
position weight = position market value / total portfolio market value
```

Weights sum to `Decimal("1")` when total market value is positive. An empty or
zero-value portfolio returns no weights. Mixed-currency values fail rather than
being added without an explicit conversion performed outside this feature.

## Acceptance criteria

### AC1: Money is Decimal-only and currency-safe

- Given a `Decimal("10.25")` amount and `USD`, when Money is created, then it
  retains the exact amount and currency.
- Given a lowercase three-letter currency, when Money is created, then the
  currency is normalized to uppercase.
- Given any `float` amount or scalar, when Money creation or arithmetic is
  attempted, then it fails rather than converting the float.
- Given two Money values in the same currency, when they are added or
  subtracted, then the exact same-currency result is returned.
- Given Money values in different currencies, when addition or subtraction is
  attempted, then it fails rather than silently converting either value.
- Given negative or zero Decimal amounts, when Money is created, then those
  values remain valid for profit, loss, and zero results.

### AC2: Core entities express ownership and trading

- Given valid attributes, when a User, Broker, Account, or Instrument is
  created, then each exposes stable identity and the relationships and currency
  fields in the domain contract.
- Given an Account, when its relationships are inspected, then it belongs to
  exactly one User and references exactly one Broker.
- Given a valid BUY or SELL, when the Transaction is created, then it carries
  account, instrument, date, type, positive Decimal quantity, unit price, and
  non-negative fee.
- Given a BUY or SELL, when its price or fees use a currency different from the
  instrument currency, then transaction creation fails.
- Given zero or negative quantity or unit price, or a negative fee, when
  Transaction creation is attempted, then it fails.

### AC3: Average cost derives positions and supports partial sells

- Given a BUY of 10 shares at USD 100 with a USD 10 fee followed by a BUY of 10
  shares at USD 120 with a USD 10 fee, when the position is derived, then it has
  20 shares, an average unit cost of exactly USD 111, and exactly USD 2,220
  cost basis.
- Given that position, when 15 shares are sold, then exactly USD 1,665 of basis
  is consumed and 5 shares remain with exactly USD 555 cost basis.
- Given any position, when a SELL quantity exceeds the quantity held at that
  point in the ordered history, then derivation fails.
- Given a SELL that consumes the entire remaining quantity, when positions are
  derived, then the full remaining basis is consumed and no open Position is
  returned for that account and instrument.
- Given a fully sold holding followed by a later BUY, when positions are
  derived, then the later BUY starts a new average-cost history.

### AC4: Cost-basis behavior is pluggable

- Given ordered transactions, when a caller requests positions and realised
  results, then it depends on the `CostBasisStrategy` interface rather than the
  concrete average-cost implementation.
- Given `AverageCostStrategy`, when it is used through `CostBasisStrategy`, then
  it produces the average-cost results specified in AC3, AC6, and AC7.
- Given a future FIFO, LIFO, or other implementation, when it conforms to
  `CostBasisStrategy`, then callers require no behavior-specific changes.

### AC5: Ordering is deterministic

- Given transactions supplied out of trade-date order, when a position is
  derived, then they are processed in ascending trade-date order.
- Given multiple transactions on the same trade date, when a position is
  derived, then their supplied list order is preserved.

### AC6: Realised P&L uses average cost

- Given the AC3 position and a SELL of 15 shares at USD 150 with a USD 15 fee,
  when realised P&L is calculated, then net proceeds are exactly USD 2,235,
  consumed average-cost basis is exactly USD 1,665, and realised P&L is exactly
  USD 570.
- Given a sale, when realised P&L is calculated, then its net proceeds,
  consumed basis, and realised P&L are returned as that sale's result.
- Given multiple sales in one currency, when aggregate realised P&L is
  calculated, then it equals the exact sum of each sale's realised P&L.
- Given realised results in different currencies, when aggregation is
  attempted, then it fails rather than silently combining currencies.

### AC7: Unrealised P&L uses remaining average-cost basis

- Given the remaining 5-share position from AC3 and an explicit current price
  of USD 130, when unrealised P&L is calculated, then market value is exactly
  USD 650 and unrealised P&L is exactly USD 95.
- Given a current price in a currency different from the instrument currency,
  when unrealised P&L is calculated, then it fails.

### AC8: Portfolio weights are per instrument

- Given open instrument positions worth USD 650 and USD 350, when portfolio
  weights are calculated, then their exact per-instrument weights are
  `Decimal("0.65")` and `Decimal("0.35")` and sum to `Decimal("1")`.
- Given no open positions or a zero total market value, when weights are
  calculated, then an empty result is returned.
- Given position market values in different currencies, when weights are
  calculated, then the calculation fails rather than adding incomparable
  values.

### AC9: The domain remains pure

- Given the feature's domain source, when its imports are inspected, then it
  imports no database, ORM, API, frontend, HTTP, market-data, FX, or other
  external framework or service package.
- Given current prices already represented as Money, when unrealised P&L and
  weights are calculated, then no file, database, network, clock, or framework
  dependency is invoked.
- Given any domain calculation, when it returns a result, then the result
  preserves exact Decimal values without display rounding.

### AC10: Transaction scope is BUY and SELL only

- Given a BUY or SELL type, when a Feature 002 Transaction is created, then the
  type is accepted subject to AC2's invariants.
- Given a DIVIDEND, SPLIT, or any other transaction type, when Feature 002
  Transaction creation is attempted, then it fails as unsupported.

## Out of scope

- Database schemas, SQLAlchemy models, Alembic migrations, repositories,
  persistence mapping, and stored positions
- FastAPI, Pydantic transport schemas, REST endpoints, and application services
- Frontend, UI, and presentation rounding
- External imports, CSV parsing, broker integrations, price or FX providers,
  network calls, and dependency registration
- Authentication, authorization, identity-provider linking, and user data
  isolation enforcement
- Currency conversion, live valuation, dividends, stock splits, deposits,
  withdrawals, tax reporting, and cash balances
- FIFO, LIFO, user-selectable cost-basis methods, period or account filters for
  realised P&L, and portfolio weights grouped by anything other than instrument
- Remaining MVP metrics outside unrealised P&L and per-instrument weights;
  total value, total invested, and dividends are deferred to later features
- Tests and implementation before approval of the Feature 002 architecture plan

## Gate 1 decisions

Zack approved this contract on 2026-11-13 with these binding decisions:

1. Feature 002 implements average cost behind `CostBasisStrategy`; FIFO, LIFO,
   and other strategies remain future implementations.
2. Partial sells and automatically calculated realised P&L are in scope.
3. `User`, `Broker`, and `Account` are separate entities.
4. Transactions support BUY and SELL only.
5. Trade date plus supplied list order is the deterministic ordering rule.
6. Portfolio weights are returned per instrument only.
7. Realised P&L is returned per sale and in aggregate, without period or
   account filters.
8. Dividends and the remaining MVP metrics are deferred to later features.
