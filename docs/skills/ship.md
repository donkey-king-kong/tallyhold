# Ship a feature

Follow [workflow](../workflow.md), [constitution](../constitution.md) and [conventions](../conventions.md). Zack approves specs and required plans; [create-pr](create-pr.md) is one step in this end-to-end procedure. Work from the repo root. Replace `<N>`, `<R>` and `NNN-name` with actual values.

Before every run, confirm `.agent-flow/session.json` exists; initialize only when missing. Remind Zack to connect **Agent Flow: Open Agent Flow -> Connect to Running Agent -> Watch JSONL File** to `.agent-flow/agent-flow-events.jsonl`. Publish these events from the coordinator, not the fresh Reviewer:

```sh
test -f .agent-flow/session.json || python3 .trae/agent-flow/adapter.py init --session-id "ship-$(date +%s)" --task "Ship approved feature"
python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Starting ship run"
```

1. **Confirm scope:** Use the feature branch and approved `docs/specs/NNN-name/{spec,plan,tasks}.md`; confirm Gate 1 and required plan approval. Stop and follow the block procedure below if either is missing. Publish:
   `python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Checking approved scope"`
2. **Finish implementation:** Complete tasks and local checks, commit continuously and push before handoff. Leave no uncommitted changes. Publish:
   `python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Checking implementation and local tests"`
3. **Open PR and inspect CI:** Follow [create-pr](create-pr.md) against `main`; record PR number `<N>`. Inspect `gh pr checks <N>`; a repo with no CI checks yet must be confirmed separately. Resolve failures before review. Publish:
   `python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Opening PR and checking CI"`
4. **Delegate independent review:** For every round `<R>` (1-3), the coordinator runs the following **before** dispatch. Start a brand-new reviewer subagent with only PR number, round, feature path and [Reviewer role](../agents/reviewer.md); never pass implementer chat, reasoning, telemetry or summaries. It obtains `gh pr diff <N>`, `gh pr checks <N>` and its permitted documents itself; on later rounds it reads the previous `review.md`. It writes only `docs/specs/NNN-name/review.md`, posts identical content with `gh pr comment <N> --body-file docs/specs/NNN-name/review.md`, and ends with `VERDICT: APPROVE` or `VERDICT: CHANGES_REQUESTED`.

   ```sh
   python3 .trae/agent-flow/adapter.py start --agent reviewer_round_<R> --parent orchestrator --task "Independent PR review round <R>"
   python3 .trae/agent-flow/adapter.py status --agent reviewer_round_<R> --state working --activity "Reviewing PR round <R>"
   ```

   - **Claude Code ship session:** Use the Agent tool to select `.claude/agents/reviewer.md` (Opus, Read/Grep/Glob/Bash). Start a new `reviewer` instance each round, with only PR number, round and feature path.
   - **Trae, preferred cross-model path:** Check `claude --version` and `claude auth status`. Start a new headless Claude process from the repo root without `--continue` or `--resume`:

     ```sh
     claude -p "Act strictly per docs/agents/reviewer.md on PR #<N>, round <R>, feature docs/specs/NNN-name/. Read only its permitted evidence and previous review.md on later rounds. Write docs/specs/NNN-name/review.md and post identical content with gh pr comment. End with the VERDICT line. Do not use implementer chat or summaries." --allowedTools "Read,Grep,Glob,Bash" --model opus --safe-mode --no-session-persistence
     ```

     `--safe-mode` disables automatic `CLAUDE.md` and skill context; the prompt explicitly names the sole role file. The allowlist excludes editing tools, but Bash is needed for checks and the permitted report/comment: the Reviewer must follow its write restrictions. If Claude is unavailable or unauthenticated, report this to Zack and use a fresh Trae chat with only the minimal brief. Trae's `spawn_agent` is fresh-context but lacks verified tool restrictions; prefer Claude.

   After receiving the result, the **coordinator** publishes the verdict (the Reviewer never writes telemetry):

   ```sh
   python3 .trae/agent-flow/adapter.py status --agent reviewer_round_<R> --state working --activity "Verdict: APPROVE"
   python3 .trae/agent-flow/adapter.py complete --agent reviewer_round_<R> --parent orchestrator --summary "Review round <R>: APPROVE"
   ```

   For `CHANGES_REQUESTED`, substitute that verdict in both commands. For a failed review process, publish `status --state blocked` and `complete --failed` with generic labels, then use the block procedure.
5. **Resolve or escalate:** The coordinator commits and pushes `review.md` after each round. For `CHANGES_REQUESTED`, the Implementer fixes findings, commits and pushes, local checks and CI run again, and step 4 starts a **new** Reviewer. After three rounds with unresolved findings, follow the block procedure and report to Zack. Publish:
   `python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Resolving review findings"`
6. **Check merge gate:** Confirm the latest `review.md` and PR comment match, the final line is the latest verdict, the reviewed PR diff is current, and all approved spec/plan/migration requirements are met. Verify **all** merge conditions: latest `review.md` ends with `VERDICT: APPROVE`; zero must-fix and zero should-fix findings remain; local checks pass; CI is green (or the repo has no CI checks yet); the PR has neither `needs-human` nor `pause` label; and `gh pr diff <N> --name-only` does **not** include `docs/constitution.md`. A missing/stale report, unreviewed commit, pending or failed check, or unknown CI state fails the gate. Publish:
   `python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Verifying all merge conditions"`
7. **Automated merge:** Only after **every** condition in step 6 passes, publish and merge. Then check out and pull `main`:

   ```sh
   python3 .trae/agent-flow/adapter.py status --agent orchestrator --state working --activity "Merging approved PR"
   gh pr merge <N> --merge --delete-branch
   git switch main
   git pull --ff-only origin main
   python3 .trae/agent-flow/adapter.py complete --agent orchestrator --summary "PR merged and main updated"
   ```

   If **any** condition fails, do not merge. Add the `needs-human` label (create the label if the repository has not defined it), comment the specific reason with `gh pr comment <N>`, and report to Zack. This includes PRs modifying `docs/constitution.md`; Zack alone merges those after review. Publish the block and outcome:

   ```sh
   python3 .trae/agent-flow/adapter.py status --agent orchestrator --state blocked --activity "Merge blocked; Zack review required"
   gh pr edit <N> --add-label needs-human
   gh pr comment <N> --body "Automated merge blocked: <specific reason>. Zack review required."
   python3 .trae/agent-flow/adapter.py complete --agent orchestrator --summary "Escalated to Zack" --failed
   ```
