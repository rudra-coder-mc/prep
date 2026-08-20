# Tasks

Pending work only. Delete an entry when it is done, since the history of what
was done lives in git and `docs/`.

The learn, recall and streak loop works. What follows turns it from a five
topic JavaScript demo into an interview preparation tool: a shell that is not
about one technology, questions that grade themselves, and a voice that
explains a topic instead of reading it out.

See `docs/decisions/0010-interview-prep-focus.md` for why it is shaped this way.

---

# Next

Ordered. Work top to bottom, one task per branch.

## 1. Spoken narration: the scripts and the topic reader

A lesson read verbatim sounds like a document being read, because it is one.
The narration is separate text, written the way you would explain the topic to
someone sitting in front of you: short sentences, no code read character by
character, signposting between sections.

Add `narration.ts` beside each lesson, as an ordered list of titled sections so
playback can move between them. A section is also the unit the engine speaks in
one request, so it has to fit inside the 3000 character cap that
`POST /api/speech` enforces. Then the player on the topic page: play, pause,
previous and next section, and speed from 1x to 2x, since past 2x it stops being
worth listening to.

Every existing topic needs a script written, and the count grows with every
content group shipped under task 3. A topic without one shows no player rather
than falling back to reading the prose.

Touches `content/javascript/*/narration.ts`, `src/content/schema.ts`, a new
player component, and the topic page.

Done when every topic in `content/` plays end to end, the section controls work,
speed persists across topics, and the content check rejects a narration script
whose sections are empty.

## 2. Spoken narration in the question session

The point of audio on questions is answering without reading. A play button on
a question reads the prompt and then each option in turn, so an MCQ can be
answered by ear.

The engine and its endpoint already exist; this is the question session calling
them. Nothing here waits on the narration scripts, since a question carries its
own words.

Touches `question-session.tsx` and the speech library.

Done when playing an MCQ reads the prompt and all four options in order, and
moving to the next question stops the previous audio rather than overlapping it.

## 3. The JavaScript interview surface

The goal is that anything reasonably asked in a JavaScript interview has a
topic, and that each topic carries the full question mix.

This is content work, not platform work, and it is far too big for one branch,
so it is broken into groups of three or four related topics. **One group is one
task and one branch.** They are listed in a deliberate order - each group leans
on the ones above it - but a group can be pulled forward if an interview is
coming and it is the gap that matters.

The conventions the first group established, so the rest stay consistent:

- `order` runs in tens, in teaching order across the whole track, leaving room
  to insert. Renumber the ones below rather than squeezing a topic in at 45.
- Every topic ships a lesson with at least one visual, ten or eleven questions
  spanning concept, output, debugging, coding, scenario, interview and three
  or four multiple choice, and two exercises.
- Output questions carry `expectedOutput` so they grade themselves, unless the
  answer is genuinely prose, in which case they carry `expectedAnswer`.
- The correct multiple choice option is not always first.

Done when every group below has shipped. Each group is done when its topics
pass the content check and read as one lesson each, not as a list of facts.

### Group 2: functions

Parameters and arguments, higher order functions, currying and partial
application, recursion and the call stack.

### Group 3: objects

Property descriptors with getters and setters, destructuring, optional chaining
and nullish handling, JSON serialisation and its edges.

### Group 4: collections and iteration

The array methods worth knowing cold, the iterable protocol, generators,
`Map`, `Set` and their weak counterparts.

### Group 5: classes

Class syntax and fields, `extends` and `super`, static and private members,
composition against inheritance.

### Group 6: async in practice

Promise combinators, error handling across async boundaries, cancellation with
`AbortController`, async iteration.

Sits after the existing event loop and promises topics rather than replacing
them: those two explain the model, this group is what you do with it.

### Group 7: modules and the runtime

ES modules against CommonJS, resolution and side effects, strict mode and
`globalThis`, what a bundler changes.

### Group 8: errors

The built-in error types, custom errors, `try`/`catch`/`finally` semantics
including the return value trap, and errors that cross an async boundary.

### Group 9: memory and performance

Garbage collection and the shapes of a leak, `WeakMap` and `WeakRef`, debounce
and throttle, the real cost of common collection operations.

### Group 10: the browser surface

The DOM, events and delegation, `fetch` and the network, storage.

Decide first whether this is JavaScript or its own track. It is the only group
that is not about the language, and everything in it belongs equally to a
future React track.

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

Adding a technology is a content directory, not a platform change. Only runners
cost anything.

## Remove `shiki`

Listed as a dependency and imported nowhere. Either use it for lesson code
blocks, which currently render unhighlighted, or drop it.
