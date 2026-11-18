# Shared Agent Flow stream tasks

Ordered by dependency; each checkbox is one bounded Conventional Commit.
Tickets for future assignments are allocated by the coordinator immediately
before dispatch, not reserved by this plan. Fresh Reviewers receive only their
role-permitted inputs, never these ticket/run records.

- [x] [T-0067](../../work/tickets/T-0067-shared-agent-flow-stream-plan.md),
  Architect: mark only spec status approved; write this plan and tasks with
  criteria 1-10 traced to `.trae/agent-flow/test_adapter.py`; validate, commit
  and push `docs: plan shared agent flow stream`. Request Zack's plan approval.
- [ ] T-NNNN, coordinator: record Zack's explicit plan approval **before**
  assigning RED. Until then, stop; neither tests nor implementation may start.
- [ ] T-NNNN, Test writer: add failing root/slug/namespace/parent mapping
  tests for criteria 1-4 and 8-9 in `.trae/agent-flow/test_adapter.py`;
  exercise the real CLI from temporary Git worktrees.
- [ ] T-NNNN, Test writer: add failing multiprocess init/append, namespaced
  heartbeat, reactivation and documented-command tests for criteria 5-7 and
  10; run RED and unchanged legacy tests, then commit and push RED evidence.
- [ ] T-NNNN, coordinator: request fresh independent RED review of the pushed
  handoff, record verdict, and hold GREEN until `APPROVE`.
- [ ] T-NNNN, Implementer: resolve common-dir default and deterministic slug/
  ID mapping in the adapter (criteria 1-3, 8-9); pass targeted tests.
- [ ] T-NNNN, Implementer: implement lock, idempotent session init and root
  registration, atomic appends, attribution and heartbeat mapping (criteria
  2, 4-6, 10); pass targeted concurrency tests.
- [ ] T-NNNN, Implementer: update `docs/agent-flow.md`, reconcile ship init
  and stale worktree-local stream guidance (criterion 7), keeping existing
  role command examples and fresh Reviewer isolation unchanged.
- [ ] T-NNNN, Implementer: run full adapter suite, applicable CI checks,
  documentation/path hygiene and `git diff --check`; commit and push each
  implementation task separately.
- [ ] T-NNNN, coordinator: on a future explicit ship request, run the full
  PR, CI, fresh review, and gated merge workflow. No PR is authorized in this
  planning assignment.
