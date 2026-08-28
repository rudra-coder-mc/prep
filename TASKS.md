# Tasks

Pending work only. Delete an entry when it is done, since the history of what
was done lives in git and `docs/`.

This file carries the whole task, not a link to one. There is no ticket tracker:
`CLAUDE.md` explains why. Everything a person needs to pick a task up cold is
written here, or in the brief a task points at under `docs/tasks/`.

The plan behind this file turns a bank of questions into a path with a promise at
the end of it: finish a tier and you are prepared for that level of interview.
The platform side is built. A tier is picked per track, marking a topic learned
enrols only what that tier covers, and the dashboard measures readiness against
the whole tier. What is left is the bank, which is why every task below is
content.

Read `docs/decisions/0028-tiers-are-interview-levels.md` first, then `0031` and
`0032` for how the pick and the promise behave. The terms are in
`docs/glossary.md`, the content conventions are in
`docs/tasks/converting-a-topic.md`, and
`docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md` is what a new
narration script needs to know.

**Phases run in order.** Inside a phase, take the tasks top to bottom unless a
task says what blocks it. One task is one branch and one merge, as always.

Task numbers are the blocking graph's names, so a finished task leaves a gap
rather than renumbering the ones after it. The numbering starts partway through
because the tasks before it are done.

The focus is SWE-1 and SWE-2. Senior and Staff exist, they stay thin, and they
show their real counts rather than pretending.

---

# Phase 4: SWE-1 and SWE-2 get enough questions to mean something

Four tiers across 43 topics is roughly two questions per tier per topic, which
carries no promise at all. Bring the tiers that matter to five or six questions
per topic, in the topics a real interview at these levels opens with. Senior and
Staff stay as they are.

Each task below is four topics, one branch, authored to
`docs/tasks/converting-a-topic.md`, which carries the rule for tagging a new
question with a tier. Nothing blocks them, so they can be taken in any order.

Tasks 15, 16 and 17 set the shape the rest match: six questions at SWE-1 and six
at SWE-2 in every topic they touched. Everything added was a choice question,
since each of these topics already has its one open question and its ordering
question.

The total is whatever that leaves, rather than a number to hit. Twelve topics
have finished anywhere from thirteen to sixteen questions, because a topic
already carrying eight SWE-2 questions keeps them.

Check what a topic actually has before planning the work. Task 16 was fifteen
SWE-1 questions out of sixteen and task 17 was sixteen out of sixteen, because
their topics were already at six or more SWE-2. The bank was authored before
tiers existed and tagged afterwards, and tagging it honestly produced few SWE-1
questions, so what is being filled is a thin bottom rather than a thin middle.

## 18. Fill the browser

`the-dom`, `events-and-delegation`, `fetch-and-the-network`, `storage`.

---

# Phase 5: the language gets its missing topics

## 19. Regular expressions, numbers and precision, strings

Three topics with no home in the track today, and all three are asked at SWE-1
and SWE-2. Regular expressions: groups, greedy against lazy, `lastIndex` on a
global regex, and when not to use one. Numbers and precision: floating point,
`Number.EPSILON`, `toFixed` rounding, when `BigInt` is the answer, money.
Strings: code points against code units, template literals and tagged templates,
normalisation.

Nothing blocks them, and they are written tier-aware from the start, so the
schema will refuse a question with no tier. Done when the three
pass the content check and read as lessons rather than lists of facts.

---

# Loose ends

Small, ready to take, and blocked by nothing. They sit outside the phases because
they are not content, so they do not have to wait for the bank.

## 20. The architecture doc still describes typed answers

`docs/architecture.md` has an "Evaluation" section written before decision
`0023`. It describes typing an answer and self grading it, an `expectedOutput`
compared against what you typed, and "all three forms" meaning written, multiple
choice and output. None of that exists: no question takes typed input, the forms
are `choice`, `ordering` and `open`, and neither `expectedOutput` nor
`expectedAnswer` appears anywhere in `src/` or `content/`.

Rewrite the section against what the code does now, which is the three forms in
`src/content/schema.ts` and how each one is graded. Say what an open question's
self grade is for, since that is the only place a grade is still a judgement.
Done when nothing in the doc names a field the schema does not have.

---

# Not scheduled

Real work, deliberately unordered. Do not pick these up as "the next task"
without discussing it first. Each needs breaking down before it is actionable.

## The mobile version

The same content in an app, because most of the day is spent on a phone and a
lesson and a question are both things you can do there. It waits until the web
side is finished and the JavaScript content is final. Nothing in the platform may
assume a browser before then: the tier lives in the database rather than in
`localStorage`, and topic audio can already be downloaded a topic at a time.

## Dates and time, and `Proxy` with `Reflect`

The other two subjects the language track has no topic for. Both are senior and
staff material almost entirely, so they wait until those tiers are the focus.

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

The curriculum is in git and reproducible. Attempt history, the interval ladder
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
