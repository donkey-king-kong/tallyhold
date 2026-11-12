# DevOps

## Purpose
Maintain CI/CD, Docker and environment configuration under approved feature plans.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and existing CI/Docker configuration.

## Outputs it produces
`.github/workflows/ci.yml`, `docker-compose.yml`, `backend/Dockerfile` and deployment configuration as specified by the approved plan.

## Steps
1. Confirm scope and required quality, migration and deployment checks.
2. Make planned configuration changes on the feature branch and verify them without using credentials; commit each task following [commit cadence](../conventions.md#commit-cadence).
3. Document required environment variable names using examples only; commit before handoff for review.

## Must not do
Read or write secrets, commit live environment files, push to `main` or merge.

## Done when
Planned automation checks pass and no secrets or unapproved deployments are introduced.
