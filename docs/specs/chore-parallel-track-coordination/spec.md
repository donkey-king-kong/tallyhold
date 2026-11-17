# Parallel track coordinator handoff

## Status

Approved maintenance scope by Zack's 2026-11-17 request. No feature Gate 1,
architecture/schema-plan approval, deployment approval or migration approval
is conferred on any of the three tracks by this documentation change.

Issue: [#33](https://github.com/donkey-king-kong/tallyhold/issues/33).

## Acceptance criteria

1. The roadmap identifies Feature 005 as merged in PR #32, identifies Feature
   006 as the next Phase 2 contract, and records reviewer fallback PR #31 as
   merged without asserting production deployment.
2. A durable coordinator handoff reserves disjoint T/R-0040..0049 for Track A
   (`feature/006-accounts`), 0050..0059 for Track B
   (`feature/004-agent-monitor`), and 0060..0069 for Track C
   (`chore/first-deploy`). The work index excludes those IDs from other work.
3. Track A alone owns Alembic changes until Feature 006 merges; Track C alone
   owns `.github/workflows/ci.yml` and `docker-compose.yml` during this
   coordination period. Each track still follows its own approvals, tickets,
   run recovery, one-tool-per-branch rule, tests, reviews and ship gate.
4. The PR changes documentation only, links this scope and its issue, passes
   applicable checks, and completes independent review and merge gates.

## Boundaries

No feature branch is launched or reassigned by this PR. No placeholder ticket
or run is created inside the reserved blocks. Do not edit the constitution,
feature contracts, application code, migration chain, CI, Compose, production
settings or credentials. Hosting and OAuth deployment remain separate work.
