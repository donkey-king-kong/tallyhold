# T-0066: Draft shared Agent Flow stream spec

## Assignment

- Status: in_review
- Owner actor: R-0064/coordinator
- Role: coordinator / Planner
- Run: [R-0064](../runs/R-0064.md)
- Feature / task: [Draft spec](../../specs/chore-shared-agent-flow-stream/spec.md)
- Authorization: Zack's Track C spec-only request, 2026-11-18; Gate 1 pending
- Dependencies: none
- Branch / worktree: `chore/shared-agent-flow-stream`,
  `../tallyhold-chore-shared-agent-flow-stream`
- Issue / PR: no dedicated issue or PR; related #38; superseded PR #45 closed
- Updated: 2026-11-18T02:40:39Z

## Scope

Draft the shared Agent Flow stream contract from the spec template. No plan,
adapter change, test change, or implementation until Zack approves Gate 1.

## Acceptance

- [x] Draft spec covers shared default root, automatic attribution, session
  reuse, concurrent appends, documentation, and exclusions.
- [ ] Zack approves the spec at Gate 1 before planning or implementation.

## Checkpoint

- Last completed action: validated the Draft spec and links after closing PR
  #45 without merging and updating low-priority issue #44.
- Evidence: PR #45 closed with supersession comment; issue #44 retains
  `priority: low`; `git diff --check`, documentation links, and path hygiene
  pass; `docs/specs/chore-shared-agent-flow-stream/spec.md` is Draft.
- Worktree state: uncommitted Draft spec and tracking records.
- Remaining work: commit, push, and present the Draft for Gate 1.
- Blocker / unblock action: Gate 1 approval is required before plan or code.
- Next action: commit and push this validated Draft for Zack to review.
- Handoff recipient: Zack for Gate 1.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-18T02:39:28Z | R-0064/coordinator | Claimed Track C spec-only assignment on current `main`; created isolated branch | Write Draft criteria, no plan or code |
| 2026-11-18T02:40:01Z | R-0064/coordinator | Drafted acceptance criteria and exclusions | Validate and push Draft; await Gate 1 |
| 2026-11-18T02:40:39Z | R-0064/coordinator | Validated Draft, links, whitespace, and path hygiene | Commit and push; await Gate 1 |
