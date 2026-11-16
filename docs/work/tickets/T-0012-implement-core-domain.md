# T-0012: Implement core domain

## Assignment

- Status: in_progress
- Owner actor: R-0014/coordinator
- Role: Implementer
- Run: [R-0014](../runs/R-0014.md)
- Feature / task: [Feature 002](../../specs/002-core-domain/spec.md)
- Authorization: Gate 1 approved 2026-11-13; Zack's 2026-11-13 mission
  authorizes pure domain repository interfaces and direct execution because
  this feature has no schema changes.
- Dependencies: [T-0004](T-0004-draft-core-domain-spec.md)
- Branch / worktree: `feature/002-core-domain`
- Worktree path: `../tallyhold-feature-002`
- Issue / PR: issue #7; PR not created
- Updated: 2026-11-16T02:10:00Z

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

- Last completed action: implemented immutable BUY/SELL transactions and five
  pure abstract repository ports without changing tests.
- Evidence: 19 transaction/repository tests pass; Ruff lint/format, strict
  mypy, and import-linter pass; 20 expected portfolio failures remain and 36
  tests pass.
- Worktree state: second GREEN task ready to commit; branch is not pushed.
- Remaining work: average-cost positions, calculations, final checks, and ship.
- Blocker / unblock action: none. The requested `R-0010` was already allocated
  to unrelated active work, so the next unused run `R-0013` is used.
- Next action: commit transaction and repository contracts, then implement
  average-cost positions without altering tests.
- Handoff recipient: coordinator after all GREEN tasks and checks complete.

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
| 2026-11-13T09:23:33Z | R-0013/coordinator | Verified the clean RED handoff through `9f91e41` and assigned implementation | Complete each GREEN task with all five checks and separate commits |
| 2026-11-13T09:24:42Z | R-0013/implementer-01 | Reconciled the clean `feature/002-core-domain` assignment and claimed GREEN implementation | Implement Money and owned entities without editing tests |
| 2026-11-16T02:00:00Z | R-0014/coordinator | Took over the interrupted GREEN assignment and preserved its unfinished files | Complete the first implementation task, checks, and commit |
| 2026-11-16T02:05:00Z | R-0014/coordinator | Completed Money, User, Broker, Account, and Instrument with public exports | 15 targeted tests pass; four static checks pass; 38 expected later-slice RED failures remain |
| 2026-11-16T02:10:00Z | R-0014/coordinator | Completed BUY/SELL transactions and five abstract repository ports | 19 targeted tests and four static checks pass; 20 expected portfolio RED failures remain |
