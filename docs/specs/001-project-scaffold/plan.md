# 001: Project scaffold plan

## Status and approvals

- [Approved spec](spec.md): Zack approved Gate 1 on 2026-11-12.
- Architecture plan: awaiting Zack's explicit approval before RED tests or implementation.
- Scope: one runnable backend, one frontend, local API/Postgres stack and one PR CI workflow. No application schema, auth or production deployment.

## Approach

| Criterion | Implementation | Verification |
| --- | --- | --- |
| 1: public, user-data-free health and package layout | `backend/app/main.py` mounts `app/presentation/api/v1/health.py` under `/api/v1`; response schema contains only a fixed status. Add importable `presentation`, `application`, `domain`, `infrastructure` packages and seven empty module packages under `app/modules/`. Health is the sole unauthenticated route; do not create other API endpoints. | FastAPI `TestClient` checks `GET /api/v1/health` without credentials, success status and exact user-data-free payload; package import smoke test. |
| 2: backend quality | Python 3.12 project in `backend/pyproject.toml` and `uv.lock`; FastAPI, SQLAlchemy 2.x and Alembic runtime dependencies; ruff, mypy, pytest, pytest-cov, httpx and pip-audit development dependencies. Ruff lint/format; mypy strict for domain/application (strict globally is acceptable); pytest coverage gate. | `uv sync --locked --group dev`; `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy app`, `uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=80`. Exclude empty `__init__.py` only if coverage needs no artificial inflation. |
| 3-4: frontend status and checks | Next.js App Router TypeScript app with Tailwind, `frontend/app/page.tsx`, status client component, `frontend/package.json` and `package-lock.json`; browser fetch to configurable `NEXT_PUBLIC_API_URL` (local default `http://localhost:8000`), with loading, healthy and unavailable states. Limit CORS to configured local frontend origin. Vitest + React Testing Library with jsdom, mocked fetch; ESLint, Prettier and `tsc --noEmit`. | RTL tests for success and rejected/non-OK responses; `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`. No Playwright in 001. |
| 5: local stack and baseline | Root `docker-compose.yml`, `backend/Dockerfile`, `backend/alembic.ini`, `backend/alembic/env.py`, empty `backend/alembic/versions/0001_baseline.py`. API + PostgreSQL only in Compose, with DB readiness and API health checks. Frontend runs on host for browser access to the API. | `docker compose up --build -d`, `docker compose ps`, `curl --fail http://localhost:8000/api/v1/health`; `uv run alembic upgrade head` and `uv run alembic downgrade base` against disposable Postgres. Inspect that no application tables exist. |
| 6: PR CI | `.github/workflows/ci.yml` with backend job (fresh Postgres service, quality, coverage, upgrade/downgrade), frontend job (quality, tests, build), security job (secret scan of checkout and backend + frontend dependency audits). Fail on any nonzero scan/check; avoid permissive `continue-on-error`. | Workflow syntax review and CI results on the future PR; run equivalent checks locally first. |

## Files and layers

- `backend/app/presentation/api/v1/health.py` owns HTTP routing and status schema only; `backend/app/main.py` assembles the app and local CORS. Neither contains business rules.
- `backend/app/application/__init__.py` and `backend/app/domain/__init__.py` are empty boundaries for future services, entities and interfaces; do not invent interfaces or services before a domain use case exists.
- `backend/app/infrastructure/__init__.py` is an empty adapter boundary. Alembic configuration stays in `backend/alembic/`; no repositories or SQLAlchemy models are needed yet.
- `backend/app/modules/{identity,accounts,instruments,transactions,importing,market_data,portfolio}/__init__.py` are empty vertical-slice folders. Future work puts behavior behind the four layer boundaries; no cross-module dependency is introduced here.
- `backend/tests/test_health.py` covers public health behavior and imports. `frontend/components/health-status.tsx` owns the small fetch/display boundary; `frontend/components/health-status.test.tsx` covers observable states. `frontend/vitest.config.ts` and test setup configure jsdom and RTL.
- Root `README.md` and `.gitignore` document repeatable commands and ignore generated state; `.env.example` files, if needed, contain names or non-secret placeholders only. Lockfiles are committed.

## Data and migrations

The baseline revision is empty: `upgrade()` and `downgrade()` do nothing. Alembic's own `alembic_version` table is allowed; no `users`, domain tables or seed data are added. Configure Alembic from `DATABASE_URL` in the environment, with a PostgreSQL driver and no hardcoded live credentials. CI starts a fresh PostgreSQL service, upgrades to `head`, then downgrades to `base` against that same database; failure at either step fails the backend job. Local Compose uses disposable development-only credentials supplied through local environment/configuration, never live secrets committed to Git.

## Verification

The Test writer first commits failing health and frontend status tests mapped to criteria 1 and 3; establish that failures are due to absent app behavior, not a broken assertion. The Implementer works through tasks below in order, runs the targeted tests for each slice, then all backend/frontend checks, migration round-trip and Compose health. After plan approval, document exact local setup and verification commands in `README.md`; CI and local checks use the same scripts/flags where practical. PR/merge and fresh review occur only after all tasks and local checks pass.

## Decisions and open questions

- [ADR 0001](../../adr/0001-modular-monolith-layered-architecture.md) governs layering; [ADR 0002](../../adr/0002-empty-baseline-and-scaffold-ci.md) records the baseline and CI design. No additional schema decision is made in 001.
- No GitHub issue currently appears in `gh issue list`; the ship step requires a linked issue, so create or identify the feature issue before opening a PR. This does not block plan approval.
- Hosting, auth, user tables and Playwright remain outside this feature. Zack's plan approval is the only gate before test/implementation work.
