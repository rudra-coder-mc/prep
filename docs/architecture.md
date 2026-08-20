# Architecture

## What this system is

A single-user, self-hosted learning platform built around one loop:

```
Read topic  ->  Mark learned  ->  Recall questions on a schedule
     ^                                        |
     |                                        v
  Review  <-  Weak topics surface  <-  Self-evaluate + confidence
```

The topic page is the centrepiece, not the question bank. Marking a topic as
learned is the act that enrols its questions into the recall schedule. Everything
else is derived from attempts against those questions: the daily queue, the
streak, the weak-topic list, the dashboard.

## Shape

One Next.js application (App Router) talking to one Postgres database. No
separate API service. Server Components read data directly, Server Actions write
it. For a single-user tool, a network hop between a frontend and a backend we
also own buys nothing and costs two deployments.

The one exception is speech. Turning a narration script into audio is not
something a Next.js process can do, so it is a third container, and the only one
in the stack that exists because of what it can do rather than what it stores.

```
                docker compose up
                        |
        +---------------+---------------+
        |                               |
   app container                  postgres container
   Next.js (standalone)           named volume: pgdata
   better-auth                    healthcheck gates
   drizzle-orm                    app start
        |
   content/ baked into the image at build time
        |
   reads ./.speech-cache, mounted at /cache/speech


                npm run narration:build
                        |
                   tts container          starts, records what has no
                   Piper + HTTP server    recording yet, and stops again
                   voice model baked in   writes ./.speech-cache
```

One directory holds every recording, and the app mounts it rather than keeping a
copy. See `docs/decisions/0022-one-place-for-recordings.md`.

## The two halves: content and progress

This is the most important boundary in the system.

**Content lives in git.** Topics, lessons, questions and exercises are files
under `content/`. They are authored in an editor, reviewed in diffs, and compiled
into the application at build time. They are never rows in a table.

**Progress lives in Postgres.** Who you are, what you answered, how confident you
felt, when a question is next due, what you did each day.

The two are joined by string slugs, not foreign keys. `topic_progress.topicSlug`
holds `"javascript/closures"`; nothing in the database enforces that this topic
exists. That is deliberate. It means adding, renaming or reorganising the
curriculum is a content change, never a migration. The cost is that deleting
content orphans rows; a maintenance task reconciles them, and orphaned rows are
harmless in the meantime.

### Content layout

```
content/javascript/closures/
  lesson.mdx        the explanation, importing visual components inline
  narration.ts      the spoken script, in titled sections, each naming the
                    lesson heading it covers. Optional
  questions.ts      typed question objects for this topic
  exercises.ts      practical exercises, solved locally in VS Code
  meta.ts           slug, title, order, difficulty, tags, prerequisites
```

A topic is a directory. Adding one means adding a directory. No registry to
update by hand, no seed script to rerun. The loader walks `content/` at build
time and validates every file against a Zod schema, so a malformed question
fails the build rather than the session.

## The interface

Everything behind auth lives in the `(app)` route group, whose layout renders
the top bar. The bar is the only navigation: brand, the mode switch, Dashboard,
Topics, Review with a due-count badge, the streak, and sign out. It never
unmounts, so moving around replaces content and nothing else.

The mode switch picks between interview preparation and learning. Which mode is
active is derived from the pathname rather than stored, so it survives a reload,
cannot disagree with the page under it, and needs no state. Learning is a
placeholder page, and the interview navigation is hidden while it is open
because none of it applies there.

```
src/app/
  (app)/                  the signed-in shell: top bar, progress bar
    page.tsx              dashboard
    topics/               list, then [technology]/[topic]/ with its own layout
    review/               the daily queue
    learn/                the declared, unbuilt learning mode
  login/                  outside the shell, no chrome
  not-found.tsx

src/components/
  chrome/                 top bar, links, breadcrumb and tabs, route progress
  ui/                     Button, Card, ProgressBar, StatusBadge, Skeleton, PageShell
  motion/                 the Rise entrance and the reduced-motion hook
  visuals/                the lesson animation library

src/actions/              server actions, outside the routing tree
```

A topic's lesson, questions and exercises share a layout, so the breadcrumb and
the tabs stay fixed while the view under them changes. Internal links route
through `AppLink`, which feeds Next's per-link pending state into the global
progress bar, and every route has a `loading.tsx` skeleton, so a slow page shows
its frame rather than nothing.

No page names a technology. The dashboard aggregates every topic under
`content/` and lists tracks as data, and the topic list groups by technology, so
adding a track stays what it is at the data layer: adding a directory.
`src/content/technologies.ts` holds the display spellings and title-cases
anything it has not been told about, so a new track is readable before anyone
names it. See `docs/decisions/0010-interview-prep-focus.md`.

Motion is one primitive (`<Rise>`) with shared easing, and every animated
component checks `prefers-reduced-motion` before it moves. See
`docs/decisions/0009-app-shell-and-motion.md`.

