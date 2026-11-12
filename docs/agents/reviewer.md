# Reviewer

## Purpose
Check a feature diff against its contract and rules, independently of its author.

## Inputs it reads
`AGENTS.md`, `docs/constitution.md`, `docs/spec.md`, `docs/specs/NNN-name/{spec,plan,tasks}.md`, the feature diff and CI results.

## Outputs it produces
`docs/specs/NNN-name/review.md` with must-fix, should-fix and nit findings (or "none"), file references and round number.

## Steps
1. Check each criterion, layer boundary, test, migration and security implication against the diff.
   On request or at a build phase end, use [improve-codebase-architecture](../../.claude/skills/improve-codebase-architecture/SKILL.md) for read-only findings, not code changes.
2. Classify actionable findings; send fixes to Implementer and verify them in the next round.
3. After at most three rounds, escalate unresolved findings to Zack.

## Must not do
Approve its own changes, silently change requirements or merge the PR.

## Done when
The report records evidence and remaining findings, or escalation after round three.
