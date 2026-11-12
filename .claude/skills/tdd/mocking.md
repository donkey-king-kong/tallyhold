# When to Mock

Mock at **system boundaries** only:

- External APIs (prices, FX, auth, etc.)
- Databases (sometimes - prefer test DB)
- Time/randomness
- File system (sometimes)

Don't mock:

- Your own classes/modules
- Internal collaborators
- Anything you control

## Designing for Isolation

At system boundaries, depend on domain interfaces so the infrastructure
adapter can be replaced in tests without importing its client into the domain.

**1. Use dependency injection**

Pass external dependencies in rather than creating them internally:

```python
from decimal import Decimal

# GOOD: the application receives a domain-defined price provider
def value_position(quantity: Decimal, symbol: str, prices: PriceProvider):
    return quantity * prices.close_for(symbol)

# BAD: the use case constructs an external client directly
def value_position_directly(quantity: Decimal, symbol: str):
    return quantity * YFinancePriceProvider().close_for(symbol)
```

**2. Prefer specific operations over generic fetchers**

Define the operations callers need, rather than one generic request method
with conditional logic inside the fake:

```python
# GOOD: one operation with a stable result shape
class FakePriceProvider:
    def close_for(self, symbol: str) -> Decimal:
        return Decimal("130")

# BAD: the fake must interpret URLs and options to know what to return
class GenericFakeClient:
    def fetch(self, url: str, options: dict):
        ...
```

Specific operations keep fakes focused and test setup readable. These are
illustrative shapes, not prescribed APIs; use the approved plan's interfaces.
