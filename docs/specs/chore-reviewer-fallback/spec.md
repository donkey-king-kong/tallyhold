# Independent reviewer fallback

## Status

Zack approved this documentation-only maintenance scope on 2026-11-17.
Issue: [#30](https://github.com/donkey-king-kong/tallyhold/issues/30).
The active Feature 005 branch is separate; Zack explicitly authorized its
first RED review to use the fresh Trae fallback before this PR merges.

## Acceptance criteria

1. Headless Claude Code remains preferred for both RED and PR reviews. If
   `claude` is unavailable, unauthenticated or fails to launch, the coordinator
   automatically starts a new, independent Trae subagent with no prior context.
   Escalate reviewer availability only when neither option can run.
2. Each fallback receives the identical restricted role, evidence and minimal
   identifiers; it writes only the same report and identical commit/PR
   comment. It cannot edit tests, production code, approved documents, tickets,
   runs or telemetry, nor commit, push, merge or implement.
3. A different new reviewer handles each later round. RED keeps its two-round
   limit, ship keeps its three-round limit, and existing finding, approval and
   escalation rules remain unchanged.
4. The coordinator records the actual reviewer type in the ticket/run. A
   failed launch is not a verdict, and the first usable fallback starts the
   same round, not an extra round.
5. This PR changes no active feature files, product behavior, schema or
   constitution. Zack merges the maintenance PR after review.
