# prep

Personal learning platform. Overrides `~/.claude/CLAUDE.md` where they conflict.

## Hard rule: this repository is local only

**Never push this project anywhere.** Specifically, never push to
`gitlab.script-jet.com`. That GitLab belongs to the company; this is a personal
project and does not go on company infrastructure.

That means:

- No git remote. Do not add one.
- No `git push`, no `glab`, no merge requests.
- No `.gitlab-ci.yml`.

If a remote is ever wanted, it must be a personal account that Atul names
explicitly. Never infer one.

## Workflow without a remote

The intent of the global workflow still holds, it just runs locally.

- One task per branch, named `<type>/<slug>` as usual.
- Review before merging, same tiering as the global rules.
- Merge into `main` locally with `--no-ff` so history reads as discrete tasks.
- Delete the task from `TASKS.md` in the same commit that completes it.

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
