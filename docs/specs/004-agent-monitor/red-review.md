# Feature 004 RED review, round 1

- Base: `0988e8e`
- Reviewed pushed RED head: `4440606146cc3165afa58d6d71d9514e7d612bf7`
- Scope: approved `spec.md`, `plan.md`, `tasks.md`, cumulative base-to-head diff, `red-test-run.md`, and relevant existing adapter tests.
- Test references below are under `extensions/agent-monitor/test/`. Each AC number also identifies the corresponding numbered row in the plan's verification map.

## Acceptance criteria and plan verification mapping

| AC / plan item | RED test evidence | Uncovered required behavior |
| --- | --- | --- |
| 1 | `packaging.test.ts:6-14` checks manifest command and candidate API floor. | No activation/open-panel or packaged VSIX/editor smoke harness or recorded-version checklist. Actual compatibility is necessarily later GREEN evidence, not established by this RED test. |
| 2 | `host.test.ts:34-47,84-95` checks two file selections, visible state path/session and missing source; `webview.test.ts:63-75` checks a stale banner. | Workspace discovery, arbitrary picker, unreadable permissions and actionable initial UI are untested; the switch test only checks the shared ID `same`, so it would accept an old node surviving if it has that ID. |
| 3 | `core.test.ts:30-42` reconstructs completed child history; `webview.test.ts:42-51` shows terminal and nonterminal nodes. | Failed completed nodes' normal readability and no-playback UI behavior are not asserted. |
| 4 | `core.test.ts:103-116` preserves one coordinate; `webview.test.ts:42-45,77-89` locates camera controls. | No assertions on camera/bounds or initial/explicit Fit All, pan/zoom effects, overflow reachability, stable coordinates for all existing nodes, or deterministic new slots. |
| 5 | `core.test.ts:30-42` checks failed tool outcome and task/status; `webview.test.ts:53-61` selects a node. | Inspector chronology, outcome distinction, published identity/status/age labels and unavailable fields are not actually asserted in the DOM. |
| 6 | `core.test.ts:69-82` checks two intervals/four activities and session mismatch; `host.test.ts:34-47` switches files. | Interval boundaries/current status, repeated completion/post-terminal ambiguity, and same-ID isolation across distinct source generations are not checked. |
| 7 | `core.test.ts:103-116`; `webview.test.ts:42-51` check default and toggled terminal visibility. | Filter explanation that nonterminal is last reported, not liveness, and filtered-selection reveal/history preservation are untested. |
| 8 | `core.test.ts:133-144` checks an unspecified identity kind and open interval; `webview.test.ts:63-75` distinguishes stale reader text. | No advancing clock/age assertion for quiet stream or silent Reviewer, or separate verified versus local-observation age. |
| 9 | `core.test.ts:44-67` checks batch/split equivalence and equal-valued lines at distinct offsets; `host.test.ts:49-63` refreshes after recovery. | Unchanged repeated watcher notification on an existing source, source-order counts, and append continuity are not tested. An empty `ingest` is not a duplicate watcher read. |
| 10 | `core.test.ts:44-55,57-67,118-131,146-160` covers split UTF-8, newline, malformed/unsupported/schema records; `core.test.ts:69-82` covers mismatch. | Nonfinite/negative time, invalid payload/session fields, diagnostic line/offset and out-of-order relative time are untested. |
| 11 | `host.test.ts:49-82,97-121,129-139` covers disappearance, recovery, truncation, replacement, selection and reopen. | No deterministic delayed-read race, changed-prefix append, reload, watcher/timer disposal, stale error/last-success labels, or preserved last valid view at limit breach. |
| 12 | `core.test.ts:84-116` covers orphan, missing spawn, ambiguous tool and cycle diagnostic. | Late parent resolution without movement, self-link rejection, absence of the cyclic edge, reachability, unmatched tool-end certainty and repeated completion are not asserted. |
| 13 | `core.test.ts:118-144` checks relative-only and supplied anchor; `host.test.ts:107-121` checks mismatched session metadata. | Missing/malformed/stale/inconsistent session metadata, heartbeat attribution and refusal to overwrite event state/chronology are untested. |
| 14 | `webview.test.ts:42-89` finds controls and exercises Enter/focus. | Navigator/search, actual camera operation, filtered-selection focus/reveal, three themes/contrast, narrow resize, and reduced motion are untested. Editor visual smoke remains later GREEN evidence. |
| 15 | `host.test.ts:49-63,107-126` checks source/metadata unchanged in two paths and rejects HTTP URI; `webview.test.ts:63-75` checks one hostile text string; `packaging.test.ts:16-27` checks partial CSP text. | No untrusted-workspace discovery rejection, bounded/validated/stale host-webview messages, `localResourceRoots`, nonce script enforcement, remote resource URL injection, or network/no-write observation across all companion paths. |
| 16 | `packaging.test.ts:6-27` checks candidate manifest and partial HTML policy. | No VSIX allowlist audit, extension coverage/lint/type/build checks, representative performance/64 MiB memory fixture, documentation verification, or two-editor installation checklist. These release measurements remain GREEN gates and must be recorded as such. |

