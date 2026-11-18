# T-0066: Draft shared Agent Flow stream spec

## Assignment

- Status: in_review
- Owner actor: R-0065/coordinator
- Role: coordinator / Planner
- Run: [R-0065](../runs/R-0065.md), after [R-0064](../runs/R-0064.md)
- Feature / task: [Draft spec](../../specs/chore-shared-agent-flow-stream/spec.md)
- Authorization: Zack's Track C spec-only amendment request, 2026-11-18;
  Gate 1 pending
- Dependencies: none
- Branch / worktree: `chore/shared-agent-flow-stream`,
  `../tallyhold-chore-shared-agent-flow-stream`
- Issue / PR: no dedicated issue or PR; related #38; superseded PR #45 closed
- Updated: 2026-11-18T02:56:26Z

## Scope

Draft the shared Agent Flow stream contract from the spec template. No plan,
adapter change, test change, or implementation until Zack approves Gate 1.

## Acceptance

- [x] Draft spec covers shared default root, automatic attribution, session
  reuse, concurrent appends, documentation, and exclusions.
- [ ] Zack approves the spec at Gate 1 before planning or implementation.

## Checkpoint

- Last completed action: added criteria 8-10 for main checkout namespacing,
  idempotent IDs, and silent init reuse with namespaced heartbeats.
- Evidence: spec diff contains only three appended criteria; `git diff
  --check` passes; Draft status unchanged.
- Worktree state: spec and tracking changes pending commit.
- Remaining work: commit and push the amended Draft; Gate 1 pending.
- Blocker / unblock action: Gate 1 approval is required before plan or code.
- Next action: commit and push the validated Draft; ask Zack for Gate 1.
- Handoff recipient: Zack for Gate 1.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T02:39:28Z | R-0064/coordinator | Claimed Track C spec-only assignment on current `main`; created isolated branch | Write Draft criteria, no plan or code |
| 2026-11-18T02:40:01Z | R-0064/coordinator | Drafted acceptance criteria and exclusions | Validate and push Draft; await Gate 1 |
| 2026-11-18T02:40:39Z | R-0064/coordinator | Validated Draft, links, whitespace, and path hygiene | Commit and push; await Gate 1 |
| 2026-11-18T02:55:49Z | R-0065/coordinator | Resumed spec-only assignment on clean branch at `43ff900`; confirmed prior Draft was pushed | Add three criteria, validate, commit and push; Gate 1 remains pending |
| 2026-11-18T02:56:26Z | R-0065/coordinator | Appended three acceptance criteria; verified spec-only diff and whitespace | Commit and push; hand Draft to Zack for Gate 1 |
