# 001: Project scaffold

## Status
Approved by Zack (Gate 1, 2026-11-12)

## Problem
The repository has product and workflow documentation but no runnable applications or automated checks. A minimal vertical slice is needed before domain features can be built and reviewed through CI.

## User stories
- As a contributor, I want a runnable API and frontend so I can verify the apps communicate locally.
- As a reviewer, I want automated quality checks on every PR so a small change demonstrates the delivery workflow.

## Acceptance criteria
1. Given a fresh checkout with Python 3.12 and uv, when the backend is installed and run, then `GET /api/v1/health` returns a successful health status without authentication or user data; this public endpoint is the only exception to the [product spec's authenticated-endpoint rule](../../spec.md#api-and-ui-structure). The backend has presentation, application, domain and infrastructure packages and the seven module folders named in the [product spec](../../spec.md#architecture-style).
2. Given the backend skeleton, when ruff lint/format, mypy and pytest run, then all pass and at least one health endpoint pytest test passes; coverage is at least 80% overall and mypy strict applies to domain and application.
3. Given the Next.js TypeScript frontend, when its page loads with the API available, then it shows the API health status; when the API is unavailable, then it shows a clear unavailable state. Vitest and React Testing Library tests cover the displayed states; Playwright end-to-end tests are deferred beyond 001.
4. Given the frontend skeleton, when lint, type check, tests and build run, then all pass.
5. Given Docker Compose and Docker installed, when the local stack starts, then API and PostgreSQL start and the API health request succeeds. Alembic is configured with an empty baseline revision; no application tables are created in this feature.
6. Given a pull request, when GitHub Actions CI runs, then backend lint, format check, strict domain/application types, pytest with the 80% coverage floor, frontend lint, type check, tests and build, a secret scan, and a dependency vulnerability scan run; any failing check fails CI. Against a fresh PostgreSQL service container, CI runs `alembic upgrade head` followed by `alembic downgrade base`.

## Out of scope
- Auth, user tables or other application schema, broker/portfolio logic, external APIs and production deployment.
- Deployment hosting choice and live environment credentials.

## Open questions
- Resolved by Zack (Gate 1): `GET /api/v1/health` is public, returns no user data, and is the only exception to authenticated endpoints.
- Resolved by Zack (Gate 1): Configure Alembic with an empty baseline revision now; CI upgrades to head and downgrades to base against fresh PostgreSQL.
- Resolved by Zack (Gate 1): Frontend tests use Vitest and React Testing Library; Playwright end-to-end tests come later.
