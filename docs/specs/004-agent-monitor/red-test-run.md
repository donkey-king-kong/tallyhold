# Feature 004 RED run

- Tested test commit: `f723913c23f78c20d2f87e1b34d662dd4c402a47`
- Base before RED tests: `0988e8e` (confirmed public test interfaces).
- Runtime: Node 24.19.0, npm 11.17.0; synthetic records and disposable temporary local files only.
- `npm ci` in `extensions/agent-monitor/`: exit 0, 124 locked packages installed, npm audit reported 0 vulnerabilities.
- `npm test -- --reporter=dot --silent` in `extensions/agent-monitor/`: exit 1 as expected; **4 files collected, 25 tests failed, 0 passed, 0 skipped**.
- `python3 -m unittest discover -s .trae/agent-flow -p 'test_*.py' -v` at the same commit: exit 0, **6 passed, 0 failed, 0 skipped**. This is the existing publisher suite relevant to this independent extension; no existing files were weakened or removed. Backend/frontend suites are unchanged and were not run for this RED handoff.

## Expected failure reasons

- Core (`test/core.test.ts`, 9 cases): the approved `src/core/reconcile` public stream interface does not exist. Each case collects and fails when invoking it; assertions define the subsequent replay, graph and diagnostic behavior.
- Host (`test/host.test.ts`, 10 cases): the approved `src/host/sourceReader` public controller does not exist. Tests use temporary file URLs, not mocked internal collaborators or the private worktree log.
- Webview (`test/webview.test.ts`, 4 cases): the approved `src/webview/main` public DOM interface does not exist. Dynamic import occurs inside the case; all four cases collect in jsdom.
- Package (`test/packaging.test.ts`, 2 cases): the extension test-only manifest lacks the planned `engines.vscode`/command contribution, and the approved host panel HTML interface is not implemented.
- No setup, collection, external network, credential, fixture or dependency error remains. A prior local run at `cd0c8c4` had one webview collection error; the Test writer corrected it in `f723913`, reran all new cases and recorded only the final evidence above.

## Criteria and plan verification map

The approved plan's verification map has one item per AC1-AC16; the same row
below maps both the acceptance criterion and that plan verification item to
named tests. Packaged-editor smoke, contrast and measured performance remain
GREEN verification, since no editor implementation exists at RED.

| AC / plan item | RED behavioral evidence |
| --- | --- |
| 1 | `packaging.test.ts`: contributes an explicitly named command; restricted bundled webview; actual VSIX install remains GREEN smoke |
| 2 | `host.test.ts`: switches between worktrees, missing files, stale selection; path/session state asserted |
| 3 | `core.test.ts`: reconstructs a finished graph without playback; `webview.test.ts`: shows every node |
| 4 | `core.test.ts`: keeps coordinates on append/status/filter; `webview.test.ts`: reachable Fit All and keyboard zoom/pan |
| 5 | `core.test.ts`: failed tool outcome, incomplete intervals; `webview.test.ts`: selects completed node and chronological inspector |
| 6 | `core.test.ts`: retains completed intervals on reactivation, isolates sessions |
| 7 | `core.test.ts`: default vs active-only nodes; `webview.test.ts`: explicitly filters and restores terminal node |
| 8 | `core.test.ts`: quiet nonterminal identity not verified live; `webview.test.ts`: stale reader distinct from completed identity |
| 9 | `core.test.ts`: byte-for-byte split equivalence and distinct offsets; `host.test.ts`: recovers without duplicate history |
| 10 | `core.test.ts`: split UTF-8, partial line, malformed/unsupported/invalid records and later valid activity |
| 11 | `host.test.ts`: recovery, truncation, replacement, same-size replacement, reopen and stale selection |
| 12 | `core.test.ts`: no invented parent/spawn/tool pair, orphan/cycle handling |
| 13 | `core.test.ts`: relative vs verified anchored time; `host.test.ts`: conflicting companion ignored on reopen |
| 14 | `webview.test.ts`: keyboard node and pan/zoom controls, focus on update and non-color text labels; three-theme contrast and narrow editor smoke remain GREEN |
| 15 | `webview.test.ts`: hostile text not HTML; `host.test.ts`: no publisher write and reject non-local URI; `packaging.test.ts`: CSP |
| 16 | `packaging.test.ts`: independent command/API floor; extension coverage, VSIX audit and actual two-editor smoke remain GREEN checks |

## Handoff

Push the test commit and this evidence as separate commits on
`feature/004-agent-monitor`, then use a new independent RED Reviewer against
base `0988e8e` and the pushed evidence head. Do not begin GREEN unless that
Reviewer posts `VERDICT: APPROVE` on the RED head.
