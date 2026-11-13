# Review round 1

## Must-fix

None.

## Should-fix

1. `docs/agents/devops.md:44-56` and
   `docs/agents/test-writer.md:48-50` place "inspect and commit" inside one
   `Shell` pair. Inspection and commit require distinct git operations, while
   the new DevOps contract at `docs/agents/devops.md:62-64` says each distinct
   git or shell invocation gets its own pair, and acceptance criterion 3
   requires each real operation to get its own pair. Split inspection and
   commit into separate `Shell` pairs in both examples so the examples teach
   the required operation-level granularity.

## Nit

None.

## Evidence

- The permitted PR diff preserves the existing milestone events and changes
  only documentation; it introduces no application behavior, schema,
  migration, layering, or security-sensitive implementation.
- The five role files define the required category mapping, failed-operation
  closure, interruption closure, generic labels, and balanced `tool-start` /
  `tool-end` examples.
- `docs/agents/reviewer.md` is unchanged in the permitted PR diff.
- `gh pr checks 12` reports `backend`, `frontend`, and `security` passing.

VERDICT: CHANGES_REQUESTED
