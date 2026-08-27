# Tasks

Pending work only. Delete an entry when it is done, since the history of what
was done lives in git and `docs/`.

This file carries the whole task, not a link to one. There is no ticket tracker:
`CLAUDE.md` explains why. Everything a person needs to pick a task up cold is
written here, or in the brief a task points at under `docs/tasks/`.

**Nothing is scheduled.** The loop works, the platform is finished, and the
JavaScript and browser tracks between them cover what a front end interview
asks. Everything below is real work left unordered on purpose.

Content conventions live in `docs/tasks/converting-a-topic.md`: what a topic
ships, how the questions are written, and how a group becomes a branch. Read it
before writing any.

---

# Not scheduled

Real work, deliberately unordered. Do not pick these up as "the next task"
without discussing it first. Each needs breaking down before it is actionable.

## Browser runners

PGlite for the PostgreSQL track first, since it is the highest value and the
easiest. Then QuickJS for JavaScript output checking, TypeScript on top of it,
`mingo` for Mongo queries, Sandpack for React last.

Add them one at a time. Build no shared abstraction until the second one exists.

See `docs/decisions/0007-execution-runners.md`.

## `prep` CLI and the verdict endpoint

Local test execution for the Node, Express, Fastify and NestJS tracks. Test
suites authored under `content/`, a CLI that scaffolds and runs them, and an
endpoint that records the structured verdict as a normal attempt.

See `docs/decisions/0008-local-cli-verification.md`.

## Database backup

The curriculum is in git and reproducible. Attempt history, confidence ratings
and the streak are not, and live only in a Docker volume on one machine. A
scheduled `pg_dump` into a directory that is already backed up would cover it.

## The other tracks

TypeScript, React, Next.js, Node, Express, Fastify, NestJS, MongoDB and SQL.

Adding a technology is a content directory, not a platform change, which the
browser track exercised for the first time. Only runners cost anything.

React inherits the browser track as its prerequisites, which is what decision
`0027` was written to make possible.

## Remove `shiki`

Listed as a dependency and imported nowhere. Either use it for lesson code
blocks, which currently render unhighlighted, or drop it.
