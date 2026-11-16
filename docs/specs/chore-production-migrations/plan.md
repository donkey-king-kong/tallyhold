# Production Alembic migrations plan

## Approval

Zack directly requested the maintenance scope in [spec](spec.md). It changes
CI wiring and documentation only; the Feature 003 schema remains unchanged.
Any required change to that schema returns to Zack before implementation.

## Approach

- Extend `.github/workflows/ci.yml` for `main` pushes and manual dispatch.
- Gate the production job with `needs` on backend, frontend and security and
  restrict it to `main`; serialize production migration jobs.
- Use the `production` environment approval gate and expose the existing
  secret as `DATABASE_URL` only to the upgrade step.
- Document the approval and single migration authority in `README.md`.
- Configure and verify the GitHub `production` environment reviewer before
  merging; do not test against the production database.

## Verification

Parse and assert workflow triggers, dependencies, environment, branch guard,
secret scope and absence of production downgrade. Run the existing local
quality checks and let PR CI confirm the unaffected checks.
