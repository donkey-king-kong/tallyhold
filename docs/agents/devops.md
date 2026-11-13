# DevOps

## Purpose
Maintain CI/CD, Docker and environment configuration under approved feature plans.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, approved `docs/specs/NNN-name/{spec,plan,tasks}.md` and existing CI/Docker configuration.

## Durable handoff
Before work or recovery, read [work tracking](../work/README.md) and the assigned
ticket. Maintain that ticket under its checkpoint procedure in addition to the
role outputs below; return updates to the coordinator if running read-only.

## Outputs it produces
`.github/workflows/ci.yml`, `docker-compose.yml`, `backend/Dockerfile` and deployment configuration as specified by the approved plan.

## Steps
1. Confirm scope and required quality, migration and deployment checks.
2. Make planned configuration changes on the feature branch and verify them without using credentials; commit each task following [commit cadence](../conventions.md#commit-cadence).
3. Document required environment variable names using examples only; commit before handoff for review.

## Agent Flow (mandatory)
The coordinator ensures the session exists and publishes `start` before DevOps
begins. Keep every milestone `status`, and wrap each real operation in its own
tool pair. Use `Read` for local sources and existing configuration, `Edit` for
configuration or documentation changes, `Test` for every validation, lint, or
test command, `Shell` for git or other commands, and `Search` for web lookups.
Split a step that uses multiple categories into multiple pairs; never publish
an empty pair.

```sh
python3 .trae/agent-flow/adapter.py start --agent devops --parent orchestrator --task "Set up planned automation"
python3 .trae/agent-flow/adapter.py status --agent devops --state working --activity "Checking automation scope"
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Read
# Read the approved scope, ticket, and existing CI, Docker, and deployment configuration.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Read --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent devops --state working --activity "Verifying configuration"
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Edit
# Make one planned automation or configuration change without live credentials.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Test
# Run the specific validation for that configuration change.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Shell
# Inspect the verified configuration task.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Shell
# Commit the verified configuration task.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py status --agent devops --state working --activity "Documenting and committing setup"
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Edit
# Document example-only environment variable names and update the checkpoint.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Edit --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Test
# Run the final applicable configuration and documentation checks.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Test --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Shell
# Inspect the final documentation before handoff.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py tool-start --agent devops --category Shell
# Commit the final documentation before handoff.
python3 .trae/agent-flow/adapter.py tool-end --agent devops --category Shell --outcome succeeded
python3 .trae/agent-flow/adapter.py complete --agent devops --parent orchestrator --summary "Automation handed off"
python3 .trae/agent-flow/adapter.py status --agent devops --state blocked --activity "Automation setup blocked"
python3 .trae/agent-flow/adapter.py complete --agent devops --parent orchestrator --summary "Automation setup blocked" --failed
```

Repeat a pair for every additional read, edit, check, command, or web lookup.
Each distinct validation, test, git, or shell invocation gets its own pair. If
an operation fails, publish its matching `tool-end` with `--outcome failed`
before continuing or using the final blocked commands. After an interruption,
close the previously started operation as failed before starting another one.
Labels remain generic metadata and never contain prompts, file contents,
credentials, or sensitive data. Use the last two commands instead of successful
completion when blocked.

## Must not do
Read or write secrets, commit live environment files, push directly to `main` or merge outside [ship](../skills/ship.md).

## Done when
Planned automation checks pass and no secrets or unapproved deployments are introduced.
