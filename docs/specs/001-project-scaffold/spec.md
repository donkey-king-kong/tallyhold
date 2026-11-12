# 001: Project scaffold

## Status
Draft

## Problem
The repository has product and workflow documentation but no runnable applications or automated checks. A minimal vertical slice is needed before domain features can be built and reviewed through CI.

## User stories
- As a contributor, I want a runnable API and frontend so I can verify the apps communicate locally.
- As a reviewer, I want automated quality checks on every PR so a small change demonstrates the delivery workflow.

## Acceptance criteria
1. Given a fresh checkout with Python 3.12 and uv, when the backend is installed and run, then `GET /api/v1/health` returns a successful health status; the backend has presentation, application, domain and infrastructure packages and the seven module folders named in the [product spec](../../spec.md#architecture-style).
2. Given the backend skeleton, when ruff lint/format, mypy and pytest run, then all pass and at least one health endpoint pytest test passes; coverage is at least 80% overall and mypy strict applies to domain and application.
3. Given the Next.js TypeScript frontend, when its page loads with the API available, then it shows the API health status; when the API is unavailable, then it shows a clear unavailable state. At least one frontend test checks the displayed status.
4. Given the frontend skeleton, when lint, type check, tests and build run, then all pass.
5. Given Docker Compose and Docker installed, when the local stack starts, then API and PostgreSQL start and the API health request succeeds. No application tables are created in this feature.
6. Given a pull request, when GitHub Actions CI runs, then backend lint, format check, strict domain/application types, pytest with the 80% coverage floor, frontend lint, type check, tests and build, and a dependency vulnerability scan run; any failing check fails CI. Migration validation against fresh Postgres is required when migrations are introduced.

## Out of scope
- Auth, user tables or other application schema, broker/portfolio logic, external APIs and production deployment.
- Deployment hosting choice and live environment credentials.

## Open questions
- The [product spec](../../spec.md#api-and-ui-structure) scopes every endpoint to the logged-in user, but auth is out of scope here. May `/api/v1/health` be a public, user-data-free exception so the initial UI can display status?
- How should CI satisfy the product spec's fresh-Postgres Alembic migration check before this feature has migrations or application schema?
- Which frontend test runner should the Architect choose for this skeleton? The product spec names frontend lint, type check and build but no test runner.
