# T-0028: Fix Feature 005 RED review findings

## Assignment

- Status: done
- Owner actor: R-0033/coordinator
- Role: Test writer (after independent round-1 review)
- Run: [R-0033](../runs/R-0033.md), after [R-0031](../runs/R-0031.md)
- Feature / task: [005 spec](../../specs/005-auth/spec.md), [plan](../../specs/005-auth/plan.md), [RED review](../../specs/005-auth/red-review.md)
- Authorization: approved Feature 005 plan; Zack's 2026-11-17 one-extra-RED-round decision on issue #27
- Dependencies: [T-0026](T-0026-auth-red-review.md) round-1 changes requested
- Branch / worktree: `feature/005-auth` / `../tallyhold-feature-005-auth`
- Issue / PR: issue #27 / no Feature 005 PR
- Updated: 2026-11-17T05:32:17Z

## Scope

Address the RED Reviewer findings in tests and `red-test-run.md` only:
composed JWT-to-HTTP denial and outage, precise rejection assertions,
key lifecycle/configuration, first-login rollback, and PKCE/callback safety.
Retain independently reviewed round-1 report and commit. No GREEN code.
For the authorized third round, change only test clock isolation and the
failed-unknown-key refresh throttle assertion, plus exact-head RED evidence.

## Acceptance

- [x] RED failures remain caused by missing approved behavior; existing tests pass.
- [x] New test commit and evidence were pushed; a different fresh reviewer approved authorized round 3.

## Checkpoint

- Last completed action: different fresh Trae (GPT) reviewer `arun_6afbe68f8f6c1606eab14de5` returned `APPROVE` on Zack's scoped third RED round.
- Evidence: [round-3 evidence](../../specs/005-auth/red-test-run.md), [approved report](../../specs/005-auth/red-review.md) and identical [commit comment](https://github.com/donkey-king-kong/tallyhold/commit/b349e0ac5e8e994b64bfa7cc578d3c9e6de7df18#commitcomment-210399953).
- Worktree state: reviewer report and handoff pending coordinator commit/push; tests unchanged since `dc8e087`.
- Remaining work: GREEN in [T-0029](T-0029-auth-green.md).
- Blocker / unblock action: none for RED; RED gate satisfied.
- Next action: coordinator commits report and GREEN handoff.
- Handoff recipient: R-0033/coordinator as Implementer in T-0029.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T04:04:34Z | R-0031/coordinator | Round 1 requested changes in security and lifecycle RED tests; claimed Test writer fixes | Commit reviewer report; write RED-only cases |
| 2026-11-17T04:18:45Z | R-0031/coordinator | Added RED-only review fixes; backend ruff lint/format and frontend lint/typecheck pass | Commit tests; run RED and existing suites at the pinned test revision |
| 2026-11-17T04:19:51Z | R-0031/coordinator | Test commit `24a0797`: backend RED 54 failed/1 passed and existing 91 passed; frontend RED 9 failed and existing 3 passed | Evidence appendix saved; commit/push and independently review round 2 |
| 2026-11-17T04:22:35Z | R-0031/coordinator | Different fresh Trae (GPT) round-2 reviewer requested changes after examining pushed evidence | Final-round escalation in T-0026; stop Test writer fixes and GREEN pending Zack |
| 2026-11-17T05:20:40Z | R-0033/coordinator | Zack authorized one extra targeted RED round and took over a clean synchronized branch | Fix only round-2 findings 1-3; evidence and different fresh reviewer before GREEN |
| 2026-11-17T05:20:40Z | R-0033/coordinator | Targeted fake process clock and failed-fetch second-key rejection added; Ruff lint/format pass | Commit the test revision and rerun RED/existing suites at its SHA |
| 2026-11-17T05:23:36Z | R-0033/coordinator | Pushed `dc8e087`; backend RED 54 fail/1 pass and existing 91 pass, frontend RED 9 fail and existing 3 pass; lint/typecheck pass | Commit/push exact-head evidence and hand off restricted round 3 |
| 2026-11-17T05:32:17Z | R-0033/coordinator | Third fresh reviewer approved all targeted findings and checklist item 6 | Report/comment `210399953`; stop Test writer role, Implementer begins T-0029 |
