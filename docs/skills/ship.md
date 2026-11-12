# Ship a feature

Follow [the workflow](../workflow.md), [constitution](../constitution.md) and [conventions](../conventions.md). Only Zack approves the spec and merges.

1. **Confirm scope:** Use the feature branch and approved `docs/specs/NNN-name/{spec,plan,tasks}.md`; confirm Gate 1 and any required plan approval. Stop if either is missing.
2. **Finish implementation:** Complete tasks and checks, commit continuously, and push before handoff. Leave no uncommitted changes.
3. **Open PR and run CI:** Follow [create-pr](create-pr.md) to open the feature PR against `main`, then inspect `gh pr checks <N>`. Resolve failures before requesting review.
4. **Delegate independent review:** Start a **brand-new reviewer subagent** for this round. Pass only PR number `<N>`, round `<R>` (1-3), feature path and [Reviewer role](../agents/reviewer.md); never pass implementer chat, reasoning or summaries. It obtains the diff via `gh pr diff <N>`, CI via `gh pr checks <N>`, and the permitted documents itself. On later rounds it reads the previous `review.md` to verify prior findings. It writes only `docs/specs/NNN-name/review.md`, posts the identical content using `gh pr comment <N> --body-file docs/specs/NNN-name/review.md`, and ends with `VERDICT: APPROVE` or `VERDICT: CHANGES_REQUESTED`.

   - **Claude Code ship session:** Use the Agent tool to select `.claude/agents/reviewer.md` (Opus, Read/Grep/Glob/Bash). Start a new `reviewer` instance for **each** round; its prompt contains only PR number, round and feature path.
   - **Trae, preferred cross-model path:** This Trae version exposes fresh-context `spawn_agent`, but no verified named Reviewer agent with restricted tools. Use a new Claude Code headless process instead. Check `claude --version` and `claude auth status` first, then run from the repo root without `--continue` or `--resume`:

     ```sh
     claude -p "Act strictly per docs/agents/reviewer.md on PR #<N>, round <R>, feature docs/specs/NNN-name/. Read only its permitted evidence and previous review.md on later rounds. Write docs/specs/NNN-name/review.md and post identical content with gh pr comment. End with the VERDICT line. Do not use implementer chat or summaries." --allowedTools "Read,Grep,Glob,Bash" --model opus --safe-mode --no-session-persistence
     ```

     `--safe-mode` prevents automatic `CLAUDE.md`/skill context; the prompt explicitly supplies the role. If Claude Code is missing or unauthenticated, tell Zack and use a **fresh Trae chat** containing only the role, PR number, round and feature path. Never review in the implementer's chat. The fresh Trae `spawn_agent` facility can also launch a dedicated `reviewer_round_<R>` task with that same minimal brief, but its tool restrictions are not enforced; prefer the headless Claude path.

5. **Resolve or escalate:** The coordinator commits and pushes `review.md` after the reviewer finishes. For `CHANGES_REQUESTED`, the Implementer fixes findings on the feature branch, commits and pushes, and CI runs again; step 4 starts a **new** reviewer for the next round. After three rounds, escalate unresolved findings to Zack.
6. **Check the final gate:** Confirm the latest `review.md` and PR comment match, the final line is the latest verdict, the PR diff reflects reviewed code, and CI is green after the last changes. A missing report, stale verdict or failing check stops shipment.
7. **Gate 2:** Only Zack reviews and merges, and only if the latest `review.md` ends with `VERDICT: APPROVE`, CI passes, the approved spec and any required plan approval or migrations are satisfied, and Zack accepts the PR. Agents never merge or push to `main`.
