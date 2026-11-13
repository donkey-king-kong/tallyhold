# 001: Project scaffold plan

## Status and approvals

- [Approved spec](spec.md): Zack approved Gate 1 on 2026-11-12.
- Architecture plan: approved by Zack on 2026-11-12 with the module-first and verification changes recorded here.
- Scope: one runnable backend, one frontend, local API/Postgres stack and one PR CI workflow. No application schema, auth or production deployment.

## Approach

| Criterion | Implementation | Verification |
| --- | --- | --- |
| 1: public, user-data-free health and package layout | `backend/app/main.py` mounts `app/modules/system/presentation/health.py` under `/api/v1`; response contains only fixed status. Each of seven business modules under `app/modules/<module>/` owns `domain`, `application`, `infrastructure`, `presentation` packages. `app/shared/` holds cross-cutting code. No parallel top-level layer packages. `system` is a separate technical module, not an eighth business module. | FastAPI `TestClient` checks unauthenticated status and exact user-data-free payload; package import smoke test. Public HTTP seam catches routing/payload regressions but not DB readiness. |
| 2: backend quality and boundaries | Python 3.12 pinned in `.python-version`; `backend/pyproject.toml` and `uv.lock` with FastAPI, SQLAlchemy 2.x, Alembic; dev dependencies ruff, mypy, pytest, pytest-cov, httpx, pip-audit and import-linter. Ruff, mypy strict across `app`, pytest coverage gate. Import-linter contracts: each business module's domain forbids its higher layers and framework/HTTP/DB imports; application may import its domain but forbids infrastructure and presentation; business modules are independent (only `app.shared` may be shared). Apply equivalent system presentation routing boundaries without weakening the business-module rules. | `uv sync --locked --group dev`; `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy app`, `uv run lint-imports`, `uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=80`. Import-linter CLI is the boundary test in local checks and CI, including a temporary deliberate forbidden-import probe. |
| 3-4: frontend status and checks | Next.js App Router TypeScript app with Tailwind, `frontend/app/page.tsx`, status client component, `frontend/package.json`, `package-lock.json`, `.nvmrc` and matching `engines.node`; browser fetch to configurable `NEXT_PUBLIC_API_URL` (local default `http://localhost:8000`), with loading, healthy and unavailable states. Limit CORS to configured local frontend origin. Vitest + React Testing Library with jsdom, mocked fetch; ESLint, Prettier and `tsc --noEmit`. | Public rendered-UI seam: RTL tests for success and rejected/non-OK responses (catches visible state, not real network connectivity); `npm ci`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`. No Playwright in 001. |
| 5: local stack and baseline | Root `docker-compose.yml`, `backend/Dockerfile`, `backend/alembic.ini`, `backend/alembic/env.py`, empty `backend/alembic/versions/0001_baseline.py`. API + PostgreSQL only in Compose, with DB readiness and API health checks. Frontend runs on host for browser access to the API. | `docker compose up --build -d`, `docker compose ps`, `curl --fail http://localhost:8000/api/v1/health`; `uv run alembic upgrade head` and `uv run alembic downgrade base` against disposable Postgres. Inspect that no application tables exist. |
| 6: PR CI | `.github/workflows/ci.yml` with backend job (Python version from `.python-version`, lint/format, strict mypy, import-linter, coverage, fresh Postgres upgrade/downgrade), frontend job (Node version from `.nvmrc`, lint, types, tests, build), security job (gitleaks, pip-audit and `npm audit --omit=dev --audit-level=high`). Fail on any nonzero check; no `continue-on-error`. | Workflow syntax review and CI results on the future PR; run equivalent checks locally first. |

## Files and layers

- `backend/app/modules/{identity,accounts,instruments,transactions,importing,market_data,portfolio}/{domain,application,infrastructure,presentation}/__init__.py` defines module-first boundaries. `backend/app/shared/__init__.py` is the only cross-cutting package; avoid business logic there. Domain stays pure; infrastructure implements domain interfaces; no classes or interfaces are invented in 001.
- `backend/app/modules/system/presentation/health.py` owns the public route only; `backend/app/main.py` assembles it and local CORS. This technical system module stays outside the seven business modules. Alembic configuration stays in `backend/alembic/`; no repositories or SQLAlchemy models yet.
- `backend/pyproject.toml` stores import-linter contracts for all seven module domains/applications and cross-module independence, with no exception allowing direct imports of other modules' internals. `backend/.python-version` pins Python 3.12; `frontend/.nvmrc` and `frontend/package.json` agree on a Node major. CI reads both files rather than duplicating version strings.
- `backend/tests/test_health.py` covers the public HTTP seam. `frontend/components/health-status.tsx` owns the browser fetch/display seam; `frontend/components/health-status.test.tsx` covers observable states. `frontend/vitest.config.ts` and test setup configure jsdom and RTL.
- Root `README.md` and `.gitignore` document repeatable commands and ignore generated state; `.env.example` files, if needed, contain names or non-secret placeholders only. Lockfiles are committed.

## Data and migrations

The baseline revision is empty: `upgrade()` and `downgrade()` do nothing. Alembic's own `alembic_version` table is allowed; no `users`, domain tables or seed data are added. Configure Alembic from `DATABASE_URL` in the environment, with a PostgreSQL driver and no hardcoded live credentials. CI starts a fresh PostgreSQL service, upgrades to `head`, then downgrades to `base` against that same database; failure at either step fails the backend job. Local Compose uses disposable development-only credentials supplied through local environment/configuration, never live secrets committed to Git.

## Verification

The Test writer first commits failing health and frontend status tests mapped to criteria 1 and 3; establish that failures are due to absent app behavior, not a broken assertion. The Implementer works through tasks below in order, runs the targeted tests for each slice, then all backend/frontend checks, migration round-trip and Compose health. After plan approval, document exact local setup and verification commands in `README.md`; CI and local checks use the same scripts/flags where practical. PR/merge and fresh review occur only after all tasks and local checks pass.

## Decisions and open questions

- [ADR 0001](../../adr/0001-modular-monolith-layered-architecture.md) governs layering; [ADR 0002](../../adr/0002-empty-baseline-and-scaffold-ci.md) records the baseline and CI design. No additional schema decision is made in 001.
- [Issue #3](https://github.com/donkey-king-kong/tallyhold/issues/3) (`feat: project scaffold`) is assigned to `donkey-king-kong` and links the approved spec; link #3 in the PR.
- Hosting, auth, user tables and Playwright remain outside this feature. Zack's requested plan revision is approved; no further plan gate is required.
