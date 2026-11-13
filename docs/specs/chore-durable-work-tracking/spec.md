# Durable work tracking maintenance

## Status

Approved scope by Zack's explicit request to set up the proposed repo-local
tracking and session instructions on 2026-11-13, followed by his request to
commit, push, and create the PR. This records that documentation-only maintenance
request, following the existing maintenance-spec convention; it is not a new
product feature or a claim of a separate approval ceremony.

Issue: [#5](https://github.com/donkey-king-kong/tallyhold/issues/5).

## Acceptance criteria

1. A new session can reach the roadmap, relevant ticket, run roster, and linked
   feature plans from the shared agent entrypoint.
2. Tickets record scope, authorization, owner role and actor identity,
   dependencies, evidence, append-only history, and an exact next action.
3. Run records distinguish coordinator work, real subagent dispatches, failures,
   and role switches. Unknown identities and reconstructed history are explicit.
4. All five non-reviewer roles have mandatory recovery/checkpoint instructions;
   fresh Reviewer inputs remain unchanged, with tracking owned by the coordinator.
5. Recovery accounts for dirty worktrees, stale ownership, unverified operations,
   existing PR actions, review snapshots, and local versus pushed checkpoints.
6. Local Markdown references resolve, instruction pointers are checked, and
   documentation scenarios cover recovery and review isolation.

## Out of scope

Application code, schema, CI changes, external boards, replacing required GitHub
issues, automatic transcript capture, and changes to constitution or merge gates.
