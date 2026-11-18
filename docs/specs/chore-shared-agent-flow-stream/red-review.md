# RED review: shared Agent Flow stream

Round: 1
Base: `c12b954`
Reviewed pushed RED head: `aecc0a985dd503fef5d13a9916344ee4eff3e2b1`

## Coverage mapping

The following tests are in `.trae/agent-flow/test_adapter.py` at the reviewed
head. The numbered plan verification rows correspond to acceptance criteria
with the same numbers.

| Criterion / plan verification | Test evidence |
| --- | --- |
| 1 | `test_shared_default_root_from_main_and_linked_worktrees`, `test_explicit_root_wins`, `test_outside_git_keeps_legacy_root_and_ids` |
| 2 | `test_bare_roles_and_ship_review_rounds_are_isolated`, `test_default_and_explicit_parents_resolve_consistently` |
| 3 | `test_slug_branch_and_detached_head`, `test_normalization_collisions_and_long_names_remain_distinct` |
| 4 | `test_every_payload_has_source_worktree`, `test_explicit_root_wins` |
| 5 | `test_init_reuses_existing_session_without_rewriting`, `test_concurrent_init_creates_exactly_one_session`, `test_orphan_log_is_not_overwritten` |
| 6 | `test_concurrent_process_appends_are_complete_and_unique` |
| 7 | `test_documented_commands_share_one_stream` covers the CLI forms; documentation content and committed-path hygiene are not tested (plan calls for separate review after GREEN). |
| 8 | `test_main_orchestrator_maps_to_wt_main` |
| 9 | `test_prefixed_ids_and_parents_are_idempotent` |
| 10 | `test_reused_init_does_not_reactivate_shared_orchestrator`, `test_status_reactivates_only_namespaced_heartbeat` |

## Six checks

1. **Mapping:** Each numbered criterion/verification row has a named test, but
   row 7's documentation and path-hygiene verification remains uncovered by
   tests and is explicitly deferred in `red-test-run.md`. The plan's direct
   `Store` consistency requirement (Approach), exact slug algorithm
   (Approach 2), and invalid-session rejection (Approach 5) also lack
   assertions; see findings below.
2. **Observable decisions:** The tests exercise the shared root, explicit
   override, non-Git fallback, two-worktree roles, namespaced parents and
   heartbeats, concurrent init, orphan log, and concurrent status writers.
   Changes requested: `test_slug_branch_and_detached_head` only matches a
   stem and eight hex digits; the collision test checks distinct values but
   never computes the specified SHA-256 suffix from the raw branch name or
   canonical detached path, checks the 15-character truncation, or verifies
   stability across runs. A random or wrong-input hash could pass. No test
   exercises ID resolution through direct `Store` calls in a Git checkout,
   although the plan requires CLI and direct calls to behave consistently.
   `test_orphan_log_is_not_overwritten` covers a missing session file, not an
   existing malformed/invalid session alongside a log; the plan requires
   fail-closed behavior without replacing that log. The non-bare common-dir
   shape and symlink resolution decisions are likewise not asserted.
3. **RED validity:** Independently ran the committed test/adapter snapshot
   with `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`:
   23 tests, 16 failures, seven passes, zero errors/skips. Failures are
   missing shared-root/session behavior, missing attribution, and the old
   session-exists error, not collection/dependency/network errors. The
   40-process append test stops during reusable init, so its append assertions
   have not yet been exercised in RED; they remain meaningful downstream.
4. **Behavioral assertions:** The new tests invoke the actual CLI copy in
   disposable linked worktrees, parse events/heartbeats, include invalid
   `bad/id`, orphan-log rejection, normalization collisions, and concurrent
   processes. They reject a simple script-local-root implementation. However,
   the exact-hash and invalid-session omissions in check 2 allow plausible
   wrong implementations to pass. In `test_prefixed_ids_and_parents_are_idempotent`,
   IDs are prefixed after normal initialization; it does not seed an already
   prefixed log root and prove registration deduplication against that
   existing node (plan Approach 4 / verification 9).
5. **Infrastructure:** Fixtures create temporary local Git repositories and
   worktrees; CLI subprocesses use a copied local adapter, and test data uses
   synthetic labels and fixture email. No PostgreSQL, external network,
   real secret, or paid service is required. No infrastructure violation found.
6. **Existing suite:** Cumulative `git diff c12b954 aecc0a985...` changes
   only the test file, plan approval status, and RED run evidence. None of
   the six existing test bodies was weakened or deleted. Independently ran
   all six at the base and the RED head: both pass (six of six).
   `git diff --check c12b954 aecc0a985...` passes.

Add focused assertions for the uncovered observable contracts above, rerun
RED and the existing suite, and preserve the approved spec/plan unchanged.
Documentation verification remains an explicit GREEN delivery review item.

VERDICT: CHANGES_REQUESTED
