# Good and Bad Tests

Use pytest at public domain/application interfaces and FastAPI's test client at
the HTTP boundary. Frontend behavior can use Vitest once configured.

## Good Tests

**Integration-style**: Test behavior through a public interface, not its internals.

```python
from decimal import Decimal

def test_buy_creates_position(portfolio):
    portfolio.record_buy(symbol="AAPL", quantity=Decimal("2"))
    assert portfolio.position_for("AAPL").quantity == Decimal("2")
```

Characteristics:

- Tests behavior callers care about
- Uses the public interface only
- Survives internal refactors
- Describes WHAT, not HOW
- Keeps assertions focused on one behavior

## Bad Tests

**Implementation-detail tests** couple to internal structure:

```python
# BAD: verifies an internal collaborator instead of the outcome
def test_buy_calls_repository(portfolio, repository):
    portfolio.record_buy(symbol="AAPL", quantity=Decimal("2"))
    repository.save.assert_called_once()
```

Red flags: mocking your own collaborators, testing private methods, asserting
call counts or order, or breaking after a behavior-preserving refactor.

```python
# BAD: bypasses the interface to verify a database side effect
def test_create_account_saves_row(accounts, database):
    accounts.create("Tiger")
    assert database.query("SELECT count(*) FROM broker_accounts") == 1

# GOOD: verifies through the interface
def test_create_account_is_retrievable(accounts):
    account = accounts.create("Tiger")
    assert accounts.get(account.id).name == "Tiger"
```

**Tautological tests** recompute expected values by the same algorithm:

```python
# BAD: expected value can share the production calculation's mistake
expected = sum(quantity * price for quantity, price in buys)
assert cost_basis(buys) == expected

# GOOD: the worked example in docs/spec.md supplies an independent answer
assert cost_basis(buys) == Decimal("2202")
```

These are illustrative test shapes, not prescribed Tallyhold APIs; the approved
feature plan defines actual interfaces and test locations.
