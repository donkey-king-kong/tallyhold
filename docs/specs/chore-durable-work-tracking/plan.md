# Durable work tracking maintenance plan

## Status and approvals

Zack directly requested the documentation setup described in [spec](spec.md).
This plan records the implemented documentation layout for publication.
No application architecture or schema changes require additional plan approval.

## Approach

- Criteria 1-3: `docs/work/README.md`, `roadmap.md`, ticket/run templates, and
  bootstrap records separate requirements, priorities, ownership, and evidence.
- Criteria 4-5: pointers in `AGENTS.md`, contributor README, workflow, role files,
  Agent Flow documentation, and the feature task template make checkpointing
  part of startup and handoff. Keep Reviewer inputs and ship rules unchanged.
- Criterion 6: check local Markdown links/anchors, role pointers, diff whitespace,
  and documented recovery scenarios. Run existing quality checks before ship.

## Data and migrations

None. Plain Markdown is stored in Git; no external board or telemetry copy.

## Publication

Commit the maintenance contract and implementation in logical groups. Link issue
#5 and this spec in the PR. Run fresh review and ship gates; maintain post-dispatch
tracking on a separate maintenance worktree so it cannot alter the reviewed head.
