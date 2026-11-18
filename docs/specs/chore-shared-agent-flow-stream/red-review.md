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

Round 1 verdict: `CHANGES_REQUESTED`

## Round 2

Base: `c12b954`
Reviewed pushed RED head: `91bcc4b1fe051abe6a80925b0ab55ba3ce668ec2`

### Coverage mapping

All tests below are in `.trae/agent-flow/test_adapter.py`. Criterion numbers
also identify the numbered plan verification rows.

| Criterion / plan verification | Test evidence |
| --- | --- |
| 1 | `test_shared_default_root_from_main_and_linked_worktrees`, `test_explicit_root_wins`, `test_outside_git_keeps_legacy_root_and_ids`, `test_symlinked_checkout_resolves_canonical_shared_root`, `test_separate_git_dir_does_not_select_unrelated_root` |
| 2 | `test_bare_roles_and_ship_review_rounds_are_isolated`, `test_default_and_explicit_parents_resolve_consistently`, `test_direct_store_calls_in_checkout_match_cli_ids` |
| 3 | `test_slug_branch_and_detached_head`, `test_normalization_collisions_and_long_names_remain_distinct` |
| 4 | `test_every_payload_has_source_worktree`, `test_explicit_root_wins` |
| 5 | `test_init_reuses_existing_session_without_rewriting`, `test_concurrent_init_creates_exactly_one_session`, `test_orphan_log_is_not_overwritten`, `test_invalid_existing_session_and_log_fail_closed` |
| 6 | `test_concurrent_process_appends_are_complete_and_unique` |
| 7 | `test_documented_commands_share_one_stream` exercises CLI forms; documentation content and committed-path hygiene remain delivery review items after GREEN. |
| 8 | `test_main_orchestrator_maps_to_wt_main` |
| 9 | `test_prefixed_ids_and_parents_are_idempotent`, `test_existing_hand_prefixed_root_is_not_registered_twice` |
| 10 | `test_reused_init_does_not_reactivate_shared_orchestrator`, `test_status_reactivates_only_namespaced_heartbeat` |

### Round 1 findings

- Exact slug algorithm, truncation and repeatability: addressed for branch and
  detached slugs by the SHA-256 expectations in
  `test_slug_branch_and_detached_head` and
  `test_normalization_collisions_and_long_names_remain_distinct` (lines
  244-285). The long *agent ID* hash decision remains uncovered below.
- Direct `Store` consistency: addressed by
  `test_direct_store_calls_in_checkout_match_cli_ids` (lines 387-420).
- Invalid existing session plus log: addressed by
  `test_invalid_existing_session_and_log_fail_closed` (lines 371-385).
- Symlink/common-dir shape: addressed by
  `test_symlinked_checkout_resolves_canonical_shared_root` and
  `test_separate_git_dir_does_not_select_unrelated_root` (lines 422-444).
- Previously prefixed root deduplication: addressed by
  `test_existing_hand_prefixed_root_is_not_registered_twice` (lines 446-476).

### Six checks

1. **Mapping:** Every numbered acceptance criterion and plan verification row
   has a test named above. Row 7's documentation text and path-hygiene review
   are explicitly deferred until delivery, as the approved plan requires.
   The plan's Approach 3 exact long-agent-ID hash and input-parent validation
   decisions have no discriminating assertions (see check 2).
2. **Observable decisions:** The new cases now pin raw-branch and canonical
   detached-path slug hashes, direct Store mapping, invalid-session rejection,
   common-dir shape, and prior root registration. However,
   `test_normalization_collisions_and_long_names_remain_distinct` (lines
   271, 287-296) only checks long agent IDs for syntax, length and uniqueness
   across *different root prefixes*. A plausible implementation that simply
   truncates the agent ID without its specified eight-character SHA-256 suffix
   passes. The only invalid ID submitted is an agent `bad/id`; no invalid
   parent ID is rejected by a test. These leave Approach 3's observable
   namespace algorithm and validation incompletely specified.
3. **RED validity:** Independently ran the full suite against code identical
   to the pinned head: 28 tests, 21 FAIL, seven PASS, zero ERROR/skips. Failures
   arise from the unchanged adapter's script-local root, session reuse,
   missing attribution and fail-closed behavior. The concurrent append test
   stops at shared init; its complete-line assertions remain downstream.
   There were no collection, dependency, setup or external-network errors.
4. **Behavioral assertions:** The tests run real CLI subprocesses in
   disposable Git worktrees and check parsed events. But
   `test_default_and_explicit_parents_resolve_consistently` (lines 240-242)
   uses `assertIn` to compare an entire expected `subagent_return` payload
   dict lacking `sourceWorktree`. Criterion 4 requires `sourceWorktree` on
   **every** payload, so a correct implementation necessarily makes that
   assertion fail. Check the relevant fields individually or include the
   expected slug. This is a test defect, not missing production behavior.
5. **Infrastructure:** Temporary local Git repositories, copied adapter,
   offline processes and synthetic labels are used; no PostgreSQL, external
   network, secret or paid provider is involved. No violation found.
6. **Existing suite:** The cumulative diff preserves all six old test bodies
   and does not change `adapter.py`. Independently ran the six legacy tests:
   six PASS. `git diff --check c12b954 91bcc4b1...` passes. The checkout
   HEAD was later than the reviewed SHA, but read-only comparisons confirmed
   both adapter and test file, including unstaged content, exactly matched
   the pinned RED head before the test runs.

Correct the contradictory payload assertion and cover the long-agent-ID
suffix and invalid parent rejection. Round 2 is the final RED review round;
escalate the gate outcome to Zack rather than beginning GREEN on this report.

VERDICT: CHANGES_REQUESTED
