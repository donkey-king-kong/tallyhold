# T-0028: Fix Feature 005 RED review findings

## Assignment

- Status: in_progress
- Owner actor: R-0031/coordinator
- Role: Test writer (after independent round-1 review)
- Run: [R-0031](../runs/R-0031.md)
- Feature / task: [005 spec](../../specs/005-auth/spec.md), [plan](../../specs/005-auth/plan.md), [RED review](../../specs/005-auth/red-review.md)
- Authorization: approved Feature 005 plan; Zack's 2026-11-17 independent reviewer deviation
- Dependencies: [T-0026](T-0026-auth-red-review.md) round-1 changes requested
- Branch / worktree: `feature/005-auth` / `../tallyhold-feature-005-auth`
- Issue / PR: issue #27 / no Feature 005 PR
- Updated: 2026-11-17T04:18:45Z

## Scope

Address the RED Reviewer findings in tests and `red-test-run.md` only:
composed JWT-to-HTTP denial and outage, precise rejection assertions,
key lifecycle/configuration, first-login rollback, and PKCE/callback safety.
Retain independently reviewed round-1 report and commit. No GREEN code.

## Acceptance

- [ ] RED failures remain caused by missing approved behavior; existing tests pass.
- [ ] New test commit and evidence are pushed; a different fresh reviewer decides round 2.

## Checkpoint

- Last completed action: added offline rotation/cache/configuration, composed JWT-to-HTTP, savepoint rollback and frontend PKCE/session/logging tests; backend RED lint/format and frontend lint/typecheck pass.
- Evidence: uncommitted RED test diff; backend ruff checks and frontend ESLint/TypeScript checks at 2026-11-17T04:18:45Z.
- Worktree state: five RED test files changed; no GREEN code.
- Remaining work: commit tests, separate new/existing suite run at that revision, evidence and fresh round 2.
- Blocker / unblock action: GREEN remains blocked until round-2 `APPROVE`.
- Next action: commit focused RED tests, rerun new and existing suites separately, then push evidence and dispatch round 2.
- Handoff recipient: a different fresh independent RED Reviewer.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T04:04:34Z | R-0031/coordinator | Round 1 requested changes in security and lifecycle RED tests; claimed Test writer fixes | Commit reviewer report; write RED-only cases |
| 2026-11-17T04:18:45Z | R-0031/coordinator | Added RED-only review fixes; backend ruff lint/format and frontend lint/typecheck pass | Commit tests; run RED and existing suites at the pinned test revision |
