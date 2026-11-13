# Granular Agent Flow role telemetry plan

## Status and approvals

Zack directly approved the requirements in [spec](spec.md) and requested the
full ship workflow. No application architecture or schema change requires
additional plan approval.

## Approach

- Preserve each role's existing lifecycle and milestone commands.
- Add category guidance and concrete tool boundaries beside the operation they
  represent, following the existing ship workflow pattern.
- Require one pair per actual operation, truthful failed outcomes, interruption
  closure, and generic metadata.
- Leave `docs/agents/reviewer.md` unchanged so reviewer isolation remains intact.
- Check pair balance, links, whitespace, and the existing adapter test suite.

## Data and migrations

None. The change affects Markdown instructions only. Runtime JSONL and heartbeat
files remain local, ignored evidence and are not committed.

## Publication

Commit the approved maintenance contract and role instructions, link issue #11,
then run the complete ship workflow with a fresh Reviewer and gated merge.