The lesson visuals are a second, heavier motion system with the same rule. Each
one is a list of steps, and `src/components/visuals/flow.tsx` holds the shared
vocabulary they animate with: a token that keeps its identity as it moves
between regions, a region that lights up when the loop is working on it, an
output log and a caption. Visuals play themselves the first time they are
scrolled into view. Each lesson closes with a `<ConceptMap>`, the same player
arranged as a mind map of the topic. See
`docs/decisions/0013-visuals-animate-transitions.md` and
`docs/decisions/0014-concept-map-recap.md`.

## The visual layer

Animation is the expensive part of this project, so it is built as a finite,
reusable library rather than per-topic one-offs:

| Component           | Shows                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `<CodeWalkthrough>` | Generic line-by-line player with variable state. Carries most topics. |
| `<CallStack>`       | Frames pushing and popping.                                           |
| `<EventLoop>`       | Call stack, microtask queue, macrotask queue, render step.            |
| `<MemoryModel>`     | Stack vs heap, references, mutation and copying.                      |
| `<ScopeChain>`      | Nested environments and identifier resolution.                        |
| `<PrototypeChain>`  | `__proto__` links and property lookup.                                |
| `<PromiseTimeline>` | Pending, settlement, and resolution order over time.                  |

All are data-driven: a lesson passes a description of the steps, not imperative
animation code. Building these against the five hardest topics first is
intentional. If the primitives survive closures, the event loop, `this`,
prototypes and promises, the remaining topics are authoring work rather than
engineering work.

## Data model

Six tables. Deliberately small.

| Table               | Holds                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| `users`             | Identity. Managed by better-auth, which also owns its session tables.                 |
| `topic_progress`    | Per user per topic: status, when learned, when last reviewed.                         |
| `attempts`          | Full history. Never overwritten, since every attempt is a new row.                    |
| `review_schedule`   | Per user per question: when it is next due, and where it sits on the interval ladder. |
| `exercise_progress` | Practical exercises: status, notes, completion.                                       |
| `daily_activity`    | One row per user per day: how much was reviewed, whether the queue was cleared.       |

Two things are computed rather than stored:

- **Topic status** (`not_started` / `learning` / `weak` / `understood` /
  `mastered`) is derived from recent attempts, not written to a column. A
  scoring change is then a code change, not a backfill.
- **The streak** is derived from `daily_activity`. A stored counter can drift
  out of sync with what actually happened; a derived one cannot.

A "day" is a calendar day in one configured timezone, `APP_TIMEZONE`, rather than
the device's. Travelling must not shift when a streak rolls over, and two devices
must agree on what today is.

## Recall scheduling

Confidence drives the next interval:

| Confidence                  | Next due    |
| --------------------------- | ----------- |
| 1, don't understand it      | later today |
| 2, partly understand it     | 1 day       |
| 3, can explain with help    | 3 days      |
| 4, understand it            | 7 days      |
| 5, can explain and apply it | 14 days     |

A `failed` result resets to the bottom of the ladder regardless of confidence.
The daily queue is capped so it is never a wall, and fills in priority order:
overdue, then due today, then weakest topics.

This is intentionally not SM-2. It is predictable, explainable when it
misbehaves, and stores an interval _step_ rather than a computed date delta, so
replacing it with real spaced repetition later needs no schema change.

## Evaluation

Which mechanism a question uses depends on whether its answer is exact.

**Written questions are self-evaluated.** You type an answer, reveal the
expected one, then mark Pass / Weak / Failed and rate confidence 1-5. Free-text
answers are stored so you can see how your own explanations changed over time.
There is no auto-grading and no AI tutor here. Grading free-text technical
answers reliably is harder than everything else combined, and the honest
self-assessment that active recall depends on does not need a machine.

**Multiple choice questions grade themselves.** There is nothing to assess when
there is one right answer, and the ceremony of revealing and self-grading is
what makes drilling slow. Choosing an option submits it; the server grades it,
records the attempt and returns the explanation in one round trip. The correct
option is never sent to the browser beforehand, exactly as an expected answer is
not. A correct answer records a fixed confidence of 3 rather than asking, since
recognising an answer is weaker evidence than recalling it. See
`docs/decisions/0011-multiple-choice-grades-itself.md`.

**Output questions are checked against what the program prints.** An `output`
question carrying an `expectedOutput` is compared to the typed answer after
normalising the things that are not the answer: indentation, runs of spaces,
line endings and which quote character was used. Case is left alone, because
JavaScript is case-sensitive. A correct answer records a fixed confidence of 4,
above a recognised answer and below explaining the thing. An `output` question
with an `expectedAnswer` instead is still graded by eye, so the two never
disagree about which value is authoritative.

