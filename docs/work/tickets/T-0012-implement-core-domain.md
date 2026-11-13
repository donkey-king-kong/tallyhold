# T-0012: Implement core domain

## Assignment

- Status: in_progress
- Owner actor: R-0013/coordinator
- Role: Architect
- Run: [R-0013](../runs/R-0013.md)
- Feature / task: [Feature 002](../../specs/002-core-domain/spec.md)
- Authorization: Gate 1 approved 2026-11-13; Zack's 2026-11-13 mission
  authorizes pure domain repository interfaces and direct execution because
  this feature has no schema changes.
- Dependencies: [T-0004](T-0004-draft-core-domain-spec.md)
- Branch / worktree: `feature/002-core-domain`
- Worktree path: `../tallyhold-feature-002`
- Issue / PR: issue #7; PR not created
- Updated: 2026-11-13T09:15:10Z

## Scope

Design, test, implement, review, and ship Feature 002. Add only pure Python
domain entities, calculations, cost-basis behavior, and domain-owned repository
interfaces. Exclude databases, ORM, migrations, APIs, external services, and
frontend work.

## Acceptance

- [ ] Architect commits `plan.md` and `tasks.md` with every approved AC mapped.
- [ ] Test writer commits collecting tests that fail only for missing behavior.
- [ ] Implementer completes each task without altering tests and all backend
  quality checks pass with at least 80% coverage.
- [ ] Ship gates pass through a fresh Reviewer and the PR merges.
- [ ] Feature 003 architecture starts in a separate worktree and stops for
  Zack's plan approval before tests or implementation.

## Checkpoint

- Last completed action: wrote and validated the Feature 002 architecture plan
  and ordered task map.
- Evidence: `docs/specs/002-core-domain/{plan,tasks}.md`; `git diff --check`
  passed and AC1-AC10 plus all required interfaces/functions are mapped.
- Worktree state: architecture and tracking files are ready to commit.
- Remaining work: RED tests, implementation, checks, and ship.
- Blocker / unblock action: none. The requested `R-0010` was already allocated
  to unrelated active work, so the next unused run `R-0013` is used.
- Next action: commit the architecture handoff, then switch to Test writer.
- Handoff recipient: Test writer after the architecture commit.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T09:13:44Z | R-0013/coordinator | Claimed the approved implementation scope as Architect in a new worktree | Write the plan and tasks; no plan gate is required |
| 2026-11-13T09:15:10Z | R-0013/coordinator | Completed and validated the architecture plan and ordered tasks | Commit the architecture handoff, then begin RED |
