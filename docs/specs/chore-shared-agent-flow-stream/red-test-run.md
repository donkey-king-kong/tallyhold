# Shared Agent Flow stream RED run

- Approved contract: [spec](spec.md) and [plan](plan.md); Zack approved the
  plan on 2026-11-18 at `c12b954`.
- Base before RED: `c12b954`. Results below were observed with only the plan
  status and `.trae/agent-flow/test_adapter.py` changed in the working tree;
  this evidence is committed with those tests.
- Runtime: macOS `python3` (3.9), stdlib `unittest`. Each new test creates a
  temporary synthetic Git main checkout and linked worktrees. CLI subprocesses
  invoke a byte-for-byte copy of the unchanged adapter in that disposable
  fixture so its old script-relative root cannot read or write the developer's
  ignored `.agent-flow/` stream. No network, live service, secrets, or personal
  fixture paths are used.

## Commands and outcome

| Command (worktree root) | Exit | Observed |
| --- | --- | --- |
| `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` | 1 (expected RED) | 23 collected: 16 new behavioral FAIL, 7 PASS (six pre-existing plus one new outside-Git compatibility case), zero ERROR, zero skipped. |
| `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v -k AdapterTests` | 0 | All six pre-existing adapter tests pass unchanged. |
| `git diff --check` | 0 | No whitespace errors in the RED diff before evidence was added. |

The pre-change baseline also ran the full suite at `c12b954`: six passed.
Earlier local RED attempts exposed an occupied script-relative session,
macOS `/var` versus `/private/var` aliases, and a Python 3.9 type-annotation
collection error. The fixture and annotation were corrected; the final run
above has **no import, syntax, fixture setup, or collection errors**.

## Expected failure reasons

- The adapter still defaults to the copied script's local root, not the Git
  common-dir main checkout. Tests for shared events/session/heartbeats fail
  on the missing shared root, or a second `init` returns the current
  `session already exists` error instead of reusing the shared session.
- Explicit `--root` already selects the requested directory, but its
  initialization payload lacks `sourceWorktree`; that case fails on the
  missing attribution field.
- An orphan log placed at the intended shared root is not seen by the old
  script-relative default, so init incorrectly succeeds.
- The multiprocess append case first requires shared, reusable init; it
  fails there in RED. The complete-line/exactly-once assertions will execute
  after the shared-root and init behavior is implemented. Do not infer that
  concurrent appends were verified by this RED failure.
- The outside-Git case passes because preserving the existing script-relative
  root and bare IDs is an explicit part of criterion 1, not missing behavior.

## Criteria and plan verification

All named cases below live in `.trae/agent-flow/test_adapter.py`. The plan's
Verification table has the same criterion numbers.

| Criterion / plan item | RED tests and observable contract |
| --- | --- |
| 1 | `test_shared_default_root_from_main_and_linked_worktrees` includes nested invocation; `test_explicit_root_wins` checks override plus checkout attribution; `test_outside_git_keeps_legacy_root_and_ids` checks compatibility. |
| 2 | `test_bare_roles_and_ship_review_rounds_are_isolated` checks one root per worktree, namespaced dispatch/spawn/status/tool/return/complete and heartbeats; `test_default_and_explicit_parents_resolve_consistently` checks both parent forms. |
| 3 | `test_slug_branch_and_detached_head` checks branch and detached-directory names; `test_normalization_collisions_and_long_names_remain_distinct` checks normalized spelling collisions, truncated long names, 64-character IDs, stability and invalid input. |
| 4 | `test_every_payload_has_source_worktree` checks initialization, registration and two identical bare role IDs with different source slugs; the explicit-root case also checks the first init payload. |
| 5 | `test_init_reuses_existing_session_without_rewriting`, `test_concurrent_init_creates_exactly_one_session` (two real processes), `test_orphan_log_is_not_overwritten` check session reuse, one shared ID/spawn and preservation. |
| 6 | `test_concurrent_process_appends_are_complete_and_unique` launches 40 real CLI processes with unique generic labels; it requires one complete JSON line and one event per label. Its downstream assertions await init GREEN. |
| 7 | `test_documented_commands_share_one_stream` uses bare ship/role command forms and verifies a single shared stream and session. Documentation wording and path hygiene require later review; this RED run makes no claim that docs have changed. |
| 8 | `test_main_orchestrator_maps_to_wt_main` checks root registration and start/status/tool/complete on `wt-main`, without touching the shared orchestrator after init. |
| 9 | `test_prefixed_ids_and_parents_are_idempotent` passes manually prefixed roots and agents from two worktrees and checks no double prefix or duplicate root registration. |
| 10 | `test_reused_init_does_not_reactivate_shared_orchestrator` checks unchanged shared heartbeat and no new shared spawn/status; `test_status_reactivates_only_namespaced_heartbeat` checks reactivation through the worktree heartbeat and parent. |

