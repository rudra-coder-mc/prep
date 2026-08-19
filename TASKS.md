# Tasks

Pending work only. Delete an entry when it is done, since the history of what
was done lives in git and `docs/`.

V1 is complete: the JavaScript track with five topics, and the full learn,
recall and streak loop. See `README.md` to run it and `docs/architecture.md`
for how it is put together.

---

# Not scheduled

Real work, deliberately unordered and outside V1. Do not pick these up as "the
next task" without discussing it first. Each needs breaking down before it is
actionable.

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

## Remaining JavaScript topics, then the other tracks

The other 26 topics from the original curriculum, then TypeScript, React,
Next.js, Node, Express, Fastify, NestJS, MongoDB and SQL.

Adding a technology is a content directory, not a platform change. Only runners
cost anything.
