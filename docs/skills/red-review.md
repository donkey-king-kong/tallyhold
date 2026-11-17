# Review the RED handoff

Run this gate for every future feature RED handoff, before GREEN. The approved
feature spec and plan remain authoritative; a review cannot change either.
Use one feature branch and worktree at a time, as in [workflow](../workflow.md).

**Cost gate:** Apply [constitution rule 15](../constitution.md) before RED
setup, checks or reviewer dispatch that could incur provider costs. A spec,
plan or RED handoff is not cost approval: the coordinator obtains two separate
explicit yeses through `COST APPROVAL 1/2` then `COST APPROVAL 2/2`; even a
confirmed payment-free free-tier action needs one explicit yes with limits noted.
Use only offline/local review checks until the required approval is recorded.

1. **Prepare evidence:** The Test writer commits the RED tests, then runs the
   new tests and the existing tests selected separately (excluding only the
   new RED cases) at that test commit. Commit and push
   `docs/specs/NNN-name/red-test-run.md` alongside the test commit (two
   commits in one push). The evidence names the tested test-commit SHA, commands
   and exit statuses, collected/failed/passed/skipped counts,
   each failure reason, the existing-suite result, and the mapping from every
   acceptance criterion and numbered plan verification item to test names.
   Sanitize output: no credentials, secrets, or live environment values. The
   feature must remain RED for missing behavior; setup, collection, dependency,
   network and fixture failures block review. The coordinator verifies the
   remote SHA matches the handoff and records its base SHA, RED SHA, evidence
   path and next action in the ticket/run before dispatch.
2. **Dispatch:** For round 1 or 2, prefer a **new headless Claude Code process**
   from the feature worktree using ship's [fresh-review mechanism](ship.md#4-delegate-independent-review).
   Check `claude --version` and `claude auth status`. Use no `--continue` or
   `--resume`, no prior conversation, and no Test writer or Implementer session.
   The sole instruction handoff is [RED Reviewer](../agents/red-reviewer.md):

   ```sh
   claude -p "Act strictly per docs/agents/red-reviewer.md for feature docs/specs/NNN-name/, round <R>, base <BASE_SHA>, pushed RED head <RED_SHA>. Read only its permitted evidence. Write docs/specs/NNN-name/red-review.md and post the identical commit comment. End with the VERDICT line." --allowedTools "Read,Grep,Glob,Bash" --model opus --safe-mode --no-session-persistence
   ```

   The allowlist excludes editing tools; Bash is allowed only for permitted
   checks, report writing and posting the comment. If `claude` is unavailable,
   unauthenticated or fails to launch before producing a verdict, automatically
   start a **different, fresh Trae subagent** with no conversation-history fork.
   Give it only the same role-file instruction, feature path, round, base/head
   SHAs and role-permitted evidence. It reads no Test writer or Implementer
   chat, tickets, runs, Agent Flow or coordinator assessment. Explicitly limit
   it to the same read-only code/test checks, the one permitted report and
   identical commit comment; Trae lacks a verified tool allowlist. A failed
   launch does not consume a review round. If neither reviewer can run, stop
   and escalate to Zack. Preserve all other escalation conditions in step 4.
   The coordinator reports reviewer type, lifecycle and verdict in the
   ticket/run and Agent Flow without passing tracking or telemetry to the
   reviewer.
3. **Decide and record:** Confirm the report ends in `VERDICT: APPROVE` or
   `VERDICT: CHANGES_REQUESTED`, matches the commit comment, and covers every
   checklist item in the RED Reviewer role. Record reviewer identity, round,
   base/head SHAs, report path, comment URL, verdict and findings in the
   ticket/run. The coordinator commits/pushes the report after the reviewer
   exits; never attribute its commit to the reviewer.
4. **Act:** On `APPROVE`, hand the approved RED head to the Implementer for
   GREEN automatically, then use [ship](ship.md) as usual after implementation.
   On `CHANGES_REQUESTED`, the Test writer fixes the tests/evidence in a new
   commit, reruns checks and pushes; a **different, fresh** reviewer checks
   the cumulative RED diff and prior findings in round 2. Stop and escalate
   to Zack if round 2 is not approved, a finding requires changing the
   approved spec or plan, the reviewer disputes a plan decision, or a planned
   security test (auth, tenant isolation, erasure or secrets) cannot be
   written. Never enter GREEN during an escalation.

This gate is independent of ship's later PR review (up to three rounds).
Gate 1 spec approval, architecture/schema plan approval, production migration
approval, constitution-changing merges and RED escalations remain with Zack.
