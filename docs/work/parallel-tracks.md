# Parallel track coordinator handoff

This is an ID and write-ownership reservation for [issue #33](https://github.com/donkey-king-kong/tallyhold/issues/33).
It takes effect when its PR merges into `main`. It is not an assignment,
approval, live-agent claim, or evidence that these worktrees exist. Read
[work tracking](README.md) and verify Git/GitHub state before claiming a track.

| Track | Branch and intended sibling worktree | Exclusive ticket IDs | Exclusive run IDs | Next authorized stage |
| --- | --- | --- | --- | --- |
| A: accounts | `feature/006-accounts`, `../tallyhold-feature-006-accounts` | T-0040..T-0049 | R-0040..R-0049 | Draft Feature 006 spec against merged 005; obtain Gate 1 and schema/architecture-plan approval before RED or implementation |
| B: agent monitor | `feature/004-agent-monitor`, `../tallyhold-feature-004-agent-monitor` | T-0050..T-0059 | R-0050..R-0059 | Reconcile the existing remote branch and approved [004 spec](../specs/004-agent-monitor/spec.md); draft plan for Zack's separate approval before tests or code |
| C: first deploy | `chore/first-deploy`, `../tallyhold-chore-first-deploy` | T-0060..T-0069 | R-0060..R-0069 | Scope hosting, Google OAuth provider smoke test and deployment gates in a separate maintenance issue/plan; no live deployment or secret access implied |

## Allocation and ownership

- One coordinator allocates the next unused ID **within each track's block**
  after syncing and checking remote work. The reservation does not create
  tickets/runs: create them on the owning branch when work is actually assigned.
  No other work uses these blocks. Unreserved work uses unused IDs outside
  them. Never reuse an ID; if branches collide, rename the unmerged record
  and all links before shipping. If a block fills, stop and coordinate a new
  allocation instead of taking another track's IDs.
- A single owner and tool work on each branch at a time. Use separate
  worktrees and `.agent-flow/` sessions; commit and push for device handoffs.
  The existing remote 004 branch must be inspected and synchronized, not
  replaced or assumed to have an active local owner.
- **Track A is the sole Alembic writer until 006 merges.** It owns new
  `backend/alembic/` revisions and migration-chain integration. B and C do
  not add schema migrations. A later schema track starts from merged 006
  and obtains its own plan approval; no parallel `0004` revision is assigned.
- **Track C is the sole writer of `.github/workflows/ci.yml` and
  `docker-compose.yml`** while these tracks overlap. A and B request any
  needed CI/Compose changes through C instead of editing those files.
  Shared dependency locks, product docs and tracking indexes still require
  explicit merge reconciliation; the coordinator alone edits the shared
  work index and roadmap.
- Merge approved branches one at a time. Integrate current `main` into an
  open branch before final checks/review when the base changes; reconcile
  lockfiles, indexes and migration ancestry. Do not rewrite a pushed,
  reviewed head. A substantive post-review change requires fresh review.
  Apply each branch's normal RED, CI, PR and ship gates.

## Outstanding decisions

Feature 005 code merged in [PR #32](https://github.com/donkey-king-kong/tallyhold/pull/32);
reviewer fallback merged in [PR #31](https://github.com/donkey-king-kong/tallyhold/pull/31).
Neither merge proves production Google login or first deployment. Zack retains
Gate 1, required schema/architecture-plan and production migration approvals.
Before anyone other than Zack uses the service, follow the Feature 005
[operator runbook](../runbooks/erase-user.md): inspect the production Data
API setting, verify actual backup/log retention and complete the disposable
erasure walkthrough. Check the current production CI approval state rather
than inferring execution from a merged PR.
