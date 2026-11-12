# Commit and pull request conventions

These rules apply to every commit and PR by any agent in any tool.

## Commit format

Use `<type>: <message>`. Allowed types:

| Type | Use for |
| --- | --- |
| `feat` | New user-facing behavior |
| `fix` | Bug fixes |
| `docs` | Documentation only |
| `test` | Adding or fixing tests only |
| `refactor` | Code changes without behavior changes |
| `chore` | Maintenance, configuration and dependencies |
| `ci` | CI/CD workflows |
| `build` | Build system, Docker and packaging |
| `perf` | Performance improvements |
| `style` | Formatting only |

Do not add a scope in parentheses. Write the message in lowercase imperative mood ("add", not "added" or "adds"); keep the entire first line at most 72 characters, without a trailing period. An optional body follows a blank line, explains why, and wraps at 72 characters. Reference the feature spec when relevant, for example `Spec: docs/specs/001-project-scaffold`.

Examples:

- `feat: add health endpoint`
- `test: add failing tests for average cost`
- `docs: approve spec 001`

## Commit cadence

- Commit at least once per task in `tasks.md`; split tasks into distinct logical commits when useful. Never mix unrelated changes or refactoring with new behavior.
- The Test writer commits failing tests separately from implementation with `test: ...`.
- Except for the deliberate failing-tests commit, each commit must leave lint and existing tests passing.
- Commit before switching tasks, handing off to another agent or tool, and stopping work; push when stopping.
- As a rough guide, changes over ~200 changed lines or touching more than one layer for different reasons probably need multiple commits.
- Never squash an agent's history before review. Zack decides at merge time.

## Pull requests

Title: `<type>: <concise title>` using the same allowed types, lowercase imperative wording, no scope or trailing period, and a maximum of 72 characters for the full title. Describe the whole PR.

Every PR is assigned to `donkey-king-kong`.

Follow [.github/pull_request_template.md](../.github/pull_request_template.md) in order:

1. **Summary:** 3-7 outcome-focused bullets on what changed and why.
2. **Changes:** bullets grouped by backend, frontend, docs or CI as relevant; name the key files.
3. **Linked:** `Issue: #NN` and `Spec: docs/specs/NNN-name/spec.md`.
4. **Testing:** commands run, results and coverage; state any checks not run.
5. **Next steps:** follow-up tasks, open questions, limitations and the next feature if obvious.
6. **Checklist:** commit format, tests, constitution, migrations when schema changed, and docs.

For "create pr", "open pr" or "ship", run [ship](skills/ship.md) end to end; [create-pr](skills/create-pr.md) is its PR-opening sub-step. Agents merge only when all ship gates pass; Zack merges constitution changes.
