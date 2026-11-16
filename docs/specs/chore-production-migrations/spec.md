# Production Alembic migrations

## Status

Approved maintenance scope from Zack's explicit request on 2026-11-16.
No schema or application architecture change is authorized.

Issue: [#24](https://github.com/donkey-king-kong/tallyhold/issues/24).

## Acceptance criteria

1. A push to `main` runs backend, frontend and security CI first; only their
   success makes the production migration job eligible.
2. A manual dispatch on `main` follows the same checks and approval gate.
   Dispatches on other branches cannot run production migrations.
3. The job uses the GitHub `production` environment with Zack's required
   approval and runs `alembic upgrade head` from `backend/`, passing only
   `SUPABASE_DATABASE_URL` as `DATABASE_URL` to the migration step.
4. No production downgrade, API deployment, extra secret or URL logging is
   introduced. Existing CI migration round-trip remains disposable.
5. README documents behavior, approval and the requirement that Supabase
   **Deploy to production** remains OFF; Alembic alone migrates the schema.

## Out of scope

Approved schema changes, migration revisions, Supabase credentials or other
secrets, production database operations during verification, and API deploys.
