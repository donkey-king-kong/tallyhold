# ADR 0002: Empty Alembic baseline and scaffold CI

## Context

Feature 001 needs a real migration check against PostgreSQL even though user and portfolio tables are deferred. The first PR must also demonstrate backend, frontend and security gates without deploying production infrastructure.

## Decision

Initialize Alembic with an empty baseline revision. Its upgrade and downgrade make no application schema changes; CI runs both directions on one fresh PostgreSQL service container. Keep a single GitHub Actions workflow with separate backend, frontend and security jobs. The security job scans committed content for secrets and audits both Python and npm dependencies; every check fails the job on failure. Local Compose runs only the API and PostgreSQL; developers run the Next.js frontend on the host.

## Alternatives considered

- Defer Alembic until the first schema feature: leaves the migration check unproven for the initial PR.
- Create placeholder application tables: introduces unapproved data design and migration churn.
- Skip security checks or defer them to deployment: the first PR would not exercise the agreed delivery gates.
- Put the frontend in Compose now: adds a third service without improving the specified API/Postgres local stack.

## Consequences

The baseline provides a stable starting revision without committing domain schema. The CI service container exercises real PostgreSQL rather than SQLite; later schema changes must add migrations. Separate jobs make failures easier to isolate but require independently installed dependencies. Scanner versions and lockfiles should be pinned at implementation, and no live credentials may be checked in.
