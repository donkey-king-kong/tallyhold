# T-0052: Independently review Feature 004 RED handoff

## Assignment

- Status: ready
- Owner actor: R-0051/coordinator (fresh Reviewer not yet dispatched)
- Role: coordinator records fresh RED Reviewer lifecycle externally
- Run: [R-0051](../runs/R-0051.md)
- Feature / task: [spec](../../specs/004-agent-monitor/spec.md), [approved plan](../../specs/004-agent-monitor/plan.md), [RED evidence](../../specs/004-agent-monitor/red-test-run.md)
- Authorization: Zack approved the plan as written at `64a4246`; review is required before GREEN.
- Dependencies: [T-0051](T-0051-agent-monitor-red.md), pushed RED head and independently verified evidence.
- Branch / worktree: `feature/004-agent-monitor` / `../tallyhold-feature-004-agent-monitor`
- Worktree path: `../tallyhold-feature-004-agent-monitor`
- Issue / PR: [#20](https://github.com/donkey-king-kong/tallyhold/issues/20); no implementation PR
- Updated: 2026-11-17T07:12:47Z

## Scope

Fresh Reviewer sees only the permitted role inputs, base/head SHAs and approved feature files. It writes only `red-review.md` and posts identical contents on the pushed RED commit. Coordinator checks report/comment and commits the report; at most two independent rounds. No GREEN before `APPROVE`.

## Acceptance

- [ ] Fresh independent Reviewer checklist covers all AC1-AC16, planned decisions, failures, existing suite and allowed infrastructure.
- [ ] Report and reviewed commit comment match, with exact `VERDICT` final line.
- [ ] Any requested changes receive another Test writer commit and a different fresh Reviewer; escalation goes to Zack.

## Checkpoint

- Last completed action: coordinator prepared a collecting RED test suite and evidence at test commit `f723913`.
- Evidence: [red-test-run.md](../../specs/004-agent-monitor/red-test-run.md); expected 25 failures and 6 existing passes.
- Worktree state: evidence/checkpoint pending commit/push; no Reviewer dispatched.
- Remaining work: push RED evidence, verify remote SHA, dispatch fresh reviewer and record verdict/comment URL.
- Blocker / unblock action: review cannot begin until evidence head is pushed.
- Next action: commit/push RED evidence, then use headless Claude with only `docs/agents/red-reviewer.md`, feature path, round 1, base `0988e8e` and pushed head.
- Handoff recipient: independent RED Reviewer after pushed head is verified.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:12:47Z | R-0051/coordinator | Reserved RED review assignment; no reviewer started | Push evidence before fresh dispatch |
