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

## 1. Spoken narration: choosing and wiring the engine

Every topic gets a button that explains it aloud. The voice has to be good
enough to listen to for ten minutes, and this is a local only project, so the
engine choice is the real decision and it is not yet made.

The leading option is Piper running as a third container, synthesising each
narration script once and caching the audio in a volume, which keeps everything
offline and sounds markedly better than the browser. The browser's own
`speechSynthesis` needs no infrastructure at all but its quality depends on
whatever voices the machine happens to have. A cloud API sounds best and is the
only option that sends lesson text off the machine.

Pick one, write the ADR, and ship the smallest thing that speaks: one endpoint
that turns a script into audio, with a cache, and nothing in the interface yet.

Touches `compose.yaml`, a new `src/lib/speech/`, and `docs/decisions/`.

Done when a narration script can be turned into playable audio on a clean
checkout with no manual setup step, the second request for the same script is
served from cache, and the choice is written down with its alternatives.

## 2. Spoken narration: the scripts and the topic reader

A lesson read verbatim sounds like a document being read, because it is one.
The narration is separate text, written the way you would explain the topic to
someone sitting in front of you: short sentences, no code read character by
character, signposting between sections.

Add `narration.ts` beside each lesson, as an ordered list of titled sections so
playback can move between them. Then the player on the topic page: play, pause,
previous and next section, and speed from 1x to 2x, since past 2x it stops being
worth listening to.

The five existing topics need scripts written. A topic without one shows no
player rather than falling back to reading the prose.

Touches `content/javascript/*/narration.ts`, `src/content/schema.ts`, a new
player component, and the topic page.

Done when all five topics play end to end, the section controls work, speed
persists across topics, and the content check rejects a narration script whose
sections are empty.

## 3. Spoken narration in the question session

The point of audio on questions is answering without reading. A play button on
a question reads the prompt and then each option in turn, so an MCQ can be
answered by ear.

Depends on 1.

Touches `question-session.tsx` and the speech library.

Done when playing an MCQ reads the prompt and all four options in order, and
moving to the next question stops the previous audio rather than overlapping it.

## 4. The JavaScript interview surface

Five topics is not interview coverage. The goal is that anything reasonably
asked in a JavaScript interview has a topic, and that each topic carries both
question forms.

This is content work, not platform work, and it is far too big for one branch.
Break it into groups of three or four related topics, each its own task, and
write the list of groups before starting the first one.

Done when the list of groups exists in this file and the first group ships.

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
