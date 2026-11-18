# PR #46 review, round 1

## Must-fix

None.

## Should-fix

- `.trae/agent-flow/adapter.py:165-184,207-218,238-257`: `ready()` calls `register()` on every start, status, tool, and complete operation. `register()` parses the entire shared JSONL from its first line under the exclusive lock to rediscover a root spawn. As the single persistent stream grows, every event becomes proportional to the full log size, and concurrent worktrees wait for that scan; publishing N events is quadratic in N. Keep registration idempotent under the lock without rescanning all historical records on every publish. Cover repeated publishing against a substantial existing stream.

## Nit

None.

## Evidence

- The diff implements shared-root resolution, namespaced IDs, locked session creation and append, attribution, and updated ship/connection instructions against the approved spec and plan. No application schema or migration change is present.
- `gh pr checks 46`: backend, frontend, and security passed; migration checks skipped.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -q`: 29 tests passed.

VERDICT: CHANGES_REQUESTED
