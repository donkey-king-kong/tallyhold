# T-0018: Ship production Alembic migrations

## Assignment

- Status: in_progress
- Owner actor: R-0020/coordinator
- Role: coordinator / DevOps
- Run: [R-0020](../runs/R-0020.md)
- Feature / task: [maintenance spec](../../specs/chore-production-migrations/spec.md),
  [plan](../../specs/chore-production-migrations/plan.md) and
  [tasks](../../specs/chore-production-migrations/tasks.md)
- Authorization: Zack's explicit maintenance and ship request, 2026-11-16
- Dependencies: Feature 003 schema merged as PR #23
- Branch / worktree: `chore/production-migrations`
- Worktree path: `../tallyhold-chore-production-migrations`
- Issue / PR: issue #24; PR not yet created
- Updated: 2026-11-16T09:22:00Z

## Scope

Run CI-gated, approval-required Alembic upgrades on production, document the
single migration tool, configure the GitHub environment and ship. No schema
changes, secrets inspection, API deployment or live migration during local
verification. Escalate any required approved-schema change to Zack.

## Acceptance

- [x] Workflow triggers and job gating verified without touching production.
- [x] `production` environment requires Zack's approval; Supabase integration
  OFF is documented (external Supabase setting not inspected).
- [ ] Local and PR checks pass; fresh review and ship merge gate completed.

## Checkpoint

- Last completed action: configured protected `production`; local workflow
  checks and full backend/frontend/security verification passed.
- Evidence: GitHub required reviewer `donkey-king-kong`, admin bypass disabled;
  actionlint and structural assertions pass; 91 backend tests at 98.42%
  coverage, 3 frontend tests, lint/format/types/build, both audits and
  gitleaks pass. Alembic production-only dependency available. No live URL read.
- Worktree state: uncommitted workflow, README, spec and tracking files
- Remaining work: commit/push, PR CI, fresh review, merge gate and cleanup.
- Blocker / unblock action: none; Supabase's OFF setting must remain in place.
- Next action: commit and push this checkpoint, open PR #24 issue-linked and
  confirm CI before fresh review.
- Handoff recipient: fresh Reviewer after green PR CI.

## History

| UTC time | Actor | Event and observed result | Evidence / next action |
| --- | --- | --- | --- |
| 2026-11-16T09:18:14Z | R-0020/coordinator | Claimed issue #24 on clean main, created isolated branch; scoped no schema changes | Implement approval-gated job and validate |
| 2026-11-16T09:18:14Z | R-0020/coordinator | Found only unprotected `prod` environment and existing repository secret name | Configure protected `production`; never read secret |
| 2026-11-16T09:22:00Z | R-0020/coordinator | Created `production` with Zack required reviewer and no admin bypass; workflow and full local checks green | Commit/push, open PR, wait for CI |
