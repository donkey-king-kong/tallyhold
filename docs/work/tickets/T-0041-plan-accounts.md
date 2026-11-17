# T-0041: Plan Feature 006 accounts

## Assignment

- Status: in_review
- Owner actor: R-0040/coordinator
- Role: Architect (coordinator)
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [approved Feature 006 spec](../../specs/006-accounts/spec.md), [plan](../../specs/006-accounts/plan.md), [tasks](../../specs/006-accounts/tasks.md)
- Authorization: Zack's 2026-11-17 Gate 1 approval and request for architecture plan/tasks; no schema/architecture-plan approval yet
- Dependencies: [T-0040](T-0040-draft-accounts-spec.md), Features 003 and 005
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / not created
- Updated: 2026-11-17T07:18:35Z

## Scope

Design the account API/UI layers, migration for SG broker seeds and
case-insensitive user-scoped name uniqueness replacing the 003 constraint,
tests and ordered RED/GREEN tasks. Allowed outputs are `plan.md`, `tasks.md`,
a supporting ADR if needed, and Track A work records. No tests, production
code, migration file, CI, Compose or AGENTS.md edit before plan approval.

## Acceptance

- [x] AC1-AC7 map to concrete files, layer boundaries and verification.
- [x] Migration and existing-data/rollback safety are explicit.
- [x] Ordered tasks preserve RED review and separate plan approval.
- [x] Documents and checkpoint are committed/pushed for Zack's plan gate.

## Checkpoint

- Last completed action: committed/pushed the plan, tasks, ADR, glossary and initial planning checkpoint.
- Evidence: pushed `387fae1` on `origin/feature/006-accounts`; [plan](../../specs/006-accounts/plan.md), [tasks](../../specs/006-accounts/tasks.md), [ADR 0004](../../adr/0004-account-name-and-broker-catalog.md); staged whitespace check passed.
- Worktree state: clean at pushed `387fae1` before this final tracking checkpoint.
- Remaining work: Zack's separate schema/architecture-plan decision; no RED or implementation.
- Blocker / unblock action: separate Zack schema/architecture-plan approval before RED or implementation.
- Next action: Zack reviews the pushed plan and tasks and explicitly approves or requests changes; do not start RED without approval.
- Handoff recipient: Zack for plan approval.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:11:22Z | R-0040/coordinator | Claimed approved Feature 006 planning, spec `c5469b8` pushed; no plan approval inferred | Draft plan/tasks and migration decision |
| 2026-11-17T07:15:48Z | R-0040/coordinator | Wrote AC1-AC7 plan, ordered RED/review/GREEN tasks and proposed migration ADR; documentation checks passed | Commit/push planning handoff; await separate approval |
| 2026-11-17T07:18:35Z | R-0040/coordinator | Committed/pushed planning handoff `387fae1`; final tracking checkpoint follows | Stop for Zack's separate plan decision; RED prohibited |
