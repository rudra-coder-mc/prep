# Tasks

Pending work only, in order. Delete an entry when it is done — history lives in
git and `docs/`.

V1 scope: the JavaScript track, five topics, the full learn → recall → streak
loop. See `docs/architecture.md` for the design these tasks implement.

---

## 2. Docker Compose stack

Postgres with a named volume and healthcheck, app container gated on it,
multi-stage Dockerfile using Next.js standalone output. Entrypoint applies
migrations and seeds the user idempotently. Working defaults in the compose file;
`.env` overrides. `compose.dev.yaml` overlay bind-mounts `content/` and `src/`
with hot reload.

See `docs/decisions/0006-zero-setup-compose.md`.

**Done when:** `docker compose up` on a machine with no Node and no Postgres
serves the app; `docker compose down && docker compose up` preserves data; the
dev overlay reflects an edited file without a rebuild.

---

## 3. Database schema and migrations

Drizzle schema for the six tables in `docs/architecture.md`, plus whatever
better-auth owns. `userId` on every progress row. Indexes on the queries that
matter: due questions per user, attempts per question, activity per user per day.

Note the deliberate absences — topic status and streak are computed, not stored.

Depends on task 2 (migrations run in the entrypoint).

**Done when:** migrations apply from empty on `compose up`, are reversible, and
integration tests cover each table's constraints against a real Postgres.

---

## 4. Authentication

better-auth with email and password, Drizzle adapter, one user seeded from env at
startup. No public signup. Middleware protects every route except the login page.
Startup warns when default credentials are still in use.

Depends on task 3. See `docs/decisions/0004-self-hosted-auth.md`.

**Done when:** an e2e test logs in, reaches a protected page, logs out, and is
redirected when hitting a protected route unauthenticated.

---

## 5. Content pipeline

The loader that turns `content/` into typed data at build time. Directory
convention `content/<technology>/<topic>/` with `meta.ts`, `lesson.mdx`,
`questions.ts`, `exercises.ts`. Zod schemas for every content type, validated at
build so a malformed question fails the build rather than a study session. MDX
configured to render the visual components inline.

See `docs/decisions/0002-content-in-git.md`.

**Done when:** a fixture topic is discovered, validated and rendered without any
registry edit, and an invalid fixture fails the build with a message naming the
file and field.

---

## 6. Visual component library

The seven components in `docs/architecture.md`: `CodeWalkthrough`, `CallStack`,
`EventLoop`, `MemoryModel`, `ScopeChain`, `PrototypeChain`, `PromiseTimeline`.

All data-driven — a lesson passes a description of steps, never imperative
animation code. Each needs play/pause/step controls, a keyboard-accessible
timeline, and a static fallback under `prefers-reduced-motion`.

This is the largest task in V1 and the one that determines whether the rest of
the curriculum is cheap to write. If it grows past one branch, split it per component
before continuing.

Consider splitting: `CodeWalkthrough` first, since most topics rely on it.

**Done when:** each component renders from a fixture, steps forward and backward
without visual glitches, and has unit tests over its step-state machine.

---

## 7. Topic page and mark-as-learned

The lesson route: why it matters, explanation, animation, step-through example,
interview angle, traps. A mark-as-learned action that writes `topic_progress` and
enrols the topic's questions into `review_schedule` at the bottom of the ladder.

Ship Closures as the proving content in this task — a real topic end to end is
the only way to know the pipeline and the visual library actually work before
writing four more.

Depends on tasks 5 and 6.

**Done when:** an e2e test reads the Closures topic, marks it learned, and the
questions appear in the recall queue.

---

## 8. Question session engine

The session flow: show prompt → user types an answer → select confidence →
reveal expected answer and explanation → mark Pass / Weak / Failed → save attempt
→ next. The answer must not be revealable before submitting.

Every attempt is a new row. Hints are revealable and recorded as used.

Depends on task 7.

**Done when:** a full session persists one attempt per question with answer text,
result and confidence, and an e2e test confirms the expected answer is not in the
DOM before submission.

---

## 9. Recall scheduler and daily queue

The interval ladder from `docs/decisions/0005-recall-interval-ladder.md`.
Confidence sets the next due date, a failed result resets to the bottom. The
daily queue is capped and fills in priority order: overdue, then due today, then
weakest topics.

Pure scheduling functions, separated from persistence, so they are testable
without a database. Test the boundaries: same-day rescheduling, a failed answer
at confidence 5, an empty queue, a queue larger than the cap.

Depends on task 8.

**Done when:** unit tests cover every ladder transition and an integration test
shows a question answered at each confidence level reappearing on the right day.

---

## 10. Streak and daily activity

`daily_activity` written as reviews happen. Streak derived from it, never stored.
A day counts when the queue is cleared, or when any review happens on a day with
an empty queue.

Decide and document the timezone rule — a "day" needs one definition, and it
must not shift when travelling.

Depends on task 9.

**Done when:** unit tests cover a continuous streak, a broken streak, an
empty-queue day, and a day spanning a timezone change.

---

## 11. Dashboard

The landing page after login. Topic counts by status, question counts by result,
weak topics, current streak, and the actions: continue learning, review weak
topics, practise questions. Information over decoration.

Topic status is computed here from recent attempts — implement that derivation as
a tested pure function, not inline query logic.

Depends on task 10.

**Done when:** counts match a seeded fixture of attempts, and the status
derivation has unit tests at each threshold.

---

## 12. Practical exercises

Exercise list per topic with prompt and requirements, marked complete manually
with notes. Solved locally in VS Code — no execution sandbox in V1.

Depends on task 5.

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

Depends on task 7.

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
