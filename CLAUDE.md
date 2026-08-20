# prep

Personal learning platform. Overrides `~/.claude/CLAUDE.md` where they conflict.

## Hard rule: this project never leaves this machine

**Nothing about this project goes to an external service.** The GitLab at
`gitlab.script-jet.com` and the ClickUp workspace both belong to the company.
This is Atul's personal project and it does not go on company infrastructure,
or on any hosted service he has not named.

Code stays local:

- No git remote. Do not add one.
- No `git push`, no `glab`, no merge requests.
- No `.gitlab-ci.yml`.

Tasks stay local too:

- **Never create a ClickUp task for this project.** No `clickup-cli`, no
  `clkup`, no ClickUp MCP tools, not even to read.
- No GitHub issues, no Jira, no hosted tracker of any kind.
- `TASKS.md` in this repo is the only task list. See below for what that
  changes.

This overrides the global rules, which assume company work. If a hosted service
is ever wanted, it has to be a personal account that Atul names explicitly.
Never infer one.

## Workflow without a remote

The intent of the global workflow still holds, it just runs locally.

- One task per branch, named `<type>/<slug>` as usual.
- Review before merging, same tiering as the global rules.
- Merge into `main` locally with `--no-ff` so history reads as discrete tasks.
- Delete the task from `TASKS.md` in the same commit that completes it.

`TASKS.md` carries the whole task, not a one-line index. The global rules keep
it thin because ClickUp holds the detail, and here there is no ticket to point
at, so what someone needs to pick a task up has to be written in the file: what
the job is, why, and what done means.

The `tickets` skill publishes to ClickUp, so run it only for its breakdown.
Write the result into `TASKS.md` and let nothing reach the network.

## Quality gates without CI

There is no pipeline, so the hooks are the whole safety net and they are not
optional.

- Pre-commit: lint, format, typecheck, unit tests.
- Pre-push equivalent runs as a pre-merge check: the full suite including
  integration and e2e, via a single `npm run verify`.
- Never merge into `main` with `verify` failing.

## Everything else

Stack, architecture and open tasks are in `README.md`, `docs/architecture.md`,
`docs/decisions/` and `TASKS.md`.
