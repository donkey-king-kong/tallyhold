# Feature 004 RED run

- Tested test commit: `22f149cd9a9519938367cce2a0f4e070e88309c3` (Zack-authorized exceptional round 4 candidate); earlier test commits `f723913`, `357e26e` and `9e9ed7d`.
- Base before RED tests: `0988e8e` (confirmed public test interfaces).
- Runtime: Node 24.19.0, npm 11.17.0; synthetic records and disposable temporary local files only.
- `npm ci` in `extensions/agent-monitor/`: exit 0, 124 locked packages installed, npm audit reported 0 vulnerabilities.
- `npm test -- --reporter=dot --silent` in `extensions/agent-monitor/`: exit 1 as expected; **4 files collected, 56 tests failed, 0 passed, 0 skipped**.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` at the same commit: exit 0, **6 passed, 0 failed, 0 skipped**. This is the existing publisher suite relevant to this independent extension; no existing files were weakened or removed. Backend/frontend suites are unchanged and were not run for this RED handoff.

## Expected failure reasons

- Core (`test/core.test.ts`, 15 cases): the approved `src/core/reconcile` public stream interface does not exist. Each case collects and fails when invoking it; assertions define replay, graph, interval, age and diagnostic behavior.
- Host (`test/host.test.ts`, 21 cases): the approved `src/host/sourceReader` public controller does not exist. Tests use temporary file URLs and boundary-only watcher/read/timer fakes, not mocked internal collaborators or the private worktree log.
- Webview (`test/webview.test.ts`, 13 cases): the approved `src/webview/main` public DOM interface does not exist. Dynamic import occurs inside each case; all thirteen cases collect in jsdom.
- Package (`test/packaging.test.ts`, 7 cases): the test-only manifest lacks the planned `engines.vscode`/command contribution; the host panel, validated message protocol and packaged-file policy are not implemented.
- No setup, collection, external network, credential, fixture or dependency error remains. A prior local run at `cd0c8c4` had one webview collection error; the Test writer corrected it in `f723913`, reran all new cases and recorded only the final evidence above.

## Criteria and plan verification map

The approved plan's verification map has one item per AC1-AC16; the same row
below maps both the acceptance criterion and that plan verification item to
named tests. Packaged-editor smoke, contrast and measured performance remain
GREEN verification, since no editor implementation exists at RED.

| AC / plan item | RED behavioral evidence |
| --- | --- |
| 1 | `packaging.test.ts`: contributes an explicitly named command; restricted bundled webview; actual VSIX install remains GREEN smoke |
| 2 | `host.test.ts`: switches sources and excludes old activity, missing files, trust-gated discovery/no automatic read, stale selection; `webview.test.ts`: actionable initial error with path |
| 3 | `core.test.ts`: reconstructs a finished graph without playback; `webview.test.ts`: completed and failed histories visible immediately |
| 4 | `core.test.ts`: deterministic collision-free slots, immutable/late-parent coordinates and rejected cyclic edges; `webview.test.ts`: Fit All bounds include terminal/unresolved overflow, camera unchanged on append/filter |
| 5 | `core.test.ts`: failed tool distinct from agent status and interval certainty; `webview.test.ts`: chronological inspector, contrasting success/failure independent of summaries without claiming agent failure, identity kind and age |
| 6 | `core.test.ts`: exact interval boundaries, reactivation, repeated terminal ambiguity and session isolation; `host.test.ts`: replacement changes session generation |
| 7 | `core.test.ts`: default vs active-only nodes; `webview.test.ts`: explicit filter explanation, selected terminal reveal/history |
| 8 | `core.test.ts`: verified age advances without fabricated status; `webview.test.ts`: quiet clock advances, unanchored age unavailable, locally observed age labelled separately and stale reader distinct from agent status |
| 9 | `core.test.ts`: byte-for-byte split equivalence and distinct offsets; `host.test.ts`: unchanged read counter, changed-prefix replay and historical-vs-append node equality |
| 10 | `core.test.ts`: split UTF-8, partial line, malformed/unsupported/schema/nonfinite-time records, exact line/byte offset and out-of-order diagnostics |
| 11 | `host.test.ts`: failure/recovery, truncation, same-size replacement, delayed read race, reopen, prefix change, limit-preserved view and watcher/timer disposal |
| 12 | `core.test.ts`: missing boundaries and unmatched tools, late parent, immutable child, self/cycle edge rejection and reachability; `webview.test.ts`: incomplete interval and ambiguous pairing labels |
| 13 | `core.test.ts`: relative vs verified anchored time; `host.test.ts`: conflicting/malformed snapshots, matching future-start chronology rejection, provisional heartbeat and unchanged companions |
| 14 | `webview.test.ts`: keyboard navigator/search, pan/zoom/Fit All, filter focus/reveal, non-color labels and history/focus access after narrow resize; actual themed contrast/layout and CSS reduced motion remain GREEN |
| 15 | `webview.test.ts`: hostile text not HTML; `host.test.ts`: companion no-write, fetch spy, untrusted source auto-read rejection and non-local rejection; `packaging.test.ts`: CSP, hostile URI/nonce and bidirectional message rejection |
| 16 | `packaging.test.ts`: independent command/API floor and private-file exclusions; within-envelope 2k identities in `host.test.ts`; coverage, VSIX audit, benchmark and actual two-editor smoke remain GREEN checks below |

## Round 1 findings addressed

Round 1 [`red-review.md`](red-review.md) and its identical commit comment
requested stronger behavior assertions. The new `357e26e` test commit adds
actual camera SVG changes and reset, chronological inspector records,
filtered-node reveal, advancing age, exact interval boundaries, late-parent
edge/position and self/cycle rejection, same-ID old-history exclusion,
unchanged and changed-prefix refresh, invalid time/schema/offset diagnostics,
deterministically delayed first read, preserved view on limit breach,
malformed/advisory metadata, trust-gated discovery, watcher disposal,
validated messages, CSP nonce and local roots. No production code or
existing test was changed. Fixture-only `readBytes` and `watchSource` options
replace OS boundaries, not internal classes.

## Exceptional round 3 corrections

Zack authorized targeted RED corrections and exactly one additional fresh
independent review after round 2 `CHANGES_REQUESTED`; this is not a RED gate
waiver. Test commit `9e9ed7d` adds 14 cases through the confirmed public
interfaces, responding to the [round 2 findings](red-review.md):

- AC3-AC5, AC14: DOM assertions now include a failed completed history without
  playback, numeric Fit All bounds over terminal and unresolved nodes, unchanged
  camera after append/filter, a failed tool distinct from agent failure,
  identity-kind/age labels, focus retention, non-color labels, and narrow
  reduced-motion accessibility. Core checks deterministic non-overlapping slots.
- AC9-AC11, AC13: exact diagnostic line/byte offsets and nonfinite time,
  matching but future session-start rejection, provisional heartbeat,
  companion-file immutability, unchanged-read counter, historical/append
  equivalence, timer disposal and acceptance of the 2,000-identity boundary.
- AC15-AC16: a fetch spy on local and rejected remote selection, hostile
  resource URI/nonce inputs, malformed host-to-webview messages and package
  exclusions. No production module, existing test or publisher was changed.

The command, picker, reload, actual installed-editor versions, measured
three-theme contrast, full VSIX audit, coverage and performance still require
GREEN integration and release checks; the RED assertions do not claim these
have passed. At that handoff no fourth independent RED round was authorized;
Zack later authorized the targeted round below after round 3 requested changes.

## Exceptional round 4 corrections

Zack authorized one more targeted correction and fresh independent review after
round 3 `CHANGES_REQUESTED`; this remains an approval gate, not a waiver. Test
commit `22f149c` adds four public-seam cases and strengthens the failed-tool
case:

- AC2 and AC15: the host now must make zero automatic reads in an untrusted
  workspace until explicit file selection, and the webview must show the
  selected path plus actionable error guidance without a false connected state.
- AC5: two neutral tool summaries with contrasting outcomes require distinct
  success/failure labels, independently of summary text, while the completed
  agent remains completed.
- AC6, AC8 and AC12: the inspector must label incomplete interval certainty,
  ambiguous tool pairing and locally observed age separately from verified
  last-report wall age.
- AC14: after a narrow resize, keyboard selection, filtered-node reveal,
  activity history, Fit All focus and selected history must remain accessible.

Actual CSS contrast, responsive geometry, reduced-motion styling, packaged
editor behavior and package contents remain the explicit GREEN checks below.
No production code, publisher code or existing test was changed. No fifth
independent RED round is authorized.

## Repeatable GREEN release checklist (pending, not RED passes)

1. From `extensions/agent-monitor/`: `npm ci`, `npm run lint`,
   `npm run format:check`, `npm run typecheck`, `npm test`,
   `npm run test:coverage` (>=80% extension coverage), `npm run build`,
   `npm audit --audit-level=high`, `npm run package`; record every exit
   status and coverage summary in `docs/verification.md`.
2. Run `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v`
   from the worktree root. Inspect the VSIX with `unzip -l <vsix>` and
   confirm only bundled extension files, manifest, license and README;
   no `.agent-flow`, fixtures, `.env`, credentials or test dependencies.
3. Record actual local VS Code and Trae versions (Help > About) and
   install the **same** VSIX in each. If either editor is unavailable or
   refuses the API floor, record `unverified`/`failed`, never `passed`.
   Open **Tallyhold Agent Monitor: Open** from the Command Palette, choose
   a synthetic worktree stream, then a second source with the same agent
   name and another session. Verify path/session isolation, complete
   history, live append, truncation/replacement, read error/recovery,
   reactivation, filter/reveal, camera stability and Fit All. Inspect
   keyboard-only navigator/inspector, focus, light/dark/high-contrast
   contrast and non-color labels, narrow panel layout and reduced motion.
4. Generate synthetic 10 MiB/20k-record/500-identity and
   64 MiB/100k-record/2k-identity streams with the extension's planned
   fixture/benchmark command, without using private logs. Record hardware,
   cold replay, 200-record append latency, interaction time and memory
   against the approved targets and envelope. Any missing measurement,
   unacceptable workload or unsupported editor returns to Zack before ship.

## Handoff

Push test commit `22f149c` and this evidence as separate commits on
`feature/004-agent-monitor`, then send base `0988e8e` and the verified pushed
evidence head to a different fresh independent RED Reviewer for Zack's
exceptional fourth round. The reviewer reads the prior report and cumulative
RED diff. Do not begin GREEN unless that Reviewer posts `VERDICT: APPROVE`
on the reviewed head; any non-approval returns to Zack.
