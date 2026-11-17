# T-0028: Fix Feature 005 RED review findings

## Assignment

- Status: in_progress
- Owner actor: R-0033/coordinator
- Role: Test writer (after independent round-1 review)
- Run: [R-0033](../runs/R-0033.md), after [R-0031](../runs/R-0031.md)
- Feature / task: [005 spec](../../specs/005-auth/spec.md), [plan](../../specs/005-auth/plan.md), [RED review](../../specs/005-auth/red-review.md)
- Authorization: approved Feature 005 plan; Zack's 2026-11-17 one-extra-RED-round decision on issue #27
- Dependencies: [T-0026](T-0026-auth-red-review.md) round-1 changes requested
- Branch / worktree: `feature/005-auth` / `../tallyhold-feature-005-auth`
- Issue / PR: issue #27 / no Feature 005 PR
- Updated: 2026-11-17T05:23:36Z

## Scope

Address the RED Reviewer findings in tests and `red-test-run.md` only:
composed JWT-to-HTTP denial and outage, precise rejection assertions,
key lifecycle/configuration, first-login rollback, and PKCE/callback safety.
Retain independently reviewed round-1 report and commit. No GREEN code.
For the authorized third round, change only test clock isolation and the
failed-unknown-key refresh throttle assertion, plus exact-head RED evidence.

## Acceptance

- [ ] RED failures remain caused by missing approved behavior; existing tests pass.
- [ ] New test commit and evidence are pushed; a different fresh reviewer decides authorized round 3.

## Checkpoint

- Last completed action: targeted tests committed at `8d2a82c` and `dc8e087`; pushed `dc8e0875dcbf8aedbdaf450de45ed3682f507f77` matches remote and separate RED/existing suites reran at that exact head.
- Evidence: [round-3 evidence addendum](../../specs/005-auth/red-test-run.md): backend 54 RED fail/1 pass, existing 91 pass; frontend 9 RED fail, existing 3 pass; backend Ruff and frontend lint/typecheck pass. `24a0797..d5cee6c` was docs-only.
- Worktree state: evidence and checkpoint edits pending commit/push; no GREEN code.
- Remaining work: push docs-only evidence head, verify test-tree equivalence, dispatch a different fresh scoped round-3 reviewer.
- Blocker / unblock action: none for RED fixes; GREEN still requires third-round `APPROVE`.
- Next action: commit/push evidence and coordinator checkpoint, verify remote SHA and docs-only gap, then dispatch independent round 3.
- Handoff recipient: R-0033/coordinator acting as Test writer; then different fresh Reviewer.

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
