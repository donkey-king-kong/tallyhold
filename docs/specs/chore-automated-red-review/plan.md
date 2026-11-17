# Automated RED review plan

## Approval

Zack approved this maintenance process on 2026-11-17. No schema or
application architecture change is involved.

## Approach

- `docs/skills/red-review.md` owns the handoff, fresh Claude invocation,
  two-round loop, comment, evidence and escalation rules.
- `docs/agents/red-reviewer.md` is the sole restricted instruction handoff.
  Its GitHub commit comment ties the verdict to the reviewed SHA before a PR.
- The Test writer commits tests, runs checks, commits sanitized
  `red-test-run.md` evidence and pushes both commits. The coordinator records
  review dispatch/results; it commits the report after the reviewer exits.
- Point the workflow, TDD, roles and ship scope check to the gate; keep the
  normal PR reviewer independent of the RED reviewer.
- Update the product process summary, agent entrypoint and work index.

## Verification

1. Every acceptance criterion and escalation is represented in the procedure
   and restricted reviewer checklist.
2. The dispatch command has fresh context, permitted inputs, report-only
   output and an identical comment on the pinned RED SHA.
3. Handoff sequencing requires pushed test evidence, review approval before
   GREEN and a separate later ship review.
4. Links, Markdown whitespace and existing documentation checks pass.
5. The PR changes no Feature 005 files or roadmap entry.

No database migration or application tests are required for this documentation
change.
