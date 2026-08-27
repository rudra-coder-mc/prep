# Tasks

Pending work only. Delete an entry when it is done, since the history of what
was done lives in git and `docs/`.

This file carries the whole task, not a link to one. There is no ticket tracker:
`CLAUDE.md` explains why. Everything a person needs to pick a task up cold is
written here, or in the brief a task points at under `docs/tasks/`.

The work below turns a bank of questions into a path with a promise at the end of
it: finish a tier and you are prepared for that level of interview. The two
decisions behind it are `docs/decisions/0028-tiers-are-interview-levels.md` and
`docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md`. Read them
first. The terms are in `docs/glossary.md`, and the content conventions are in
`docs/tasks/converting-a-topic.md`.

**Phases run in order.** Inside a phase, take the tasks top to bottom unless a
task says what blocks it. One task is one branch and one merge, as always.

Task numbers are the blocking graph's names, so a finished task leaves a gap
rather than renumbering the ones after it. The numbering starts partway through
because the tasks before it are done.

The focus is SWE-1 and SWE-2. Senior and Staff exist, they stay thin, and they
show their real counts rather than pretending.

---

# Phase 2: every question carries a tier

`tier` replaces `difficulty`. This is a wide mechanical change over 466 questions,
so it runs as expand, migrate, contract: the field arrives beside the old one,
the bank is tagged in batches that each stay green, and the old field is deleted
only when nothing is left untagged.

**How to tag.** The four tiers are defined in `docs/glossary.md`, and those
definitions are the rule. Ask what level of interview asks a question, not how
hard it feels.

Two boundaries do most of the work, both drawn from the glossary:

- **Senior against staff.** A senior question has a decision at the end of it.
  A staff question has spec internals or a failure mode at the end of it, and
  nothing to decide.
- **SWE-2 against senior.** SWE-2 asks what went wrong. Senior asks what you
  would do instead. A trade-off whose answer is a single rule is still SWE-2.

`easy` mostly maps to `swe-1`: 61 of the 82 easy questions tagged so far landed
there. Where it breaks is a topic a junior has never met, since the label then
describes the question rather than the round. Ask whether somebody two years in
would have seen the API at all. The easy question on `Object.defineProperty`
defaults is SWE-2, and the easy one asking why a static-only class should be a
module is senior. `hard` does not map anywhere mechanically, so read every one of
them. Twenty-six of the 76 hard questions so far are SWE-2, because a famous
gotcha is hard to answer and still the ordinary working-developer round. The bulk
of the work is the medium questions, which spread across all four tiers.

A topic can be thin at either end, or empty at one. Eight topics finished with a
single SWE-1 question, and `weak-references`, `error-types` and `custom-errors`
finished with none, because nothing in them is asked of somebody two years in.
Report what the topic has rather than filling a tier to be even: a topic with no
SWE-1 question drops out of the SWE-1 topic list in task 13, which is the correct
outcome and not a gap.

## 10. Tag async and modules

`async-error-handling`, `abortcontroller`, `async-iteration`,
`es-modules-and-commonjs`, `module-resolution-and-side-effects`,
`what-a-bundler-changes`.

## 11. Tag the browser track

`the-dom`, `events-and-delegation`, `fetch-and-the-network`, `storage`.

## 12. Make `tier` required and delete `difficulty`

The schema demands a tier, `difficulty` goes from questions and from topic meta,
and the chip on a question shows the tier instead. Topic difficulty is deleted
rather than replaced, because a topic's tier is derived from its questions.

`docs/tasks/converting-a-topic.md` gains the rule for tagging a new question,
because Phase 4 authors against that brief and would otherwise write untiered
questions into a schema that now demands a tier.

**Decide before starting: what happens to exercise difficulty.** Exercises carry
a `difficulty` of their own, and decision `0028` speaks only about questions and
topic meta. Either exercises keep the old scale, and this task's wording narrows
to questions and topic meta, or they need a decision of their own first. Nothing
in tasks 9 through 11 depends on the answer.

Blocked by 9 through 11. Done when nothing in `content/` or `src/` mentions
difficulty except what the exercise decision above leaves in place, and the
check passes.

---

# Phase 3: the tier becomes the path

## 13. A tier per track, and enrolment that respects it

The picked tier is stored per user per track, because being SWE-2 in JavaScript
and SWE-1 in React is the ordinary state of a person. Marking a topic learned
enrols only the questions at or below the picked tier. The topic list shows only
the topics that have a question at that tier, so scope follows the questions
rather than a second list.

Blocked by 12. Done when picking SWE-1 on a track and marking a topic learned
puts SWE-1 questions on the ladder and nothing else, and the topic list changes
with the picker.

## 14. Readiness, and the offer to step up

Readiness is the share of the tier's questions whose schedule has reached step 3,
which is three correct answers spread over at least four days. Show the number,
show the count it is based on, and when a tier is fully ready, offer the next one
rather than advancing by itself.

Blocked by 13. Done when the dashboard says how ready you are for the tier you
picked, and a full tier offers the step up instead of taking it.

---

# Phase 4: SWE-1 and SWE-2 get enough questions to mean something

Four tiers across 43 topics is roughly two questions per tier per topic, which
carries no promise at all. Bring the tiers that matter to five or six questions
per topic, in the topics a real interview at these levels opens with. Senior and
Staff stay as they are.

Each task below is four topics, one branch, authored to
`docs/tasks/converting-a-topic.md`. All four are blocked by 12 and by nothing
else, so they can be taken in any order.

## 15. Fill the language fundamentals

`types-and-coercion`, `scope-and-hoisting`, `closures`, `this-binding`.

## 16. Fill values, functions and objects

`value-and-reference`, `array-methods`, `higher-order-functions`, `prototypes`.

## 17. Fill async

`event-loop`, `promises`, `async-error-handling`, `es-modules-and-commonjs`.

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

Blocked by 12, so they are written tier-aware from the start. Done when the three
pass the content check and read as lessons rather than lists of facts.

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
