# T-0040: Draft Feature 006 accounts spec

## Assignment

- Status: done
- Owner actor: R-0040/coordinator
- Role: Planner (coordinator)
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [Feature 006 Draft spec](../../specs/006-accounts/spec.md)
- Authorization: Zack's 2026-11-17 Track A request and explicit Gate 1 approval of Feature 006 as drafted; no schema/architecture-plan approval yet
- Dependencies: merged Features 003 and 005; [Track A handoff](../parallel-tracks.md)
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / not created
- Updated: 2026-11-17T07:11:22Z

## Scope

Draft the broker list, authenticated user-scoped account CRUD and minimal UI
contract; interview Zack on open decisions. Allowed outputs are the Draft spec
and Track A work records. No plan, tasks, code, migrations, CI, Compose or
AGENTS.md edits. Track A alone owns future Alembic changes until 006 merges.

## Acceptance

- [x] Testable Draft spec reflects the approved 003/005 contracts and issue.
- [x] Round 1 and Round 2 choices were put to Zack and recorded; no product questions remain.
- [x] Handoff names the exact next action and leaves implementation gated.
- [x] Zack explicitly approved the complete spec at Gate 1.

## Checkpoint

- Last completed action: committed/pushed the approved spec and T-0040 checkpoint.
- Evidence: [Approved spec](../../specs/006-accounts/spec.md) AC1-AC7, Zack's 2026-11-17 approval and pushed `c5469b8`; issue #36.
- Worktree state: spec and original T-0040 checkpoint pushed; this SHA checkpoint will accompany plan tracking.
- Remaining work: schema/architecture plan and separate approval; no RED or implementation.
- Blocker / unblock action: plan approval is required before execution.
- Next action: proceed under [T-0041](T-0041-plan-accounts.md) to plan/tasks; await Zack's separate plan gate before RED.
- Handoff recipient: Architect under T-0041.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T06:59:15Z | R-0040/coordinator | Claimed first unused Track A IDs, created isolated worktree and issue #36 | Draft spec, then grill before Gate 1 |
| 2026-11-17T07:00:47Z | R-0040/coordinator | Wrote Draft with AC1-AC6 and six explicit open questions; documentation whitespace check passed | Ask first frontier; 409/404/error detail follows deletion and shape decisions |
| 2026-11-17T07:03:57Z | R-0040/coordinator | Zack accepted all five Round 1 recommendations and specified SG as both seeded broker jurisdictions; updated Draft ACs | Ask dependent Round 2 questions; Gate 1 still pending |
| 2026-11-17T07:08:19Z | R-0040/coordinator | Zack accepted four Round 2 answers with Phase 4 reporting-currency allowance; updated AC1-AC7 and closed product questions; checks passed | Present full Draft for Gate 1; do not infer approval |
| 2026-11-17T07:10:11Z | R-0040/coordinator | Zack explicitly approved Feature 006 at Gate 1 as drafted; marked spec Approved | Commit/push spec and tracking; start separate architecture plan ticket |
| 2026-11-17T07:11:22Z | R-0040/coordinator | Committed/pushed approved spec and original tracking at `c5469b8`; claimed T-0041 | Continue planning, stop before RED |
