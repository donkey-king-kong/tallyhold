# T-0061: Draft first-deploy plan

## Assignment

- Status: in_review
- Owner actor: R-0061/coordinator
- Role: coordinator / Architect
- Run: [R-0061](../runs/R-0061.md); predecessor [R-0060](../runs/R-0060.md)
- Feature / task: issue #35, Track C plan-only request
- Authorization: Zack's explicit draft-only request, 2026-11-17
- Dependencies: [T-0060](T-0060-first-deploy-maintenance.md) shipped
- Branch / worktree: `chore/first-deploy-plan`, `../tallyhold-chore-first-deploy`
- Issue / PR: #35 / none for draft
- Updated: 2026-11-17T07:16:41Z

## Scope

Compare Tokyo API free-tier options; choose frontend approach; map public
settings, trusted secrets, Google/Supabase OAuth callbacks and CORS. Include
second-user safety gates. Draft only; stop for Zack's approval.

## Acceptance

- [x] First-deploy draft saved without execution; Zack approval pending.

## Checkpoint

- Last completed action: primary-source research and plan draft written; no provisioning or secret action.
- Evidence: [hosting research](../../specs/chore-first-deploy/hosting-research.md) and [draft plan](../../specs/chore-first-deploy/first-deploy-plan.md); merged PR #37 at `ef03c8c`.
- Worktree state: draft and checkpoint uncommitted pending verification/push.
- Remaining work: verify, commit/push and request Zack's plan approval.
- Blocker / unblock action: none.
- Next action: check draft consistency and links; commit/push draft, then stop for Zack's approval.
- Handoff recipient: Zack for plan approval.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T06:57:27Z | R-0060/coordinator | Reserved draft-only assignment | Wait for maintenance PR ship |
| 2026-11-17T07:14:08Z | R-0061/coordinator | Took over after PR #37 merge on new plan-only branch; research worker launched | Draft plan and stop for Zack approval |
| 2026-11-17T07:16:41Z | R-0061/coordinator | Research note and plan draft saved, including pilot admission and pending old-run gates | Verify, commit/push and request approval |