This is string comparison against an authored value, not code execution.
Running the code is planned separately as browser-side WASM runners, in
`docs/decisions/0007-execution-runners.md`.

All three forms write the same `attempts` row, so the ladder, the streak and the
dashboard did not change to accommodate any of them.

## Narration

A topic can be listened to rather than read. The voice is Piper, a neural text to
speech engine in the `tts` container with its voice model baked into the image,
so narration works offline and no lesson text leaves the machine.

That container is behind a compose profile and is off almost all the time. It is
a tool the author runs, not a service the reader depends on: recordings are made
ahead of time and served from a volume, so listening never touches it. See
`docs/decisions/0020-the-speech-engine-runs-on-demand.md`.

`src/lib/speech/` is the whole engine, and it has two entry points. Audio is
cached by content, since the file's name is a hash of the script, so a script is
synthesised once and read from a volume every time after. Editing a script is
therefore a new recording rather than a stale one, and the old entry is orphaned
rather than served.

**`npm run narration:build` makes the recordings, and `GET /api/speech/<key>`
plays them.** The scripts are static text in git, so nothing is synthesised while
a listener waits. The build walks every topic, synthesises what has no recording
yet, and skips what has. The key is the hash of the words, so the bytes behind one
can never change and the browser is told to keep it forever. The topic page
computes each section's key on the server and hands it to the player.

**`POST /api/speech` is the fallback for a script with no recording.** A script
in, a WAV out, synthesised and cached. The player asks for the built recording
first and comes here when there isn't one. With the engine off, that request
answers 502 naming `npm run narration:build`, which is the honest answer: the
section has not been recorded, and recording it is a command rather than
something to wait for. Start the container by hand and the fallback works as it
always did, which is what makes editing a script and pressing play immediately
possible while authoring.

Synthesis costs about a second of CPU for three and a half seconds of speech, so
a request carries one section of a narration rather than a whole one, and a
script over 3000 characters is refused rather than left to hang. Nothing about
the audio gates the application starting, and with the engine out of the default
stack there is nothing left to gate it: the app waits on the database and on
nothing else.

**A question is spoken from its own words.** Lessons carry a hand-written script
and questions do not, because a prompt is already a sentence somebody asks out
loud. `src/lib/speech/spoken-question.ts` builds two scripts per question, one of
the prompt and its options and one of the answer and its explanation, and both
are recorded by the same build. Code is not read: a paragraph containing an
indented line is dropped and the script says it is on screen instead. The
answer's key comes back with the reveal rather than with the question, for the
same reason the answer does. See
`docs/decisions/0021-questions-are-spoken-from-built-audio.md`.

**What a lesson says is separate text.** A lesson read verbatim sounds like a
document being read, because it is one: code blocks become punctuation, tables become
fragments, and figures mean nothing. So a topic may carry a `narration.ts` beside
its lesson, an ordered list of titled sections written to be heard. A topic
without one shows no player rather than falling back to the prose, and the
content check names the topics that have no script.

`src/components/speech/` is the player. One audio element whose source is
swapped per section, because playback permission belongs to the element and a
new one created mid-narration would be refused. It plays a topic end to end from
one press, fetches the next section while the current one plays, and remembers
the chosen speed across topics.

**The lesson follows it.** Every narration section names the lesson heading it
covers, so while a topic is being listened to the page lights up that part of the
lesson, dims the rest, and scrolls to each section as the voice reaches it. The
controls follow too. Once the card at the top has scrolled away, the same player
reappears as a bar at the bottom of the screen. None of this happens for a reader
who has not pressed play. One `NarrationProvider` drives all three, because two
audio elements would be two voices. See
`docs/decisions/0015-piper-narration-engine.md` for the engine,
`docs/decisions/0016-narration-is-written-not-read.md` for the script and the
player, `docs/decisions/0017-narration-is-built-once.md` for why the audio is
made ahead of time, and `docs/decisions/0018-the-lesson-follows-the-voice.md` for
how a section of speech finds its section of lesson.

## Not in V1

AI tutoring, multi-user support, social login, mobile, gamification beyond the
streak, SM-2, and any service beyond the three containers. The schema is
multi-user-shaped (`userId` on every progress row) so that adding users later is
an auth change, not a data migration. Nothing else anticipates features that do
not exist yet.

Code execution is also out of V1, but unlike the above it is planned, and the
shape of the plan constrains V1. Runnable tasks arrive later as browser-side WASM
runners: PGlite for Postgres, QuickJS for JavaScript, `mingo` for Mongo. Tracks
that need a real process get a local CLI instead, which runs the exercise's test
suite on the user's own machine and posts a structured verdict back. Both write
the same `attempts` row the web interface writes, so neither needs a new progress
model.
That is only true because content is files and attempts are generic, which is the
main thing V1 has to get right. See `docs/decisions/0007-execution-runners.md` and
`docs/decisions/0008-local-cli-verification.md`.