## Checklist findings

1. **Criterion and numbered verification coverage: changes requested.** The table maps all 16 rows and explicitly identifies missing behavioral assertions. In particular AC4, AC5, AC8, AC14 and AC15 cannot be verified by the current control-presence and text-only assertions. `webview.test.ts:53-61` contains one activity in its fixture (`:21-28`) and never checks it in the inspector; a UI with no activity list could pass.
2. **Observable plan decisions: changes requested.** Tests exercise some source/session isolation, interval counts, ambiguity, 64 MiB/100k/2k/1 MiB exceedance (`host.test.ts:84-95,141-170`) and a CSP string. They omit source-order/out-of-order diagnostics, finite nonnegative times, prefix-content continuity on changed metadata, late edges and immutable slots, advancing age, session/heartbeat consistency, trust and message rejection, nonce and local roots, and resource disposal. `host.test.ts:97-105` starts two ordinary file reads without controlling their completion order, so it does not force the stale first read to finish last. Limit tests only require `not.toBe("following")` and one diagnostic, not preservation of accepted history or actionable incomplete state.
3. **RED failure validity: none.** I reran `npm test -- --reporter=dot --silent` at the reviewed head: four files collected, 25 failed, zero passed/skipped. Nine core, ten host, four webview and one panel case fail on absent approved extension modules; the manifest case fails because `engines.vscode` is absent. No collection, setup, dependency or network failure appeared. This agrees with `red-test-run.md`.
4. **Behavioral assertions and plausible wrong implementations: changes requested.** `webview.test.ts:77-89` only checks focus and surviving text after Enter; nonfunctional pan/zoom/Fit All controls could pass. `core.test.ts:103-116` checks only `a`'s coordinate and a cycle diagnostic, not whether an invalid edge was accepted. `core.test.ts:69-82` checks interval count but not start/end or current interval semantics. `host.test.ts:34-47` checks a shared agent ID but not absence of old events/history after switch. Add adversarial state assertions through the approved core/host/DOM interfaces.
5. **Infrastructure/privacy of tests: none observed.** Fixtures are synthetic; host tests use disposable `tmpdir()` files and local file URLs (`host.test.ts:15-23,33-170`), core/webview use in-memory records and jsdom, and the HTTP URI is rejected by contract. No real keys, private logs, PostgreSQL dependency, or external network call is present in the test code. The test suite's absence of network activity is not itself proof that future implementation makes none.
6. **Existing suite and cumulative diff: none.** The base-to-head diff adds four extension test files and package/evidence files; it does not modify or delete `.trae/agent-flow/test_adapter.py` or other existing tests. I reran `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`: six passed, zero failed/skipped, agreeing with `red-test-run.md`. Backend/frontend suites were not run, as the evidence states.

The reviewer requests additional RED assertions at the approved public core, host and DOM boundaries, plus a repeatable packaged-editor/release verification checklist for items that cannot execute before GREEN. No spec or plan change is requested.

Round 1 outcome: CHANGES_REQUESTED.

# Feature 004 RED review, round 2

- Base: `0988e8e`
- Reviewed pushed RED head: `db0e9e3b735c774e0b0d56ee0f6d0901e29900ab`
- Scope: the same permitted approved documents, cumulative base-to-head RED diff,
  run evidence and existing adapter tests, plus the preserved round-1 report above.
