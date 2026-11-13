# T-0012: Implement core domain

## Assignment

- Status: in_progress
- Owner actor: R-0013/test-writer-01
- Role: Test writer
- Run: [R-0013](../runs/R-0013.md)
- Feature / task: [Feature 002](../../specs/002-core-domain/spec.md)
- Authorization: Gate 1 approved 2026-11-13; Zack's 2026-11-13 mission
  authorizes pure domain repository interfaces and direct execution because
  this feature has no schema changes.
- Dependencies: [T-0004](T-0004-draft-core-domain-spec.md)
- Branch / worktree: `feature/002-core-domain`
- Worktree path: `../tallyhold-feature-002`
- Issue / PR: issue #7; PR not created
- Updated: 2026-11-13T09:22:30Z

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

- Last completed action: committed the complete Feature 002 RED contract as
  `aafbf74` after verifying collection and missing-behavior failures.
- Evidence: `uv run pytest --collect-only -q tests/domain` collected 56 tests;
  `uv run pytest -q --tb=no tests/domain` reported 53 expected missing-behavior
  failures and 3 purity-baseline passes; Ruff lint and format checks pass.
- Worktree state: RED is committed at `aafbf74`; this post-commit checkpoint is
  the only pending change on `feature/002-core-domain`.
- Remaining work: implementation, full checks, and ship.
- Blocker / unblock action: none. The requested `R-0010` was already allocated
  to unrelated active work, so the next unused run `R-0013` is used.
- Next action: coordinator records Test writer completion in `R-0013`, assigns
  the Implementer, and starts the Money and owned entities GREEN task.
- Handoff recipient: coordinator for Implementer assignment.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-13T09:13:44Z | R-0013/coordinator | Claimed the approved implementation scope as Architect in a new worktree | Write the plan and tasks; no plan gate is required |
| 2026-11-13T09:15:10Z | R-0013/coordinator | Completed and validated the architecture plan and ordered tasks | Commit the architecture handoff, then begin RED |
| 2026-11-13T09:15:55Z | R-0013/coordinator | Committed architecture as `bc1e167` and assigned the clean branch to the Test writer | Add and commit the complete RED contract |
| 2026-11-13T09:17:21Z | R-0013/test-writer-01 | Recovered the approved RED contract and confirmed a clean missing-behavior baseline at `f6decee` | Add the seven planned public-seam test modules |
| 2026-11-13T09:19:17Z | R-0013/test-writer-01 | First collection command stopped before pytest because its Agent Flow adapter path was resolved from `backend/` | Retry collection with the adapter's absolute worktree path |
| 2026-11-13T09:19:31Z | R-0013/test-writer-01 | Retry again stopped before pytest because the preceding telemetry close still used the relative adapter path | Use absolute adapter paths for the complete wrapper and run collection |
| 2026-11-13T09:21:32Z | R-0013/test-writer-01 | Corrected three Ruff-only line-wrap findings; one later validation wrapper also stopped before checks from the same relative adapter-path error | Absolute-path reruns passed Ruff lint and format |
| 2026-11-13T09:21:32Z | R-0013/test-writer-01 | Completed AC1-AC10 and five-repository RED coverage at planned seams | 56 collected; 53 missing-behavior failures, 3 purity passes; commit RED next |
| 2026-11-13T09:22:30Z | R-0013/test-writer-01 | Committed the verified RED contract as `aafbf74` without production changes | Coordinator records completion and assigns the first GREEN task |
