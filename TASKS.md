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

## 1. Spoken narration in the question session

The point of audio on questions is answering without reading. A play button on
a question reads the prompt and then each option in turn, so an MCQ can be
answered by ear.

The engine, the endpoint and a working player all exist; this is the question
session calling them. Nothing here waits on the narration scripts, since a
question carries its own words. Reuse `fetchNarrationAudio` and the one element
per player rule from `src/components/speech/`, rather than writing a second way
to play audio.

Touches `question-session.tsx` and `src/components/speech/`.

Done when playing an MCQ reads the prompt and all four options in order, and
moving to the next question stops the previous audio rather than overlapping it.

## 2. Everything a JavaScript interview asks

The goal is that anything reasonably asked in a JavaScript interview has a
topic, and that each topic carries the full question mix.

This is content work, not platform work, and it is far too big for one branch,
so it is broken into groups of three or four related topics. **One group is one
task and one branch.** They are listed in a deliberate order, since each group
leans on the ones above it, but a group can be pulled forward if an interview is
coming and it is the gap that matters.

A group is a unit of work, not a block of the syllabus. Its topics take whatever
positions in the teaching order they belong in, which can mean splitting the
group across the track and renumbering what is already there. The functions
group did exactly that. See
`docs/decisions/0019-a-group-is-a-branch-not-a-block-of-the-track.md`.

The conventions the first group established, so the rest stay consistent:

- `order` runs in tens, in teaching order across the whole track, leaving room
  to insert. Renumber the ones below rather than squeezing a topic in at 45.
- Every topic ships a lesson with at least one visual, ten or eleven questions
  spanning concept, output, debugging, coding, scenario, interview and three
  or four multiple choice, and two exercises.
- Every topic ships a `narration.ts` as well, in sections that follow the
  lesson's own headings. Written to be heard, not read: no code spoken
  character by character, and a section short enough to be one thought. Each
  section carries the `heading` it covers, written exactly as the lesson writes
  it, which is what makes the lesson follow the voice. See
  `docs/decisions/0016-narration-is-written-not-read.md` and
  `docs/decisions/0018-the-lesson-follows-the-voice.md`.
- Output questions carry `expectedOutput` so they grade themselves, unless the
  answer is genuinely prose, in which case they carry `expectedAnswer`.
- The correct multiple choice option is not always first.

Done when every group below has shipped. Each group is done when its topics
pass the content check and read as one lesson each, not as a list of facts.

### Objects

Property descriptors with getters and setters, destructuring, optional chaining
and nullish handling, JSON serialisation and its edges.

### Collections and iteration

The array methods worth knowing cold, the iterable protocol, generators,
`Map`, `Set` and their weak counterparts.

### Classes

Class syntax and fields, `extends` and `super`, static and private members,
composition against inheritance.

### Async in practice

Promise combinators, error handling across async boundaries, cancellation with
`AbortController`, async iteration.

Sits after the existing event loop and promises topics rather than replacing
them: those two explain the model, this group is what you do with it.

### Modules and the runtime

ES modules against CommonJS, resolution and side effects, strict mode and
`globalThis`, what a bundler changes.

### Errors

The built-in error types, custom errors, `try`/`catch`/`finally` semantics
including the return value trap, and errors that cross an async boundary.

### Memory and performance

Garbage collection and the shapes of a leak, `WeakMap` and `WeakRef`, debounce
and throttle, the real cost of common collection operations.

### The browser, not the language

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
