# Granular Agent Flow role telemetry

## Status

Approved scope by Zack's explicit request on 2026-11-13 to instrument every
real operation in the five non-reviewer role files, then commit, push, and run
the full PR workflow. This is documentation-only maintenance, not a product
feature or application architecture change.

Issue: [#11](https://github.com/donkey-king-kong/tallyhold/issues/11).

## Acceptance criteria

1. Planner, Architect, Test writer, Implementer, and DevOps retain their existing
   milestone events and show balanced tool lifecycle examples around real work.
2. Local reads use `Read`, file changes use `Edit`, checks use `Test`, git and
   CLI commands use `Shell`, and web lookups use `Search`.
3. Each additional real operation gets its own pair; empty pairs are forbidden.
4. Failed and interrupted operations close their matching tool call with a failed
   outcome before another operation starts or the role blocks.
5. Labels remain generic and exclude prompts, file contents, credentials, and
   sensitive data.
6. Reviewer instructions remain unchanged and fresh Reviewers never write
   telemetry.
7. Role examples have balanced tool pairs, links resolve, whitespace checks pass,
   and the existing Agent Flow adapter tests pass.

## Out of scope

Adapter protocol changes, automatic hooks, Reviewer-authored telemetry,
application code, schema changes, and reconstruction of historical events.
