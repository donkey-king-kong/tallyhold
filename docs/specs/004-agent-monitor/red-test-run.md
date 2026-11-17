# Feature 004 RED run

- Tested test commit: `357e26e875cce5c6febe5b7b2c20d8f0a3afca0c` (round 2 candidate); initial round 1 test commit `f723913c23f78c20d2f87e1b34d662dd4c402a47`.
- Base before RED tests: `0988e8e` (confirmed public test interfaces).
- Runtime: Node 24.19.0, npm 11.17.0; synthetic records and disposable temporary local files only.
- `npm ci` in `extensions/agent-monitor/`: exit 0, 124 locked packages installed, npm audit reported 0 vulnerabilities.
- `npm test -- --reporter=dot --silent` in `extensions/agent-monitor/`: exit 1 as expected; **4 files collected, 38 tests failed, 0 passed, 0 skipped**.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` at the same commit: exit 0, **6 passed, 0 failed, 0 skipped**. This is the existing publisher suite relevant to this independent extension; no existing files were weakened or removed. Backend/frontend suites are unchanged and were not run for this RED handoff.

## Expected failure reasons

- Core (`test/core.test.ts`, 13 cases): the approved `src/core/reconcile` public stream interface does not exist. Each case collects and fails when invoking it; assertions define replay, graph, interval, age and diagnostic behavior.
- Host (`test/host.test.ts`, 15 cases): the approved `src/host/sourceReader` public controller does not exist. Tests use temporary file URLs and boundary-only watcher/read fakes, not mocked internal collaborators or the private worktree log.
- Webview (`test/webview.test.ts`, 6 cases): the approved `src/webview/main` public DOM interface does not exist. Dynamic import occurs inside each case; all six cases collect in jsdom.
- Package (`test/packaging.test.ts`, 4 cases): the test-only manifest lacks the planned `engines.vscode`/command contribution; the host panel and validated message protocol are not implemented.
- No setup, collection, external network, credential, fixture or dependency error remains. A prior local run at `cd0c8c4` had one webview collection error; the Test writer corrected it in `f723913`, reran all new cases and recorded only the final evidence above.

## Criteria and plan verification map

The approved plan's verification map has one item per AC1-AC16; the same row
below maps both the acceptance criterion and that plan verification item to
named tests. Packaged-editor smoke, contrast and measured performance remain
GREEN verification, since no editor implementation exists at RED.

| AC / plan item | RED behavioral evidence |
| --- | --- |
| 1 | `packaging.test.ts`: contributes an explicitly named command; restricted bundled webview; actual VSIX install remains GREEN smoke |
| 2 | `host.test.ts`: switches sources and excludes old activity, missing files, trust-gated worktree discovery, stale selection; path/session state asserted |
| 3 | `core.test.ts`: reconstructs a finished graph without playback; `webview.test.ts`: shows every node |
| 4 | `core.test.ts`: immutable/late-parent coordinates and rejected cyclic edges; `webview.test.ts`: zoom/pan alter rendered SVG and Fit All restores initial camera |
| 5 | `core.test.ts`: failed tool distinct from agent status and interval certainty; `webview.test.ts`: inspector contains two chronological activities, task, status and unavailable age |
| 6 | `core.test.ts`: exact interval boundaries, reactivation, repeated terminal ambiguity and session isolation; `host.test.ts`: replacement changes session generation |
| 7 | `core.test.ts`: default vs active-only nodes; `webview.test.ts`: explicit filter explanation, selected terminal reveal/history |
| 8 | `core.test.ts`: verified age advances without fabricated status; `webview.test.ts`: quiet clock advances and stale reader distinct from agent status |
| 9 | `core.test.ts`: byte-for-byte split equivalence and distinct offsets; `host.test.ts`: unchanged notification, changed-prefix replay and recovery without duplicate history |
| 10 | `core.test.ts`: split UTF-8, partial line, malformed/unsupported/schema/time records, line/offset and out-of-order diagnostics |
| 11 | `host.test.ts`: failure/recovery, truncation, same-size replacement, delayed read race, reopen, prefix change, limit-preserved view and watcher close |
| 12 | `core.test.ts`: missing boundaries and unmatched tools, late parent, immutable child, self/cycle edge rejection and reachability |
| 13 | `core.test.ts`: relative vs verified anchored time; `host.test.ts`: conflicting/malformed/inconsistent session snapshots and heartbeat status cannot overwrite events |
| 14 | `webview.test.ts`: keyboard navigator/search, observable pan/zoom/Fit All, focus on update and age labels; three-theme contrast, narrow editor and reduced-motion smoke remain GREEN |
| 15 | `webview.test.ts`: hostile text not HTML; `host.test.ts`: no publisher write, trust-gated discovery and non-local rejection; `packaging.test.ts`: CSP nonce/local roots and bounded/stale message rejection |
| 16 | `packaging.test.ts`: independent command/API floor; extension coverage, VSIX audit and actual two-editor smoke remain GREEN checks below |

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

Push the test commit and this evidence as separate commits on
`feature/004-agent-monitor`, then use a new independent RED Reviewer against
base `0988e8e` and the pushed evidence head. Do not begin GREEN unless that
Reviewer posts `VERDICT: APPROVE` on the RED head.
