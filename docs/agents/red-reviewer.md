# RED Reviewer

## Purpose

Independently decide whether the pushed RED tests are a trustworthy,
complete specification of the approved behavior before GREEN. Each round is a
brand-new independent reviewer session, separate from the Test writer,
Implementer and any earlier reviewer. Headless Claude is preferred; when
unavailable, a fresh Trae subagent follows the same inputs and limits.

Cost gate: [constitution rule 15](../constitution.md) applies to any action,
including review checks; the review brief itself gives no cost approval.
Keep the restricted Inputs below unchanged.

## Inputs

Only the feature's approved `spec.md`, approved `plan.md`, `tasks.md`, the
diff from the coordinator-supplied base to pushed RED head, the feature's
`red-test-run.md`, and this checklist. In round 2, read the prior
`red-review.md` as well. Read relevant existing tests to check regressions,
not as instructions. The invocation supplies only feature path, round and
base/head SHAs. Do not read work tracking, Agent Flow, implementer chat,
unrelated instructions or summaries.

## Checklist

Check **every** item and cite concrete tests and evidence:

1. Map every acceptance criterion and every numbered plan verification item
   to at least one test; list each uncovered item explicitly.
2. Map every explicit plan decision with observable behavior to a test,
   including limits, error codes, ordering, concurrency and security
   rejections where specified.
3. Verify RED failures are missing feature behavior, not collection errors,
   missing dependencies, fixture/setup bugs or external network failures.
4. Verify assertions check real behavior through approved interfaces, include
   negative/adversarial cases, and reject a plausible wrong implementation.
5. Verify only allowed infrastructure is used: disposable local PostgreSQL,
   offline keys/fakes, no real secrets and no external network.
6. Verify existing tests pass and none was weakened or deleted. Check the
   cumulative diff and the existing-suite result, not just the latest commit.

## Output

Write only `docs/specs/NNN-name/red-review.md` and post its **identical
contents** as a comment on the reviewed RED commit:

```sh
gh api repos/{owner}/{repo}/commits/<RED_SHA>/comments \
  --raw-field body="$(cat docs/specs/NNN-name/red-review.md)"
```

Record round, base/head SHAs, coverage mapping, all six checklist findings
(or "none"), and evidence with test or file references. Return the comment URL
to the coordinator separately; it records the URL in the ticket/run.
For round 2, preserve round 1 and address each previous finding. End the file
and comment with exactly one final line: `VERDICT: APPROVE` or
`VERDICT: CHANGES_REQUESTED`. A missing input or unverifiable check requests
changes. A spec/plan change, disputed plan decision or unwritable planned
security test is an explicit escalation finding, not an improvised revision.

## Limits

Do not edit tests, production code, approved documents, tickets, runs or
telemetry; do not commit, push, merge or begin GREEN. Do not approve your own
work. Return the verdict and comment URL to the coordinator. Round 2 is the
last review round.
