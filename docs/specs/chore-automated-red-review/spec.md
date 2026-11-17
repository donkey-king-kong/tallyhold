# Automated RED review

## Status

Approved maintenance scope by Zack's explicit request on 2026-11-17.
Documentation-only workflow change; no application schema or architecture
change. Issue: [#28](https://github.com/donkey-king-kong/tallyhold/issues/28).
Applies to future features; the active Feature 005 branch is out of scope.

## Acceptance criteria

1. A committed and pushed RED handoff triggers a fresh, independent headless
   Claude Code review before GREEN.
2. The reviewer sees the approved spec, plan, tasks, cumulative RED diff and
   recorded RED test output (counts and failure reasons), not writer or
   implementer conversation.
3. Each review maps all acceptance criteria, numbered plan verification
   items and observable plan decisions to tests; checks real/adversarial
   assertions, genuine missing-behavior failures, allowed offline/local
   infrastructure and an unweakened, passing existing suite.
4. The reviewer posts `APPROVE` or `CHANGES_REQUESTED` with specific findings
   as a commit/branch comment; the coordinator records verdict and evidence in
   the ticket/run.
5. A Test writer fix is a new commit and a new reviewer round; at most two
   rounds. Escalate to Zack and stop for unresolved findings, spec/plan changes,
   plan disagreement or an unwritable planned security test.
6. Approval starts GREEN automatically; normal ship review follows. Zack
   retains Gate 1, architecture/schema plans, production migrations,
   constitution-changing merges and RED escalations.

## Out of scope

Feature 005 files, its worktree and roadmap entry; application code, CI and
changes to `docs/constitution.md`.
