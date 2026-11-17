# T-0064: Constitution cost safeguard

## Assignment

- Status: in_progress
- Owner actor: R-0063/coordinator
- Role: coordinator / Planner
- Run: [R-0063](../runs/R-0063.md)
- Feature / task: [cost safeguard](../../specs/chore-cost-safeguard/spec.md)
- Authorization: Zack explicitly approved constitutional wording and requested separate PR, 2026-11-17
- Dependencies: plan docs PR #39 merged before final review
- Branch / worktree: `chore/cost-safeguard`, `../tallyhold-chore-cost-safeguard`
- Issue / PR: [#40](https://github.com/donkey-king-kong/tallyhold/issues/40) / pending
- Updated: 2026-11-17T07:43:15Z

## Scope

Add the non-negotiable two-separate-yes cost gate, one-yes payment-free
free-tier gate, and references in AGENTS, every role and ship/RED review.
Ship a separate reviewed PR; Zack alone merges.

## Acceptance

- [x] All requested files reference the canonical safeguard.
- [ ] CI and fresh review pass; PR labeled `needs-human` and left unmerged.

## Checkpoint

- Last completed action: wrote canonical cost rule, AGENTS summary, seven role links and both skill links; reference and whitespace checks passed. PR #39 merged as `b3a0bd1` separately.
- Evidence: `rg -l 'constitution rule 15'` lists all requested links; `git diff --check` passes; issue #40.
- Worktree state: uncommitted draft on older `ef03c8c` base.
- Remaining work: commit draft, integrate `b3a0bd1`, push, PR, CI and review.
- Blocker / unblock action: no blocker; final merge belongs to Zack.
- Next action: commit safeguard draft, merge current `main`, reconcile tracking index and verify.
- Handoff recipient: fresh Reviewer after green CI, then Zack.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-17T07:36:40Z | R-0063/coordinator | Claimed Track C cost safeguard on separate branch; created issue #40 | Implement docs and verify references |
| 2026-11-17T07:43:15Z | R-0063/coordinator | Safeguard references verified; PR #39 merged separately | Commit draft, integrate `main`, then open PR |
