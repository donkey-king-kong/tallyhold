# T-0027: Fresh reviewer fallback

## Assignment

- Status: in_progress
- Owner actor: R-0032/coordinator
- Role: coordinator (maintenance documentation)
- Run: [R-0032](../runs/R-0032.md)
- Feature / task: [maintenance scope](../../specs/chore-reviewer-fallback/spec.md)
- Authorization: Zack approved the workflow change on 2026-11-17 and will merge the PR
- Dependencies: merged PR #29
- Branch / worktree: `chore/reviewer-fallback` / `../tallyhold-chore-reviewer-fallback`
- Issue / PR: [#30](https://github.com/donkey-king-kong/tallyhold/issues/30) / [#31](https://github.com/donkey-king-kong/tallyhold/pull/31)
- Updated: 2026-11-17T04:03:00Z

## Scope

Make headless Claude the preferred RED and ship reviewer; on unavailable CLI
or failed launch, automatically use a different fresh Trae subagent with the
same restricted brief, outputs and round rules. Record reviewer type.
Documentation only, no active feature branch changes or application code.

## Acceptance

- [ ] Both procedures and reviewer role agree on the fallback, isolation and escalation.
- [ ] Documentation checks and PR CI pass; Zack receives the open PR for merge.

## Checkpoint

- Last completed action: pushed `1a92a21` and opened PR #31 assigned to Zack; local checks completed with guarded PostgreSQL after correcting a missing test URL.
- Evidence: `git diff --check`, six adapter tests, backend ruff/format/mypy/import-linter and 91 pytest (98% coverage), frontend lint/types/3 tests/build pass. PR #31 CI backend/frontend/security pending at review.
- Worktree state: tracking-only PR checkpoint pending commit; code head `1a92a21`.
- Remaining work: final tracking checkpoint, CI, independent PR review; Zack merges.
- Blocker / unblock action: none.
- Next action: commit/push this pre-dispatch checkpoint, confirm PR #31 CI green, then dispatch fresh PR Reviewer.
- Handoff recipient: Zack for final PR merge after review.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T04:00:13Z | R-0032/coordinator | Claimed approved maintenance task in a new main-based worktree; created issue #30 | Document and verify reviewer fallback |
| 2026-11-17T04:01:42Z | R-0032/coordinator | Drafted preferred Claude and automatic fresh Trae fallback for RED and ship; checked whitespace and six adapter tests | Commit/push; open PR #30-linked |
| 2026-11-17T04:03:00Z | R-0032/coordinator | Pushed `1a92a21`, opened PR #31 assigned to Zack; guarded backend 91/98% and frontend 3/build passed; PR CI pending | Commit/push final tracking checkpoint and review after CI |
