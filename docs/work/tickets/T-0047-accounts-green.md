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
- Updated: 2026-11-17T09:00:00Z

## Scope

Implement the approved 0004 PostgreSQL catalog/name index, pure account
application and scoped HTTP API, authenticated `/accounts` UI and checks.
Commit by task; do not edit RED tests to make them pass. Track A alone writes
Alembic; CI, Compose and AGENTS.md remain untouched.

## Acceptance

- [ ] Approved RED cases and existing suites pass; coverage >=80%.
- [ ] Ruff/format/mypy/import-linter and frontend lint/types/Vitest/build,
  migration round-trip and scans pass.
- [ ] Tasks and verification are checkpointed and pushed before ship.

## Checkpoint

- Last completed action: API passes 27 PostgreSQL tests, Ruff, mypy and import-linter.
- Evidence: base `82ec809`, RED test SHA `4137911`, reviewed head `abdd8ca`;
  identical APPROVE comment `210417698`.
- Worktree state: schema `9036940`, application `39d9713`; API awaiting commit.
- Remaining work: implement UI; full checks and ship.
- Blocker / unblock action: none.
- Next action: commit API slice, then implement authenticated account UI.
- Handoff recipient: ship coordinator after GREEN checks.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T08:22:54Z | R-0040/coordinator | Claimed GREEN after pushed independent RED APPROVE | Implement migration first; no RED test edits |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Added 0004 seed/index and metadata; initial run exposed conflicting SQL parameter inference, corrected with explicit casts; rerun 10 passed | Commit schema, implement application |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Schema committed `9036940`; application operations and named constraint translation pass 13 unit tests, Ruff, mypy, import-linter | Commit application; add API |
| 2026-11-17T09:00:00Z | R-0040/coordinator | Application committed `39d9713`; API composition passes 27 HTTP tests and checks; corrected module import boundary via top-level injection | Commit API; add UI |
