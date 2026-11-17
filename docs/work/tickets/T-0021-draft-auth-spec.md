# T-0021: Draft Feature 005 authentication spec

## Assignment

- Status: done
- Owner actor: R-0026/coordinator
- Role: Planner
- Run: [R-0026](../runs/R-0026.md); prior [R-0025](../runs/R-0025.md), [R-0024](../runs/R-0024.md), [R-0023](../runs/R-0023.md) and [R-0022](../runs/R-0022.md)
- Feature / task: [Feature 005](../../specs/005-auth/spec.md), Draft Gate 1 contract only
- Authorization: Zack explicitly approved Feature 005 Gate 1 on 2026-11-17 after four refinements
- Dependencies: Phase 1 PR #23 and production workflow PR #25 merged
- Branch / worktree: `feature/005-auth`
- Worktree path: `../tallyhold-feature-005-auth`
- Issue / PR: [issue #27](https://github.com/donkey-king-kong/tallyhold/issues/27); no PR
- Updated: 2026-11-17T02:39:24Z

## Scope

Draft observable authentication, identity provisioning and current-user requirements. Interview Zack on unresolved choices, record answers in the draft, then stop for Gate 1. Do not write Feature 006 spec, architecture plan, tasks, migrations, tests or feature code.

## Acceptance

- [x] Draft spec covers Google login, verified Supabase JWTs, identity mapping, first-login provisioning, current-user endpoint, tenant isolation and 006 dependency.
- [x] Open decisions are grilled and recorded; Zack explicitly approved at Gate 1 on 2026-11-17.

## Checkpoint

- Last completed action: recorded Zack's explicit Gate 1 approval, confirmed Data API shutdown and ES256/3600-second facts in the spec.
- Evidence: Zack's 2026-11-17 approval; `docs/specs/005-auth/spec.md` now Approved, `docs/spec.md` aligned.
- Worktree state: Draft, product-spec and tracking edits uncommitted.
- Remaining work: commit/push approved spec, then Architect drafts 005 plan/tasks; T-0022 owns the plan approval gate.
- Blocker / unblock action: none for spec; no RED before plan approval.
- Next action: validate and commit/push approved spec and product alignment, including tracking checkpoint.
- Handoff recipient: Architect via T-0022.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T10:44:38Z | R-0022/coordinator | Claimed Planner assignment after Phase 1 closeout and issue #27 creation | Draft 005 spec; no 006 or code |
| 2026-11-16T10:45:29Z | R-0022/coordinator | Drafted 005 acceptance criteria and five decision groups; validated whitespace and absence of 005 plan/006 spec | Draft saved locally; start grill-me; no commit/push authorization |
| 2026-11-17T01:59:12Z | R-0023/coordinator | Took over saved uncommitted Draft; issue #27 open and no competing branch work; received Zack's five Round 1 decisions | Revise specs, then ask only dependent decisions |
| 2026-11-17T02:01:24Z | R-0023/coordinator | Recorded five agreed answers, JWKS-only verification and pre-planning key check; product spec updated; whitespace and scope checks passed | Ask backup/timing and erased-token replay questions |
| 2026-11-17T02:14:18Z | R-0024/coordinator | Took over saved Draft; Zack accepted 30-day active erasure and expiring deny marker with runbook-only insertion/deletion | Revise Draft, validate, present full text |
| 2026-11-17T02:16:13Z | R-0024/coordinator | Recorded Round 2 decisions, aligned product spec marker table and erasure stance, checked whitespace and absence of plan/006 spec | Present complete Draft; await explicit Gate 1 decision |
| 2026-11-17T02:26:42Z | R-0025/coordinator | Took over saved Draft; Zack requested authenticated-role and sub checks, offline JWT tests, CORS/bearer constraints, and dated Data API OFF note | Revise only Draft and present focused diff; do not assume OFF completed |
| 2026-11-17T02:27:39Z | R-0025/coordinator | Added four refinements to Draft; dated OFF operation still awaits Zack's confirmation; whitespace/scope checks passed | Show focused spec diff, wait for explicit Gate 1 decision |
| 2026-11-17T02:39:24Z | R-0026/coordinator | Zack explicitly approved Gate 1 with refinements; Data API OFF confirmed, ES256 via JWKS, HS256 rejection and 3600-second lifetime recorded | Commit/push approved spec and product alignment before Architect plan |
