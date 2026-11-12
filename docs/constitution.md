# Constitution

1. The backend must remain one deployable modular monolith with separate `identity`, `accounts`, `instruments`, `transactions`, `importing`, `market_data` and `portfolio` modules.
2. FastAPI routers and Pydantic schemas must contain no business rules; application services must orchestrate use cases through injected domain interfaces, not concrete infrastructure.
3. Domain code must be pure Python and must not import `fastapi`, `pydantic`, `sqlalchemy`, `alembic`, `httpx` or other HTTP/DB frameworks. Infrastructure implements domain interfaces; calls to databases, auth, prices, FX or other external systems must live in infrastructure.
4. Each class must have one responsibility; new brokers, asset types, valuation strategies, metrics and cost-basis methods must be added through their interfaces, without modifying existing application services for each implementation. Register implementations in one place.
5. Money and quantities must use `Decimal`, never `float`; every money value must carry an explicit currency.
6. Every user-owned table must have a `user_id`; every read, write and delete of user-owned data must scope to the current user. Shared reference and market-data tables are exempt.
7. Transactions must be the source of truth; positions and metrics must be derived, never stored as editable positions.
8. New domain behavior must start with a failing pytest test mapped to an acceptance criterion; all changes must pass pytest and maintain at least 80% overall coverage. Domain tests should exceed that floor.
9. Domain and application code must pass mypy strict; backend code must pass ruff lint and format checks.
10. Every database schema change must ship with an Alembic migration and be reviewed at Gate 2.
11. Secrets, credentials and live environment files must never enter the repository; agents must neither read nor write secrets.
12. Agents must work on a feature branch, must never push to `main` or merge a PR, and must wait for Zack's Gate 1 approval before planning or implementing an unapproved spec. For schema or architecture changes, Zack must also approve the plan before execution.
13. Each PR must be small, linked to one feature spec and issue, reviewed against the spec and this constitution, and merged only by Zack after CI passes.
14. Every commit and PR title must follow [conventions](conventions.md); agents must commit continuously at the cadence specified there.