- References below are under `extensions/agent-monitor/test/`. Each AC also maps
  the identically numbered verification row in the approved plan. Actual VSIX,
  editor compatibility, contrast and measured performance remain GREEN gates.

## Acceptance criteria and plan verification mapping, round 2

| AC / plan item | Cumulative RED evidence | Still uncovered or not decisively asserted |
| --- | --- | --- |
| 1 | `packaging.test.ts:6-14` checks command contribution and API floor; `red-test-run.md` has a two-editor VSIX checklist. | Activation actually opening a panel is not tested; actual recorded-version installations are GREEN. |
| 2 | `host.test.ts:34-54,93-105,236-248` checks source isolation, path/session, missing file and trusted discovery. | Unreadable-permission state and picker interaction are not tested; the initial error's actionable UI copy is not asserted. |
| 3 | `core.test.ts:30-42`; `webview.test.ts:46-55` reconstruct and display terminal identities. | No failed agent fixture is rendered in the DOM at normal readability; no-playback is only implicit. |
| 4 | `core.test.ts:109-124,168-182` checks coordinates/edges; `webview.test.ts:86-109` changes SVG on pan/zoom and resets it with Fit All. | No overflow/bounds assertion for initial Fit All or terminal/unresolved nodes; no camera equality after append/filter, multiple immutable slots or deterministic placement assertion. |
| 5 | `core.test.ts:30-42` checks failed tool outcome and task; `webview.test.ts:57-70` checks two chronological records and unavailable age. | No DOM assertion distinguishes failed tool from success without declaring agent failure; no published-identity/identity-kind label or known last-update age in inspector. |
| 6 | `core.test.ts:69-82,183-197` checks interval boundaries, reactivation and ambiguity; `host.test.ts:34-54,144-155` checks source replacement/isolation. | No assertion on interval labels in the inspector or independent same-ID histories across two simultaneous source controllers. |
| 7 | `core.test.ts:109-124`; `webview.test.ts:46-55,110-121` check default/filter/reveal and explanatory text. | Filtered selection focus retention is not checked. |
| 8 | `core.test.ts:133-144,215-223`; `webview.test.ts:122-137` check unspecified kind, verified age advance and quiet clock. | No assertion that unanchored historical age remains unavailable in the DOM or that locally observed age is separately labelled. |
| 9 | `core.test.ts:44-67`; `host.test.ts:198-215` check split replay, repeated refresh, distinct equal lines and changed-prefix reset. | No actual read counter verifies unchanged notifications avoid reread; full host historical-versus-append equivalence and counts are not asserted. |
| 10 | `core.test.ts:44-67,118-131,146-166,198-213` checks split UTF-8, later valid lines, invalid fields, mismatch, offsets and source order. | No diagnostic asserts its exact line/byte offset, rather than merely integer fields; nonfinite numeric JSON is not exercised. |
| 11 | `host.test.ts:56-92,107-138,144-155,184-215,249-260` checks failure, reopen, truncate, replacement, delayed read, limits and watcher close. | Editor reload, fallback polling, timer/reader disposal and stale last-success display are not checked. |
| 12 | `core.test.ts:84-107,168-197` checks orphan, unmatched tool end, late parent, self/cycle edges and ambiguous completion. | No UI assertion makes unresolved/cyclic identities and uncertain pairing accessible. |
| 13 | `core.test.ts:118-144`; `host.test.ts:126-138,216-234` checks relative time, conflicting/malformed session and heartbeat status. | No stale or chronology-inconsistent *matching* session snapshot, heartbeat attribution, or affirmative display that the observation is provisional. |
| 14 | `webview.test.ts:57-70,86-137` checks keyboard selection, navigator/search, camera controls, reveal and update. | No theme-token/contrast, narrow-panel resize, reduced-motion, non-color status, or focus-after-filter assertion; editor visual smoke is deferred. |
| 15 | `host.test.ts:139-143,216-260`; `webview.test.ts:72-84`; `packaging.test.ts:16-48` checks local URI rejection, trust, text markup, CSP, roots and message rejection. | No hostile resource-URI/nonce interpolation test, companion-path no-write assertion, outbound-request observation, or malformed host-to-webview message validation. |
| 16 | `packaging.test.ts:6-50` checks API/command and policy; `red-test-run.md` lists coverage, VSIX audit, checks, benchmarks and editor smoke. | No executable activation/smoke harness, allowlist assertion, within-envelope or benchmark fixture. Coverage, VSIX inspection and actual smoke are GREEN verification, not RED passes. |