## Handoff

Commit and push the test, approved status and this evidence on
`chore/shared-agent-flow-stream`. A fresh independent RED Reviewer must verify
the pushed head before any GREEN implementation. No adapter or other workflow
documentation was changed, and no PR was opened.

## Round 1 corrections (2026-11-18)

- Tested test commit: `3c1dd8106abd754c983faf365c1c7d0a994f58e8`.
  Base for cumulative round-2 review remains `c12b954`; adapter, spec and
  plan are unchanged. Test fixture uses only disposable local Git repos and
  offline Python processes.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`:
  exit 1, 28 collected, 21 FAIL, seven PASS, zero ERROR or skipped. Failures
  are the missing shared root/session, attribution, ID namespace, or
  fail-closed behavior; no syntax, collection, dependency or network error.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v -k AdapterTests`:
  exit 0, all six legacy tests PASS unchanged.
- `git diff --check`: exit 0.

The five added cases extend numbered verification items 1, 2, 3, 5 and 9:
`test_direct_store_calls_in_checkout_match_cli_ids` checks the planned
Store/CLI boundary across start, status, tool and complete (1-2);
`test_invalid_existing_session_and_log_fail_closed` checks malformed JSON,
missing fields and invalid types without changing either file (5);
`test_symlinked_checkout_resolves_canonical_shared_root` and
`test_separate_git_dir_does_not_select_unrelated_root` check symlinks and
unsupported common-dir layout (1);
`test_existing_hand_prefixed_root_is_not_registered_twice` seeds a prior
dispatch/spawn and asserts one registration remains after activity (9).
Strengthened `test_slug_branch_and_detached_head` computes the eight SHA-256
hex characters from raw branch and canonical detached path, then checks
stability; `test_normalization_collisions_and_long_names_remain_distinct`
computes every 15-character stem and exact hash, length 24, uniqueness and
stability (3). Criteria 4, 6-8 and 10 retain their round-1 mappings above;
documentation text/path hygiene remain GREEN delivery review items.

The full-suite failures arise because the current adapter still uses the
script-relative stream in Git checkouts; invalid-session and shape cases
incorrectly succeed, while direct Store reads the wrong session. The seeded
root case cannot publish into the shared root yet. Concurrent append
assertions remain downstream of shared init and will be exercised at GREEN.
Hand off this committed evidence with the test commit for a different fresh
round-2 review before implementation.

## Zack-authorized targeted round 3 (2026-11-18)

- Zack authorized one extra RED correction/review after round 2, limited to
  the three test findings. Approved spec and plan remain unchanged. Base for
  cumulative review: `c12b954`. Tested test commit:
  `7fed3f16f4056fd009700d3f7011e969f52a386b`
  (the requested test commit `0f3b936` followed by a focused fixture repair).
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`:
  exit 1 (expected RED), 29 collected, 22 FAIL, seven PASS, zero ERROR/skipped.
  Failure causes: the unchanged adapter lacks the common Git stream,
  namespaced IDs and source attribution, reusable session, fail-closed
  handling and write-before-rejection protection. In particular the new
  invalid-parent case fails because `complete` creates a heartbeat before
  rejecting `bad/id`. The long-ID expectation runs after shared init becomes
  available; it asserts the exact original-agent SHA-256 suffix. No
  collection, syntax, network, dependency or fixture errors remain.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v -k AdapterTests`:
  exit 0, all six existing tests pass without edits.
- `git diff --check`: exit 0.

The targeted corrections map to criteria/numbered plan verification items
2-4. `test_default_and_explicit_parents_resolve_consistently` now includes
the expected `sourceWorktree` in the complete return payload (2, 4).
`test_normalization_collisions_and_long_names_remain_distinct` computes
the exact 64-character resolved ID, retaining available leading agent
characters and the first eight hex of SHA-256 of the original bare agent
ID (3). `test_invalid_parent_is_rejected_without_partial_writes` covers
both `start` and `complete`, requiring failed commands to leave log and
heartbeat unchanged; it uses an explicit root so its RED failure isolates
the validation order from unimplemented shared-root discovery (2, 3).
Every other criterion and numbered verification row retains its mapping
above. Concurrent appends are still gated by shared init until GREEN.

An initial local run of `0f3b936` showed a fixture error in the invalid-parent
case because the old script-local adapter had not created a shared log.
The separate `7fed3f1` test commit corrected the fixture using the supported
explicit-root CLI option. Only the final, error-free run at `7fed3f1` is
handoff evidence.
