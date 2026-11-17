# T-0048: Ship Feature 006 accounts

## Assignment

- Status: blocked
- Owner actor: R-0040/coordinator
- Role: coordinator
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [006 spec](../../specs/006-accounts/spec.md),
  [approved plan](../../specs/006-accounts/plan.md),
  [tasks](../../specs/006-accounts/tasks.md)
- Authorization: Zack approved Gate 1, plan and RED correction rounds;
  independent RED APPROVE recorded in T-0046. New constitution rule 15
  requires cost approval before starting GitHub CI.
- Dependencies: [T-0047](T-0047-accounts-green.md)
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / none
- Updated: 2026-11-17T09:03:12Z

## Scope

Push the verified branch, open the PR against `main`, wait for CI, dispatch
fresh independent review and apply the ship merge gate. No production
migration is executed as part of local work. Do not edit CI, Compose or
AGENTS.md on Track A.

## Acceptance

- [ ] Branch pushed and PR assigned to `donkey-king-kong` with issue/spec.
- [ ] CI green and fresh review approves the current code diff.
- [ ] Ship merge gate passes and PR merges, or factual escalation is recorded.

## Checkpoint

- Last completed action: merged current `origin/main` locally at `edf0713`;
  reran backend 196 passing/95.31% coverage and frontend 23 passing/build,
  lint, format, types and import contracts.
- Evidence: GitHub repo visibility PUBLIC; workflow uses standard
  `ubuntu-latest`, caches enabled and no artifact upload. GitHub public
  standard runners are free; cache allowance is 10 GB per repo and Free
  artifact allowance is 500 MB. Billing-method status is not verified.
- Worktree state: clean; local branch ahead of remote, no PR.
- Remaining work: cost approval, push, PR, CI, fresh review, merge gate.
- Blocker / unblock action: Zack explicitly approved COST APPROVAL 1/2;
  request and await separate COST APPROVAL 2/2 before provider/CI action.
- Next action: request the second cost approval with the same GitHub
  action, cost bounds and undo terms; push only after separate explicit yes.
- Handoff recipient: Zack for cost gate, then ship coordinator.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T08:48:02Z | R-0040/coordinator | Claimed ship after GREEN and local main merge; paused before provider work under new cost rule | Request staged GitHub Actions cost approval |
| 2026-11-17T09:03:12Z | R-0040/coordinator | Zack explicitly selected "Approve stage 1" for GitHub Feature 006 PR/CI after $0 expected, unbounded paid-storage worst-case and cancellation terms were stated; branch remains local | Separately request COST APPROVAL 2/2; no CI yet |
