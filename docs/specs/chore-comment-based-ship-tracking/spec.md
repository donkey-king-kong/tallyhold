# Comment-based ship tracking

## Status

Approved by Zack's explicit request on 2026-11-13 to stop creating lifecycle-only
branches, keep post-dispatch evidence in comments, create the PR, and auto-merge
after every ship gate passes.

Issue: [#13](https://github.com/donkey-king-kong/tallyhold/issues/13).

## Acceptance criteria

1. Future ship runs create no branch or worktree solely for post-dispatch
   lifecycle tracking.
2. The final repository checkpoint is pushed before fresh review; later review,
   CI, fix, gate, and merge checkpoints use Agent Flow and factual PR comments.
3. Recovery inspects current GitHub PR state and comments before repeating an
   external operation.
4. Agent Flow labels isolated Reviewer waiting as review work after coordinator
   CI without inventing internal Reviewer events.
5. Fresh Reviewer inputs contain no telemetry instructions.
6. A requested-review report and its fixes are sent in one push so CI runs once
   for the new head.
7. Documentation links, whitespace, and Agent Flow adapter tests pass.

## Out of scope

Application behavior, CI job contents, Reviewer permissions, historical record
rewrites, schema changes, and constitution changes.
