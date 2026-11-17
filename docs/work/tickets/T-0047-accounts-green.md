# T-0047: Implement Feature 006 accounts

## Assignment

- Status: in_progress
- Owner actor: R-0040/coordinator
- Role: Implementer (separate from completed Test writer assignment)
- Run: [R-0040](../runs/R-0040.md)
- Feature / task: [006 spec](../../specs/006-accounts/spec.md), [approved plan](../../specs/006-accounts/plan.md), [tasks](../../specs/006-accounts/tasks.md)
- Authorization: Zack's Gate 1 and plan approval at `ab58947`; independent
  [RED APPROVE](https://github.com/donkey-king-kong/tallyhold/commit/abdd8ca1c1eda534c0d91048c1252732f3ef1107#commitcomment-210417698)
- Dependencies: [T-0042](T-0042-accounts-red.md), [T-0046](T-0046-accounts-red-review-cors.md)
- Branch / worktree: `feature/006-accounts` / `../tallyhold-feature-006-accounts`
- Issue / PR: [#36](https://github.com/donkey-king-kong/tallyhold/issues/36) / none
- Updated: 2026-11-17T08:48:02Z

## Scope

Implement the approved 0004 PostgreSQL catalog/name index, pure account
application and scoped HTTP API, authenticated `/accounts` UI and checks.
Commit by task; do not edit RED tests to make them pass. Track A alone writes
Alembic; CI, Compose and AGENTS.md remain untouched.

## Acceptance

- [x] Approved RED cases and existing suites pass; coverage 95.31%.
- [x] Ruff/format/mypy/import-linter and frontend lint/types/Vitest/build,
  migration round-trip and scans pass.
- [ ] Tasks and verification are checkpointed and pushed before ship
  (committed locally; push awaits T-0048's new cost gate).

## Checkpoint

- Last completed action: 196 backend pass/95.31% coverage, 23 frontend pass/build,
  14 targeted migration passes, scans clean.
- Evidence: base `82ec809`, RED test SHA `4137911`, reviewed head `abdd8ca`;
  identical APPROVE comment `210417698`.
- Worktree state: UI `19339bb`, compatibility `5dd39ed`; identity guard and
  checkpoint await commit.
- Remaining work: push after cost approval; ship under T-0048.
- Blocker / unblock action: new constitution rule 15 cost gate before CI.
- Next action: await Zack's cost approval, then push and hand off to T-0048.
- Handoff recipient: ship coordinator after GREEN checks.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T08:22:54Z | R-0040/coordinator | Claimed GREEN after pushed independent RED APPROVE | Implement migration first; no RED test edits |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Added 0004 seed/index and metadata; initial run exposed conflicting SQL parameter inference, corrected with explicit casts; rerun 10 passed | Commit schema, implement application |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Schema committed `9036940`; application operations and named constraint translation pass 13 unit tests, Ruff, mypy, import-linter | Commit application; add API |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Application committed `39d9713`; API composition passes 27 HTTP tests and checks; corrected module import boundary via top-level injection | Commit API; add UI |
| 2026-11-17T09:00:00Z | R-0040/coordinator | API committed `1a40aee`; UI 23 full frontend tests, lint, typecheck, build and Prettier pass; full backend initially 11 legacy test assumptions failed after committed HTTP fixture rows | Scope legacy assertions to test-created rows |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Updated 003 isolation assertions without modifying approved RED tests; full backend 196 pass, 95.31% coverage; Ruff, format, mypy and import-linter pass | Commit UI and compatibility; scan and ship |
| 2026-11-17T08:44:26Z | R-0040/coordinator | UI `19339bb`, test compatibility `5dd39ed`; token-scoped list guard reran 23 frontend tests, lint, types, build; 14 targeted migration tests passed. npm audit 0, pip-audit no vulnerabilities, gitleaks no leaks. Browser `/accounts` signed-out route rendered; browser auth configuration unavailable | Commit/push final GREEN checkpoint; start ship |
| 2026-11-17T08:44:26Z | R-0040/coordinator | Correction: earlier `09:00:00Z` checkpoint timestamps were estimates entered during work, not observed UTC times; results and commit IDs above are verified | Use observed UTC for subsequent checkpoints |
| 2026-11-17T08:48:02Z | R-0040/coordinator | Guard/checkpoint committed `2af1107`; current main merged `edf0713`; full backend 196/95.31% and frontend 23/build rerun green. New cost rule blocks CI initiation | Await Zack cost approval; push then ship under T-0048 |
