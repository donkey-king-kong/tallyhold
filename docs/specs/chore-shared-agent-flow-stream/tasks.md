# Shared Agent Flow stream tasks

Ordered by dependency; each checkbox is one bounded Conventional Commit.
Tickets for future assignments are allocated by the coordinator immediately
before dispatch, not reserved by this plan. Fresh Reviewers receive only their
role-permitted inputs, never these ticket/run records.

- [x] [T-0067](../../work/tickets/T-0067-shared-agent-flow-stream-plan.md),
  Architect: mark only spec status approved; write this plan and tasks with
  criteria 1-10 traced to `.trae/agent-flow/test_adapter.py`; validate, commit
  and push `docs: plan shared agent flow stream`. Request Zack's plan approval.
- [x] [T-0067](../../work/tickets/T-0067-shared-agent-flow-stream-plan.md), coordinator:
  record Zack's plan approval before assigning RED.
- [x] [T-0068](../../work/tickets/T-0068-shared-agent-flow-red-review.md), Test writer: add failing root/slug/namespace/parent mapping
  tests for criteria 1-4 and 8-9 in `.trae/agent-flow/test_adapter.py`;
  exercise the real CLI from temporary Git worktrees.
- [x] [T-0068](../../work/tickets/T-0068-shared-agent-flow-red-review.md), Test writer: add failing multiprocess init/append, namespaced
  heartbeat, reactivation and documented-command tests for criteria 5-7 and
  10; run RED and unchanged legacy tests, then commit and push RED evidence.
- [x] [T-0071](../../work/tickets/T-0071-shared-agent-flow-red-round3.md), coordinator:
  record fresh independent RED review and Zack's final escalation resolution.
- [x] [T-0072](../../work/tickets/T-0072-shared-agent-flow-green.md), Implementer: resolve common-dir default and deterministic slug/
  ID mapping in the adapter (criteria 1-3, 8-9); pass targeted tests.
- [x] [T-0072](../../work/tickets/T-0072-shared-agent-flow-green.md), Implementer: implement lock, idempotent session init and root
  registration, atomic appends, attribution and heartbeat mapping (criteria
  2, 4-6, 10); pass targeted concurrency tests.
- [x] [T-0072](../../work/tickets/T-0072-shared-agent-flow-green.md), Implementer: update `docs/agent-flow.md`, reconcile ship init
  and stale worktree-local stream guidance (criterion 7), keeping existing
  role command examples and fresh Reviewer isolation unchanged.
- [ ] [T-0072](../../work/tickets/T-0072-shared-agent-flow-green.md), Implementer: run full adapter suite, applicable CI checks,
  documentation/path hygiene and `git diff --check`; commit and push each
  implementation task separately.
- [ ] [T-0073](../../work/tickets/T-0073-ship-shared-agent-flow.md), coordinator:
  run PR, CI and fresh review on Zack's explicit ship request. Zack merges.
