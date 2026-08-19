# Tasks

Pending work only, in order. Delete an entry when it is done — history lives in
git and `docs/`.

V1 scope: the JavaScript track, five topics, the full learn → recall → streak
loop. See `docs/architecture.md` for the design these tasks implement.

---

## 11. Dashboard

The landing page after login. Topic counts by status, question counts by result,
weak topics, current streak, and the actions: continue learning, review weak
topics, practise questions. Information over decoration.

Topic status is computed here from recent attempts — implement that derivation as
a tested pure function, not inline query logic.

**Done when:** counts match a seeded fixture of attempts, and the status
derivation has unit tests at each threshold.

---

## 12. Practical exercises

Exercise list per topic with prompt and requirements, marked complete manually
with notes. Solved locally in VS Code — no execution sandbox in V1.

**Done when:** an exercise can be marked complete with notes, survives a restart,
and appears in the dashboard's practical counts.

---

## 13. Content: the remaining four topics

Event loop and micro/macrotasks · `this` and call/apply/bind · Prototypes and the
prototype chain · Promises and async/await.

Each needs the full topic structure plus at least eight questions spanning
concept, output, debugging and interview types, and two exercises.

Write one topic per branch. If a topic needs a visual the library cannot express,
that is a new task against task 6 — not an ad-hoc component in the content
directory.

**Done when:** all five V1 topics are complete and a full loop — learn, recall
over several days, weak topic resurfacing — has been used for real.

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
