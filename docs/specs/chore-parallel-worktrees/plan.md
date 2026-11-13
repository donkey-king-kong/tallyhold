# Parallel feature worktrees plan

## Status and approvals

Zack directly approved the maintenance requirements in [spec](spec.md) and
requested the full ship workflow. No product Gate 1, application architecture,
or schema approval is required.

## Approach

- Replace the single-working-directory guidance in `AGENTS.md` with isolated
  worktree and cleanup rules.
- Add worktree creation before the issue step in `docs/workflow.md` and permit
  concurrent work only across separate branches and worktrees.
- Make `docs/skills/ship.md` operate from a worktree root and finish with
  cleanup from the main worktree.
- Add explicit worktree fields to ticket and run templates.
- Update recovery and Agent Flow documentation for one local session and JSONL
  stream per worktree.
- Leave the fresh Reviewer role unchanged.

## Data and migrations

None. The change affects Markdown workflow instructions only. Worktree-local
Agent Flow runtime files remain git-ignored and are not committed.

## Verification

Check the requested wording, Markdown formatting, documentation links,
whitespace, the unchanged Reviewer file, and the Agent Flow adapter tests.
