# Feature 008 RED Review

- Round: 1
- Base: `7ccf2b8`
- Pushed RED head: `262969e`
- Scope: approved real-data preview round 2 amendment

## Coverage mapping

| AC / plan verification item | Test evidence |
| --- | --- |
| 1 | `core.test.ts: last event absolute time uses last accepted record`; `webview.test.ts: header shows source session following age and stale recovery` |
| 2 | `webview.test.ts: toolbar toggles range and last reported active without liveness claim` |
| 3 | `webview.test.ts: wide view places three panes beside visible graph and narrow view stacks in order` |
| 4 | `presentation.test.ts: lane assignment preserves slots across late root and append`; `presentation.test.ts: display name strips only assigned lane prefix and preserves unmatched and ungrouped ids`; `webview.test.ts: root task titles slug subtitles and agent counts span lanes` |
| 5 | `webview.test.ts: foreground labels fit inside fixed boxes without overlap at fit and zoom`; `webview.test.ts: assigns root-prefixed orphans to their lane and keeps card copy inside fixed boxes` |
| 6 | `webview.test.ts: all resolved links draw one connector including cross lane and late parent` |
| 7 | `webview.test.ts: statuses and unknown parent show distinct symbols without fading completed`; `webview.test.ts: failed tool never changes completed agent status` |
| 8 | `presentation.test.ts: no report threshold requires verified age`; `webview.test.ts: quiet report tag advances without dimming` |
| 9 | `presentation.test.ts: local time ages durations and relative fallback respect verified bounds`; `core.test.ts: incomplete interval exposes no invented absolute end` |
| 10 | `presentation.test.ts: event labels avoid raw repetition and preserve ambiguous tools`; `core.test.ts: tool duration exists only for unique nonnegative pair` |
| 11 | `webview.test.ts: inspector shows worktree task unavailable role status times parent and copyable full id` |
| 12 | `presentation.test.ts: last 24 hours groups older and unknown intervals without dropping history`; `webview.test.ts: older run expansion search and reveal retain selection` |
| 13 | `webview.test.ts: footer keeps graph visible and expands provisional snapshots and diagnostics` |
| 14 | `webview.test.ts: light dark high contrast meet text and connector contrast`; `webview.test.ts: keyboard and reduced motion reach controls and inspector` |
| 15 | `webview.test.ts: historical and incremental fixtures preserve camera and no executable telemetry`; existing core, host, packaging, presentation, and webview cases |
| 16 / P1 | `capture-preview.ts` checks fitted content after initial load, All runs, and Last 24 hours at both required widths. |
| 16 / P2 | `webview.test.ts: draws no overlapping near-duplicate horizontal bus segments`; `capture-preview.ts` checks the production fixture for a duplicate upper bus. |
| 16 / P3, P7 | `webview.test.ts: treats current and legacy lane roots as metadata regardless of task`; the production fixture checks current adapter roots, legacy prefix shortening, empty-root exclusion, and lane-kind labels. |
| 16 / P4-P6 | `webview.test.ts: uses latest-run duration and human-only summary on card and navigator`; `webview.test.ts: reconciles recent older and all-runs identity counts`; existing `collapses five runs to one card and row with latest run selected`; production semantic checks. |
| 16 / P8 | `webview.test.ts: caps the narrow navigator at two-fifths of the viewport` |

Uncovered or contradicted behavior is listed below; therefore this mapping is
not complete enough to approve.

## Findings

1. **The cumulative suite contains assertions that directly contradict the
   approved round-2 behavior.** In
   `webview.test.ts: preserves the camera after append and filtering, with Fit
   All including terminal and unresolved overflow`, line 248 requires the
   manually moved camera to remain unchanged after the active-only filter. The
   amendment requires every active-filter change to reset to fitted,
   top-anchored placement. In
   `webview.test.ts: collapses five runs to one card and row with latest run
   selected`, lines 2260-2270 require `×5 runs` and `30m` for an open latest run
   that started at 11:00, last reported at 11:30, and is rendered at 12:00.
   The amendment requires compact `×5` and elapsed-so-far `1h`, using the later
   of the last in-run report and the current clock. A compliant GREEN cannot
   satisfy these existing assertions. Correct or replace the stale assertions
   in RED before implementation.

2. **P1 does not test the required active-filter reset.** The browser seam at
   `capture-preview.ts:44-84` checks initial load and the two range changes but
   never toggles `Only last reported active`. This omission is especially
   material because the existing DOM test currently enforces the opposite
   camera behavior. Add a production-bundle assertion that a manual zoom/pan
   persists until, and resets on, the active-filter change.

3. **P2 does not cover the full connector decision.** The new DOM fixture has
   one lane and already passes at RED. It does not assert that registration-root
   edges are absent from ordinary `data-edge` routes. The browser guard only
   gathers horizontal segments above `y < 150` and reduces each path to its
   first four numbers, rather than comparing every horizontal segment as the
   plan specifies. A renderer could retain an attributed registration edge or
   emit duplicate lower horizontal segments and still pass. Exercise a
   task-independent registration root in a multi-lane graph, reject its
   ordinary attributed routes, and parse all horizontal path segments for the
   4px overlap rule.

## Checklist

1. **Acceptance and plan coverage:** Findings 1-3. AC1-AC15 retain named
   coverage, but AC16/P1 and P2 are contradicted or incomplete.
2. **Observable plan decisions:** Findings 1-3 cover the missing active-filter
   reset, stale latest-run/badge expectations, registration-edge exclusion,
   and all-segment geometry check. No error-code, concurrency, or additional
   security decision is introduced by this amendment.
3. **Trustworthy RED failures:** The exact pushed head was exported and checked
   offline. The focused Vitest run produced four missing-behavior failures
   (registration, summary, counts, narrow navigator), one bus pass, and 54
   skips. The production-bundle check reached the page and failed on fitted
   placement after All runs. These are behavioral assertions, not collection,
   dependency, fixture, or network failures.
4. **Behavioral and adversarial assertions:** The tests use the approved
   mounted DOM and production bundle with synthetic data and cover negative raw
   summaries, root leakage, unknown chronology, repeated intervals, and narrow
   CSS. Findings 1-3 identify the remaining plausible wrong implementations
   and conflicting assertions.
5. **Infrastructure and privacy:** No finding. The diff uses sanitized
   synthetic fixtures, local JSDOM/Playwright, and offline dependencies. It
   contains no real stream, secret, external request, or paid resource.
6. **Existing-suite regression:** No test was deleted or weakened in the
   cumulative diff; `webview.test.ts` adds 325 lines. An offline negative-name
   run at `262969e` passed 132 existing tests with exactly the five new DOM
   cases skipped. However, Finding 1 means the unchanged suite is not a valid
   post-GREEN regression contract.

## Evidence

- `git diff --check 7ccf2b8..262969e`: passed.
- Focused Vitest at `262969e`: four failed, one passed, 54 skipped; failures
  match the recorded missing behavior.
- Unaffected Vitest at `262969e`: 132 passed, five skipped.
- `npm run test:preview-layout` at `262969e`: failed with
  `preview-wide.png: graph is not fitted, top-anchored, and centered after All runs`.
- Cumulative test diff: no deleted test files or removed assertions.

VERDICT: CHANGES_REQUESTED
