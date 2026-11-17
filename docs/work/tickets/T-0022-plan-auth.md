# T-0022: Plan Feature 005 authentication

## Assignment

- Status: done
- Owner actor: R-0028/coordinator
- Role: Architect
- Run: [R-0028](../runs/R-0028.md); prior [R-0027](../runs/R-0027.md) and [R-0026](../runs/R-0026.md)
- Feature / task: [Feature 005 approved spec](../../specs/005-auth/spec.md); [plan](../../specs/005-auth/plan.md) and [tasks](../../specs/005-auth/tasks.md) to draft
- Authorization: Zack approved Feature 005 Gate 1 and the architecture/schema plan with a per-process JWKS correction on 2026-11-17; RED authorized, GREEN awaits his RED review
- Dependencies: [T-0021](T-0021-draft-auth-spec.md), Feature 003 repositories
- Branch / worktree: `feature/005-auth`
- Worktree path: `../tallyhold-feature-005-auth`
- Issue / PR: [issue #27](https://github.com/donkey-king-kong/tallyhold/issues/27); no PR
- Updated: 2026-11-17T02:52:38Z

## Scope

Map AC1-AC5 to the identity, Next.js, PostgreSQL, configuration and operational boundaries; provide an ordered RED/GREEN task list and significant architecture ADR. Stop at Zack's plan gate. No feature code, tests, migrations, secrets, Feature 006 spec or PR.

## Acceptance

- [x] Proposed plan maps every criterion to interfaces, files, tests and migration verification.
- [x] Ordered tasks and significant decision record are available for Zack's plan approval.
- [x] No RED tests or implementation before Zack explicitly approves the schema/architecture plan.

## Checkpoint

- Last completed action: recorded Zack's explicit plan approval and removed the rejected cross-replica JWKS gate from the final plan/tasks/ADR.
- Evidence: approved two-table `docs/specs/005-auth/{plan,tasks}.md`, accepted ADR 0003; Zack's 2026-11-17 plan approval.
- Worktree state: planning docs/tracking uncommitted after pushed spec at `3e3c79c`.
- Remaining work: commit/push approved plan and hand RED to [T-0023](T-0023-auth-red.md).
- Blocker / unblock action: GREEN waits for Zack's RED-checkpoint review.
- Next action: validate and commit/push approved plan/tasks/ADR and tracking; start RED only afterward.
- Handoff recipient: Test writer via T-0023.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T02:39:24Z | R-0026/coordinator | Claimed Architect handoff after Zack's Gate 1 approval; separate plan gate remains | Commit approved spec, draft plan and tasks |
| 2026-11-17T02:42:10Z | R-0026/coordinator | Approved contract and product alignment committed/pushed at `3e3c79c`; Architect inspected identity/CI/Next seams and official Supabase JWKS caching/rotation guidance | Draft plan/tasks; wait for separate plan approval |
| 2026-11-17T02:44:35Z | R-0026/coordinator | Drafted plan/tasks mapping AC1-AC5, ADR 0003 and glossary; checked whitespace, approval gate and absence of Feature 006 spec/implementation | Present proposal; await Zack plan decision; planning files uncommitted |
| 2026-11-17T02:48:13Z | R-0027/coordinator | Took over uncommitted proposed plan; Zack requested PostgreSQL advisory-lock first login/runbook and 600s JWKS cache/60s global unknown-kid gate/3s timeout | Revise plan/tasks/ADR; show focused diff; no RED |
| 2026-11-17T02:50:17Z | R-0027/coordinator | Revised plan, tasks and ADR; 0003 now proposes a shared JWKS-refresh gate table to enforce the 60s cap across replicas, with lock-interleaving and timeout/flood RED tests | Show diff and wait for plan approval; planning files still uncommitted |
| 2026-11-17T02:52:38Z | R-0028/coordinator | Zack approved plan with in-memory, thread/async-safe per-process unknown-kid limit; 0003 contains only identities and erasure markers; RED authorized, GREEN held | Commit/push corrected approved plan and ADR before Test writer |
