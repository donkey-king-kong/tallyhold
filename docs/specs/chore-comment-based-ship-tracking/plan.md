# Comment-based ship tracking plan

## Status and approvals

Zack approved the scope and requested automated shipping on 2026-11-13. This is
a documentation-only workflow change with no schema or application architecture
impact, so no additional plan gate applies.

## Approach

- Keep repository tracking authoritative through the final pre-review commit.
- Freeze ticket, run, and roadmap files after review dispatch.
- Publish later coordinator lifecycle checkpoints in Agent Flow and PR comments.
- Make GitHub comments and current PR state the recovery evidence after dispatch.
- Keep all Reviewer telemetry outside its permitted role inputs.
- Consolidate requested-review report and fix pushes before rerunning CI.
- Preserve historical ship-log records as facts rather than rewriting them.

## Verification

Run whitespace checks, repository Markdown-link validation, Reviewer isolation
checks, and the Agent Flow adapter test suite. The PR then follows full CI,
fresh review, merge-gate inspection, and automated merge.