## Prior findings, round 2 disposition

- Round-1 findings 1 and 4: **partially resolved.** Inspector chronology,
  filtered reveal, clock advance and changing SVG now have assertions
  (`webview.test.ts:57-70,86-137`), but a UI that always marks tool outcomes
  successful, changes camera on every update, omits overflow nodes from Fit All
  and ignores theme/responsive rules can still satisfy these tests.
- Round-1 finding 2: **partially resolved.** Exact interval boundaries, invalid
  record fields, changed prefix, late edges, a controlled stale-read race,
  limit-preserved history, trust gating, watcher closure, nonce CSP/local roots
  and stale/oversize message rejection were added (`core.test.ts:69-82,168-223`;
  `host.test.ts:107-124,184-260`; `packaging.test.ts:16-48`). Snapshot
  chronology consistency, viewport stability and the remaining security
  boundary cases in the table are not asserted.
- Round-1 findings 3, 5 and 6: **resolved/unchanged.** The new tests collect
  and fail only for missing approved modules or the missing manifest contribution.
  Synthetic local fixtures and jsdom introduce no secret or external network
  dependency. The cumulative diff does not weaken or remove existing tests.

## Checklist findings, round 2

1. **Criterion and numbered verification coverage: changes requested.** All
   AC1-AC16 and corresponding plan rows map to tests above, but the explicit
   uncovered behaviors in rows 4, 5, 13-15 are material acceptance behavior.
   A release checklist is appropriate for actual editor compatibility and
   measured contrast/performance, but does not replace RED assertions of
   observable DOM/model/host behavior.
2. **Observable plan decisions: changes requested.** No test supplies a
   matching session ID with a valid yet chronology-inconsistent start, so
   absolute dates could overwrite confirmed event chronology
   (`host.test.ts:126-138,216-234`). No camera assertion follows append or
   filter and no multi-node bounds assertion proves Fit All includes terminal
   and unresolved nodes (`webview.test.ts:46-55,86-109`). Hostile URI/nonce
   inputs are not supplied to `renderPanelHtml`, and no assertion covers
   outbound requests or companion writes (`packaging.test.ts:16-30`;
   `host.test.ts:139-143,216-234`). These are approved decisions, not proposed
   spec changes.
3. **RED failure validity: none.** Reran `npm test -- --reporter=dot --silent`
   at `db0e9e3`: four files collected, 38 failed, zero passed or skipped.
   Core/host/webview imports fail for absent planned modules, the manifest
   assertion fails on the absent `engines.vscode`; no collection, setup,
   dependency or network error. This matches `red-test-run.md`.
4. **Behavioral assertions and plausible wrong implementations: changes
   requested.** `webview.test.ts:86-109` compares SVG HTML after manual
   controls but never after `app.update` or filter; an implementation that
   resets the viewport on every event passes. `core.test.ts:30-42` catches
   failed tool projection, while `webview.test.ts:21-29,57-70` has no tool
   outcome fixture, so an inspector that mislabels failure passes. The
   security and snapshot examples in finding 2 likewise permit wrong
   behavior through the approved public interfaces.
5. **Allowed infrastructure/privacy: none observed.** `host.test.ts:15-23`
   creates disposable files under the OS temporary directory; core/webview
   records are synthetic. The rejected HTTP URL is not fetched. No real
   credentials, private runtime log, PostgreSQL dependency or external
   network fixture appears in the cumulative test diff. This does not prove
   the future extension will avoid outbound requests.
6. **Existing tests and cumulative diff: none.** Base-to-head adds the
   extension tests, package files and RED evidence; no existing adapter,
   backend or frontend test is weakened or removed. Reran
   `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`:
   six passed, zero failed/skipped, matching `red-test-run.md`. Backend and
   frontend suites remain unrun and unchanged by the RED diff.

This is the final independent RED review round. The remaining observable
coverage gaps require coordinator/Zack resolution before GREEN; there is no
spec/plan change or unwritable security test claimed here.

VERDICT: CHANGES_REQUESTED
