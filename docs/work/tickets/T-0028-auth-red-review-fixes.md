# T-0028: Fix Feature 005 RED review findings

## Assignment

- Status: blocked
- Owner actor: R-0031/coordinator
- Role: Test writer (after independent round-1 review)
- Run: [R-0031](../runs/R-0031.md)
- Feature / task: [005 spec](../../specs/005-auth/spec.md), [plan](../../specs/005-auth/plan.md), [RED review](../../specs/005-auth/red-review.md)
- Authorization: approved Feature 005 plan; Zack's 2026-11-17 independent reviewer deviation
- Dependencies: [T-0026](T-0026-auth-red-review.md) round-1 changes requested
- Branch / worktree: `feature/005-auth` / `../tallyhold-feature-005-auth`
- Issue / PR: issue #27 / no Feature 005 PR
- Updated: 2026-11-17T04:22:35Z

## Scope

Address the RED Reviewer findings in tests and `red-test-run.md` only:
composed JWT-to-HTTP denial and outage, precise rejection assertions,
key lifecycle/configuration, first-login rollback, and PKCE/callback safety.
Retain independently reviewed round-1 report and commit. No GREEN code.

## Acceptance

- [ ] RED failures remain caused by missing approved behavior; existing tests pass.
- [ ] New test commit and evidence are pushed; a different fresh reviewer decides round 2.

## Checkpoint

- Last completed action: revised tests/evidence pushed; independent round 2 returned `CHANGES_REQUESTED`.
- Evidence: [round-2 report](../../specs/005-auth/red-review.md) and [identical comment](https://github.com/donkey-king-kong/tallyhold/commit/d5cee6c86839f8a227191c721c6ae4c43f4c10cc#commitcomment-210393364).
- Worktree state: report and escalation checkpoint pending commit/push; no GREEN code.
- Remaining work: Zack decides the final-round RED escalation before further test revision or GREEN.
- Blocker / unblock action: process-wide limiter test conflict, missing failed-refresh throttle assertion and exact-head evidence finding; two rounds exhausted.
- Next action: preserve the reviewer report and ask Zack to resolve escalation; do not initiate a third RED round.
- Handoff recipient: Zack.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T04:04:34Z | R-0031/coordinator | Round 1 requested changes in security and lifecycle RED tests; claimed Test writer fixes | Commit reviewer report; write RED-only cases |
| 2026-11-17T04:18:45Z | R-0031/coordinator | Added RED-only review fixes; backend ruff lint/format and frontend lint/typecheck pass | Commit tests; run RED and existing suites at the pinned test revision |
| 2026-11-17T04:19:51Z | R-0031/coordinator | Test commit `24a0797`: backend RED 54 failed/1 passed and existing 91 passed; frontend RED 9 failed and existing 3 passed | Evidence appendix saved; commit/push and independently review round 2 |
| 2026-11-17T04:22:35Z | R-0031/coordinator | Different fresh Trae (GPT) round-2 reviewer requested changes after examining pushed evidence | Final-round escalation in T-0026; stop Test writer fixes and GREEN pending Zack |
