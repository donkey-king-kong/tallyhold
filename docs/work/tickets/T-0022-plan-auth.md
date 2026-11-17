# T-0022: Plan Feature 005 authentication

## Assignment

- Status: ready
- Owner actor: R-0026/coordinator
- Role: Architect
- Run: [R-0026](../runs/R-0026.md)
- Feature / task: [Feature 005 approved spec](../../specs/005-auth/spec.md); [plan](../../specs/005-auth/plan.md) and [tasks](../../specs/005-auth/tasks.md) to draft
- Authorization: Zack approved Feature 005 Gate 1 and requested architecture plan/tasks on 2026-11-17; schema/architecture plan approval still required
- Dependencies: [T-0021](T-0021-draft-auth-spec.md), Feature 003 repositories
- Branch / worktree: `feature/005-auth`
- Worktree path: `../tallyhold-feature-005-auth`
- Issue / PR: [issue #27](https://github.com/donkey-king-kong/tallyhold/issues/27); no PR
- Updated: 2026-11-17T02:39:24Z

## Scope

Map AC1-AC5 to the identity, Next.js, PostgreSQL, configuration and operational boundaries; provide an ordered RED/GREEN task list and significant architecture ADR. Stop at Zack's plan gate. No feature code, tests, migrations, secrets, Feature 006 spec or PR.

## Acceptance

- [ ] Proposed plan maps every criterion to interfaces, files, tests and migration verification.
- [ ] Ordered tasks and significant decision record are available for Zack's plan approval.
- [ ] No RED tests or implementation before Zack explicitly approves the schema/architecture plan.

## Checkpoint

- Last completed action: claimed planning assignment after explicit Gate 1 approval.
- Evidence: Feature 005 spec status Approved; confirmed Data API OFF, current ES256 signing key, legacy HS256 tokens rejected, 3600-second JWT lifetime.
- Worktree state: approved-spec documentation pending commit/push; no plan yet.
- Remaining work: commit spec checkpoint, draft plan/tasks/ADR, hand off for plan approval.
- Blocker / unblock action: RED/implementation requires Zack's plan approval.
- Next action: commit/push approved spec and product alignment, then inspect remaining architecture sources and draft plan/tasks.
- Handoff recipient: Zack at schema/architecture plan gate.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T02:39:24Z | R-0026/coordinator | Claimed Architect handoff after Zack's Gate 1 approval; separate plan gate remains | Commit approved spec, draft plan and tasks |
