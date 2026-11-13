# 002: Core domain model and calculations

## Status

Draft

Issue: [#7](https://github.com/donkey-king-kong/tallyhold/issues/7)

## Problem

Tallyhold needs a pure-Python domain contract before persistence, APIs, or UI
are built. Transactions must remain authoritative, positions must be derived,
and monetary calculations must be deterministic and currency-safe. Without
that contract, later layers could disagree about ownership, FIFO lot
consumption, cost basis, profit and loss, or portfolio weights.

## User stories

- As a long-term investor, I want my holdings and cost basis derived from
  transactions so that editable positions cannot contradict transaction
  history.
- As an investor who sells holdings, I want FIFO realised and unrealised profit
  and loss so that sold and remaining lots have deterministic costs.
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
  contains remaining quantity, FIFO cost-basis `Money`, and the remaining FIFO
  lots. It is never accepted as authoritative input.

Calculations consume domain objects and explicit in-memory current prices.
They neither obtain data nor define ports to databases, HTTP services, market
data providers, or other external systems.

## Calculation rules

All quantities, prices, fees, percentages, and monetary amounts use `Decimal`;
`float` is rejected. Calculations preserve exact Decimal results without
presentation rounding.

### FIFO cost basis and positions

Transactions are processed in ascending date order and preserve supplied order
on the same date. Each BUY creates a FIFO lot:

```text
lot basis = quantity * unit price + buy fee
```

A SELL consumes the oldest remaining lot first and may consume part of a lot.
The consumed cost basis is proportional for a partially consumed lot. A sale
that exceeds the available quantity fails. A fully sold position is omitted
from open positions; a later BUY starts a new FIFO history.

### Realised and unrealised profit and loss

For each SELL:

```text
net proceeds = quantity * unit price - sell fee
realised P&L = net proceeds - FIFO basis consumed
```

Aggregate realised P&L is the exact sum of sale results in their transaction
currency. For each open position and an explicitly supplied current price:

```text
market value = remaining quantity * current price
unrealised P&L = market value - remaining FIFO basis
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

### AC3: FIFO derives positions and cost basis

- Given a BUY of 10 shares at USD 100 with a USD 10 fee followed by a BUY of 10
  shares at USD 120 with a USD 10 fee, when the position is derived, then it has
  20 shares, two ordered FIFO lots, and exactly USD 2,220 cost basis.
- Given those lots, when 15 shares are sold, then all 10 shares from the first
  lot and 5 shares from the second lot are consumed, leaving 5 shares with
  exactly USD 605 cost basis.
- Given any position, when a SELL quantity exceeds the quantity held at that
  point in the ordered history, then derivation fails.
- Given a SELL that consumes every remaining lot, when positions are derived,
  then no open Position is returned for that account and instrument.
- Given a fully sold holding followed by a later BUY, when positions are
  derived, then the later BUY starts a new FIFO history.

### AC4: Ordering is deterministic

- Given transactions supplied out of trade-date order, when a position is
  derived, then they are processed in ascending trade-date order.
- Given multiple transactions on the same trade date, when a position is
  derived, then their supplied list order is preserved.

### AC5: Realised P&L uses consumed FIFO basis

- Given the AC3 lots and a SELL of 15 shares at USD 150 with a USD 15 fee, when
  realised P&L is calculated, then net proceeds are exactly USD 2,235, consumed
  FIFO basis is exactly USD 1,615, and realised P&L is exactly USD 620.
- Given multiple sales in one currency, when aggregate realised P&L is
  calculated, then it equals the exact sum of each sale's realised P&L.
- Given realised results in different currencies, when aggregation is
  attempted, then it fails rather than silently combining currencies.

### AC6: Unrealised P&L uses remaining FIFO basis

- Given the remaining 5-share position from AC3 and an explicit current price
  of USD 130, when unrealised P&L is calculated, then market value is exactly
  USD 650 and unrealised P&L is exactly USD 45.
- Given a current price in a currency different from the instrument currency,
  when unrealised P&L is calculated, then it fails.

### AC7: Portfolio weights use comparable market values

- Given open positions worth USD 650 and USD 350, when portfolio weights are
  calculated, then their exact weights are `Decimal("0.65")` and
  `Decimal("0.35")` and sum to `Decimal("1")`.
- Given no open positions or a zero total market value, when weights are
  calculated, then an empty result is returned.
- Given position market values in different currencies, when weights are
  calculated, then the calculation fails rather than adding incomparable
  values.

### AC8: The domain remains pure

- Given the feature's domain source, when its imports are inspected, then it
  imports no database, ORM, API, frontend, HTTP, market-data, FX, or other
  external framework or service package.
- Given current prices already represented as Money, when unrealised P&L and
  weights are calculated, then no file, database, network, clock, or framework
  dependency is invoked.
- Given any domain calculation, when it returns a result, then the result
  preserves exact Decimal values without display rounding.

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
- Plans, task breakdowns, tests, and implementation before Gate 1 approval

## Gate 1 product-spec conflicts

Issue #7 intentionally requests behavior that conflicts with the current
product source of truth. Gate 1 must explicitly resolve these differences; this
Draft does not silently override `docs/spec.md`.

1. The product spec names `AverageCost` as the MVP cost-basis method and defers
   FIFO until Phase 5; issue #7 requires FIFO now.
2. The product spec limits MVP sells to whole-position sells and defers partial
   sells; deterministic FIFO lot consumption in this Draft includes partial
   sells.
3. The product spec's five MVP metrics include total value, total invested,
   unrealised gain/loss, allocation, and dividends, but not realised P&L. Issue
   #7 requires realised P&L and portfolio weights without the other metrics.
4. The product spec names `BrokerAccount` as a core domain entity, while issue
   #7 requires separate `User`, `Broker`, and `Account` entities.
5. The product spec's Phase 1 calls for average-cost calculations and tests for
   every formula in the product spec. Issue #7 instead narrows this feature to
   FIFO, realised and unrealised P&L, and portfolio weights.

Gate 1 approval must state whether issue #7 supersedes these product-spec
statements for Feature 002 and whether `docs/spec.md` needs a follow-up update
before architecture or implementation.

## Open questions

1. Does `Transaction` support only BUY and SELL in Feature 002, or must the pure
   entity also represent the product spec's DIVIDEND and SPLIT types even though
   their calculations are outside issue #7?
2. Is transaction date plus supplied order an acceptable deterministic
   tie-breaker, or must each transaction carry an explicit sequence or timestamp?
3. Must portfolio weights be returned only per instrument, or also grouped by
   account, broker, asset type, and currency?
4. Should realised P&L be returned per sale as well as in aggregate, and what
   reporting period or account filters are required?
5. Should this feature define pure domain interfaces for alternative cost-basis
   methods, or is a concrete FIFO calculation sufficient for the current issue?
