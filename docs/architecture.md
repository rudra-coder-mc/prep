# Architecture

## What this system is

A single-user, self-hosted learning platform built around one loop:

```
Read topic  ->  Mark learned  ->  Recall questions on a schedule
     ^                                        |
     |                                        v
  Review  <-  Weak topics surface  <-  Answer + verdict
```

The topic page is the centrepiece, not the question bank. Marking a topic as
learned is the act that enrols its questions into the recall schedule. Everything
else is derived from attempts against those questions: the daily queue, the
streak, the weak-topic list, the dashboard.

## Shape

The repository is an npm workspace: `apps/web`, `apps/mobile`, and the
`packages/core` and `packages/content` that both of them read. The web half is
one Next.js application (App Router) talking to one Postgres database. No
separate API service. Server Components read data directly, Server Actions write
it. For a single-user tool, a network hop between a frontend and a backend we
also own buys nothing and costs two deployments.

```
packages/core/       the interval ladder, tiers, readiness, the daily queue,
                     grading and the content schema. Pure, and shared by both
                     clients so neither can disagree about what is due.
packages/content/    the curriculum itself, its loader and its validator.
apps/web/            the Next application: Postgres, better-auth and the DOM.
apps/mobile/         the Expo app.
```

Database access is written twice, once against Postgres and once against SQLite
on the device. Only the logic is shared. See
`docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md`.

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
   the curriculum baked into the image at build time
        |
   reads and writes ./.speech-cache, mounted at /cache/speech
        |
        | synthesises what the cache has no answer for
        v
   tts container            behind the `speech` profile: on wherever the
   Piper + HTTP server      platform is served, started by the commands
   voice model baked in     that need it anywhere else
```

One directory holds every recording, and the app mounts it rather than keeping a
copy. See `docs/decisions/0022-one-place-for-recordings.md`.

## The two halves: content and progress

This is the most important boundary in the system.

**Content lives in git.** Topics, lessons, questions and exercises are files
under `content/`. They are authored in an editor, reviewed in diffs, and compiled
into the application at build time. They are never rows in a table.

**Progress lives in Postgres.** Who you are, what you answered, what each answer
was worth as evidence, when a question is next due, what you did each day.

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
  meta.ts           slug, title, order, tags, prerequisites
```

A topic is a directory. Adding one means adding a directory. No registry to
update by hand, no seed script to rerun. The loader walks the curriculum at build
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
apps/web/src/app/
  (app)/                  the signed-in shell: top bar, progress bar
    page.tsx              dashboard
    topics/               list, then [technology]/[topic]/ with its own layout
    review/               the daily queue
    learn/                the declared, unbuilt learning mode
  login/                  outside the shell, no chrome
  not-found.tsx

apps/web/src/components/
  chrome/                 top bar, links, breadcrumb and tabs, route progress
  ui/                     Button, Card, ProgressBar, StatusBadge, Skeleton, PageShell
  motion/                 the Rise entrance and the reduced-motion hook
  visuals/                the lesson animation library

apps/web/src/actions/     server actions, outside the routing tree
```

A topic's lesson, questions and exercises share a layout, so the breadcrumb and
the tabs stay fixed while the view under them changes. Internal links route
through `AppLink`, which feeds Next's per-link pending state into the global
progress bar, and every route has a `loading.tsx` skeleton, so a slow page shows
its frame rather than nothing.

No page names a technology. The dashboard aggregates every topic in
`packages/content/` and lists tracks as data, and the topic list groups by technology, so
adding a track stays what it is at the data layer: adding a directory.
`packages/core/src/technologies.ts` holds the display spellings and title-cases
anything it has not been told about, so a new track is readable before anyone
names it. The browser track was the first to exercise that: four directories,
and no change anywhere in `apps/web/`. A topic's prerequisites carry the technology
in them, so they can point across a track boundary, and nothing checks that the
topic on the other end exists. See `docs/decisions/0010-interview-prep-focus.md`
and `docs/decisions/0027-the-browser-is-its-own-track.md`.

Motion is one primitive (`<Rise>`) with shared easing, and every animated
component checks `prefers-reduced-motion` before it moves. See
`docs/decisions/0009-app-shell-and-motion.md`.

The lesson visuals are a second, heavier motion system with the same rule. Each
one is a list of steps, and `apps/web/src/components/visuals/flow.tsx` holds the shared
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

Eight tables. Deliberately small.

| Table               | Holds                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| `users`             | Identity. Managed by better-auth, which also owns its session tables.                 |
| `track_tier`        | Per user per track: the tier being prepared for. No row means SWE-1.                  |
| `topic_progress`    | Per user per topic: status, when learned, when last reviewed.                         |
| `attempts`          | Full history. Never overwritten, since every attempt is a new row.                    |
| `review_schedule`   | Per user per question: when it is next due, and where it sits on the interval ladder. |
| `exercise_progress` | Practical exercises: status, notes, completion.                                       |
| `daily_activity`    | One row per user per day: how much was reviewed, whether the queue was cleared.       |
| `device_sync`       | One row per device: its name, and when it last synced. Feeds the sync reminder.       |

Two things are computed rather than stored:

- **Topic status** (`not_started` / `learning` / `weak` / `understood` /
  `mastered`) is derived from recent attempts, not written to a column. A
  scoring change is then a code change, not a backfill. It is measured against
  the questions the track's tier covers, so an attempt above the pick counts
  toward nothing.
- **The streak** is derived from `daily_activity`. A stored counter can drift
  out of sync with what actually happened; a derived one cannot.

A "day" is a calendar day in one configured timezone, `APP_TIMEZONE`, rather than
the device's. Travelling must not shift when a streak rolls over, and two devices
must agree on what today is.

## The tier, and what it decides

A question carries a tier, one of `swe-1`, `swe-2`, `senior` or `staff`, named
after the level of interview that asks it. A topic carries none: it belongs to a
tier when it has a question at that tier, so what somebody sees follows from the
questions rather than from a second list to keep in step with them.

The tier is picked per track and stored, because being SWE-2 in JavaScript and
SWE-1 in React is ordinary. Tiers are cumulative, so a pick covers the tier and
everything below it, and a track nobody has picked on is on SWE-1.

The pick decides two things and nothing else. **Marking a topic learned enrols
only the questions the pick covers**, so the daily queue never asks a staff
question of somebody preparing for the screen. **The topic list is the topics the
pick covers**, with the rest collapsed under the track as asked above it, since a
lesson is not tiered and hiding one would put part of a track out of reach.

Changing the pick brings every topic already marked learned in that track up to
it: the newly covered questions arrive at the bottom of the ladder and nothing in
rotation moves. Going back down enrols nothing and unenrols nothing, because a
question on the ladder is progress somebody made. `packages/core/src/tiers.ts` holds
what a pick covers, `apps/web/src/lib/track-tier.ts` stores it, and
`apps/web/src/lib/progress.ts` is the
only place that enrols. See
`docs/decisions/0028-tiers-are-interview-levels.md` and
`docs/decisions/0031-a-track-remembers-the-tier-you-picked.md`.

### Readiness

Readiness is what makes the promise checkable, and it is the dashboard's headline
for each track. A question counts once its schedule reaches step 3 of the
interval ladder, which is three correct answers spread over at least four days
for a graded form. The share is taken over every question the tier covers on that
track, including the ones in topics nobody has opened, because an interview does
not restrict itself to what somebody chose to enrol. The count is always shown
beside the share, since senior and staff are thin on purpose.

A track at full readiness offers the tier above it and says how many questions
accepting enrols. Nothing advances by itself. `packages/core/src/readiness.ts` is
the calculation, `getDashboard` feeds it the ladder, and
`apps/web/src/components/step-up.tsx`
is the offer. See
`docs/decisions/0032-readiness-is-measured-over-the-whole-tier.md`.

## Recall scheduling

The ladder has five rungs: later today, then 1, 3, 7 and 14 days. On a graded
form, a correct answer climbs one rung from wherever the question sits, and any
wrong answer drops it to the bottom, however far it had climbed. The reset is
what stands in for the guess a choice question cannot rule out.

An open question is placed by its self grade rather than moved: Passed lands on
the top rung, Weak at three days, Failed at the bottom. A Weak on a question
answered correctly four times is real information, and it should pull the
question back down.

Nobody rates their own confidence. `packages/core/src/interval-ladder.ts` derives one from
the form and the verdict, 3 for a correct choice, 4 for a correct ordering, the
self grade's worth on an open question, and records it on the attempt so the
history says what kind of evidence each answer was. On a graded form that is all
the number does; capping the rung with it would keep a well-known question in
the queue forever. See
`docs/decisions/0025-confidence-is-derived-and-the-ladder-climbs.md`.

The daily queue is capped so it is never a wall, and fills in priority order:
overdue, then due today, then weakest topics.

This is intentionally not SM-2. It is predictable, explainable when it
misbehaves, and stores an interval _step_ rather than a computed date delta, so
replacing it with real spaced repetition later needs no schema change.

## Evaluation

No question takes typed input. An answer nobody grades is a self grade with
extra steps, and an exact string comparison fails over quote characters rather
than over the answer. A question's `form` says how it is answered, its `type`
says what it is about, and the two are separate axes, so an `output` question
can be a choice question or an ordering one. Every question carries
`answerInFull`, the paragraph you would say if an interviewer asked, shown once
the question is answered, whatever the form. See
`docs/decisions/0023-every-question-is-answered-never-typed.md`.

**`choice` questions grade themselves.** Choosing an option submits it; the
server grades it in `packages/core/src/choice.ts`, records the attempt and returns the
answer in full in one round trip. The correct option never reaches the browser
before an answer arrives. There is no half-right option, so the ladder only ever
sees a pass or a reset. Anything that can be asked this way is asked this way.
See `docs/decisions/0011-multiple-choice-grades-itself.md`.

**`ordering` questions are answered by building the sequence a program prints.**
The pool holds lines the program never prints as well as the ones it does, so
the answer is a selection as much as an arrangement. The page submits positions,
because a program can print the same line twice, and `packages/core/src/ordering.ts`
compares the text at those positions. A sequence is right or it is not: scoring
a nearly-right one needs a threshold, and every threshold is arbitrary. See
`docs/decisions/0024-ordering-questions-carry-distractors.md`.

**`open` questions are the one place a grade is still a judgement.** Nothing is
submitted. Answer in your head or out loud, reveal the answer in full, and mark
yourself Passed, Weak or Failed against it. The form exists for the question
with several valid routes to a good answer, where four options would destroy the
point of asking, so the content check allows it only on `interview` and
`scenario` questions and caps it at one per topic. The answer in full is written
as what you had to have said, which makes the self grade a comparison rather
than a feeling.

All three forms write the same `attempts` row, so the ladder, the streak and the
dashboard did not change to accommodate any of them. What each kind of answer is
worth as evidence is the schedule's business; see Recall scheduling above.

## Narration

A topic can be listened to rather than read. The voice is Piper, a neural text to
speech engine in the `tts` container with its voice model baked into the image,
so narration works offline and no lesson text leaves the machine. The container
runs `services/tts/server.py` rather than Piper's own HTTP server, because Piper
only writes WAV and a recording is stored compressed. Synthesising and encoding
in the same place is what keeps the encoder out of the app image.

That container is behind a compose profile, and the machine that serves the
platform turns the profile on. It is a service the reader depends on there, not a
tool the author runs: audio is made the first time somebody asks for it, so a
play button only works if the voice is up. A laptop still starts the app and the
database alone. See
`docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md`.

`apps/web/src/lib/speech/` is the whole engine. Audio is cached by content, since the
file's name is a hash of the script, so a script is synthesised once and read
from disk every time after. Recordings are stored as Opus rather than as the WAV
Piper produces, which is what makes a whole track something a phone can hold.
See `docs/decisions/0036-recordings-are-stored-compressed.md`. Editing a script
is therefore a new recording rather than a stale one, and the old entry is
orphaned rather than served.

Three commands act on the cache from outside, and nothing in the application
depends on any of them. `npm run narration:build -- javascript` records a whole
track before anybody asks, and takes one topic instead when it is given one. A
track is the unit because a track is what a device downloads before a journey,
and a topic is what somebody records after editing one lesson. It surveys the
cache before it starts and reads it again when it finishes, so whether a track
is fully recorded is something the filesystem answers rather than something the
run claims. `npm run
speech:prune` deletes every recording no current script hashes to, which is what
stops the orphans accumulating. `npm run speech:transcode` converts a cache made
before recordings were compressed, and is a migration rather than a routine: run
prune first, or the engine is spent on recordings nothing points at. None is a
build step, and a deploy carries no recordings: the cache is a cache, so losing
it costs latency rather than correctness.

**`GET /api/speech/<key>` plays a recording, and makes it first if nobody has
asked for those words before.** A key with a file behind it is a read. A key with
nothing behind it is resolved against `content/` by
`apps/web/src/lib/speech/spoken-content.ts`, which addresses every narration
section and
every question script the same way the cache does, and only a key that no script
hashes to is a 404. Either way the reply is immutable for a year, because the key
is the hash of the words and the bytes behind one can never change.

That resolution on the server is what lets a page send a key and never a script.
It matters most for a question: the answer's script would give the answer away,
so it cannot travel with the question and cannot be posted back to be
synthesised. The page computes the key, the browser plays it, and the words stay
here.

**`POST /api/speech/warm` makes a recording ahead of the listener and sends none
of it back.** Synthesis is 25 to 60 seconds for a section, so the wait is spent
where nobody is watching a button: opening a topic warms its first section, and
showing a question warms its answer. The reply is a 204. A section is named by
its key, `{ "narration": "<key>" }`, and an answer by its question,
`{ "answer": { "topic": "...", "question": "..." } }`, because the answer's key
is not allowed on the page until the answer has been given. Both are fire and
forget: a warm that fails costs a recording made later, and whoever presses play
is told properly. One recording is warmed at a time and only the newest request
waits for a turn, because Piper saturates the machine and speculative work must
never be in a reader's way. See
`docs/decisions/0030-warming-makes-a-recording-without-sending-it.md`.

**`POST /api/speech` is the engine's own door**, a script in and a recording
out. No
page uses it. It exists so the speech specs can put arbitrary words through the
engine without borrowing a lesson's, and so a script that `content/` does not own
can still be spoken.

Synthesis costs about a second of CPU for three and a half seconds of speech, so
a request carries one section of a narration rather than a whole one, and a
script over 3000 characters is refused rather than left to hang. Two requests for
the same key arriving together join one piece of work rather than doing it twice.
Nothing about the audio gates the application starting: the app waits on the
database and on nothing else, and a request that lands before the voice model has
loaded says the voice is unavailable.

**A question is spoken from its own words.** Lessons carry a hand-written script
and questions do not, because a prompt is already a sentence somebody asks out
loud. `apps/web/src/lib/speech/spoken-question.ts` builds two scripts per question,
one of
the prompt and its options and one of the answer and its explanation, and each is
recorded the first time it is played. Code is not read: a paragraph containing an
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

`apps/web/src/components/speech/` is the player. One audio element whose source is
swapped per section, because playback permission belongs to the element and a
new one created mid-narration would be refused. It plays a topic end to end from
one press, fetches the next section while the current one plays, and remembers
the chosen speed across topics. Fetching ahead is only for the section after the
one playing, where the listener is known to be listening; everything else is
warmed rather than downloaded.

**The lesson follows it.** Every narration section names the lesson heading it
covers, so while a topic is being listened to the page lights up that part of the
lesson, dims the rest, and scrolls to each section as the voice reaches it. The
controls follow too. Once the card at the top has scrolled away, the same player
reappears as a bar at the bottom of the screen. None of this happens for a reader
who has not pressed play. One `NarrationProvider` drives all three, because two
audio elements would be two voices. See
`docs/decisions/0015-piper-narration-engine.md` for the engine,
`docs/decisions/0016-narration-is-written-not-read.md` for the script and the
player, `docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md` for
when the audio is made, and `docs/decisions/0018-the-lesson-follows-the-voice.md`
for how a section of speech finds its section of lesson.

## The mobile client

`apps/mobile` is an Expo app for Android, and it is offline first: it holds
everything it needs and works with the server switched off, because the machine
that serves the platform usually is. See
`docs/decisions/0033-the-mobile-client-is-offline-first.md`.

**Inside the app, two stores rather than one.** Progress goes into SQLite,
mirroring the server's tables with the user column dropped, because a device
holds one account. The curriculum stays a directory of files, because that is
what it is on the server too: content is files in git, and Postgres has never
held a question. `content.json` is parsed once per launch and held for as long as
the app runs; the lesson pages stay as files for the WebView to open. See
`docs/decisions/0043-the-phone-keeps-content-in-a-file-and-progress-in-sqlite.md`.

```
apps/mobile/app/          the screens, routed by expo-router
apps/mobile/src/          the logic, which is what is tested
apps/mobile/test-support/ the Node-backed stores those tests run against
```

Everything in `src/` that touches a platform does so through an interface with
two implementations: `expo-sqlite` and `node:sqlite` behind `db/sqlite.ts`,
`expo-file-system` and `node:fs` behind `archive/files.ts`, `expo-secure-store`
and a map behind `session/secrets.ts`. The `expo-*` implementations are one thin
file each and hold no logic. That is what lets the queries, the migration, the
archive install and the whole server client be tested against real SQLite and
real files off a phone, and it is why `apps/mobile/tsconfig.app.json` typechecks
the app with neither `dom` nor `node` libraries: a Node import in `src/` is a
bundle that fails on the phone, and it should fail in the terminal instead.

`apps/web/src/app/api/device/device-client.integration.test.ts` is the one test
that holds both ends of the wire, running the phone's client against the real
endpoints, the real better-auth and an archive built from `content/`. Every other
test on either side uses a stand-in for the other, so that one is what would
notice the two drifting apart.

An install checks everything it can refuse in memory before it writes anything,
so a refresh that fails leaves the device holding the archive it was already
working from. Each version is then unpacked into a directory named after itself
and the swap is one settings row, so no directory is ever half replaced and the
app never has to be sure what renaming one does on a platform it cannot test
here.

**The daily queue is the device's own, and so is the grade.** The queue is
`buildDailyQueue` over the ladder rows in SQLite, which is the function the
server runs over the rows in Postgres, so the two offer the same questions in the
same order for the same schedule. A row naming a question the archive does not
hold is dropped from both the queue and the count of what is due: an archive is
replaced whole and can lag behind a sync, and a screen must not promise a
question the device cannot ask.

Answering grades locally with `gradeChoice` and `gradeOrdering`, and an open
question is self graded as it is on the web. The answer in full is on the device
the whole time, so what survives of the web's guarantee is the order of events:
nothing renders an answer until the attempt has been written, and `revealAnswer`
refuses the two forms whose answer names the correct option or sequence.

One answer writes four things: the attempt, the ladder row, when the topic was
last reviewed, and the day's count. They go in one transaction. The server makes
the last of those a separate call that a request composes, and a failure between
the two costs a count somebody can repair; here there is no request to retry and
no second copy until a sync runs, so an answer is recorded whole or not at all
and the screen can offer the question again knowing which. The attempt is left
unsynced, which is the whole of what a sync has to find.

Marking a topic learned is what enrols its questions, at the tier the track is
on, exactly as it is on the server. It is done from the track screen until the
lesson is on the phone.

`apps/web/src/lib/schedule-agreement.integration.test.ts` is the second test
holding both ends at once. It runs the real `recordAttempt` from each side over
the same history, against real Postgres and real SQLite, and compares the rung
and the due date after every answer. Each side is covered against its own store
elsewhere; this is what would notice them parting.

Lessons are the one thing it does not render natively. Each one is compiled
ahead of time into a self-contained HTML page, bundled with the same visual
components the web uses, and shown in a WebView. React Native sends in the
heading the narration is on and the colour theme; the page sends back taps on
internal links. Everything else, the queue, the three question forms, the
player, the dashboard, is native. See
`docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md`.

`packages/content/src/archive/` is that build, run by `npm run content:archive`.
It compiles each `lesson.mdx` with `@mdx-js/mdx` and bundles it with esbuild into
one page per topic plus a chunk and a stylesheet they all share, and it writes the
curriculum beside them as one JSON file carrying every question, exercise and
narration script with the key of each recording. It reads files and nothing else,
so building what the phone reads needs neither the web app nor the database
running.

The components it bundles are the web app's own, reached across the workspace
boundary on purpose so that one definition of a lesson serves both surfaces.
Every path it reaches for is in `packages/content/src/archive/web-sources.ts`.
See `docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md`.

Both exchanges need a signed-in device, and a device has no cookie jar. It
signs in once at `/api/device/session`, stores the token it gets back, and sends
it as `Authorization: Bearer <token>` from then on. better-auth's `bearer`
plugin turns that header into the session the rest of the server already checks,
so every endpoint authenticates a device and a browser the same way. The token
is a thirty-day session that moves its expiry forward whenever the device
reaches the server. See
`docs/decisions/0040-a-device-carries-its-session-in-a-header.md`.

It talks to the server in two exchanges, both started by the device.

```
   refresh                                sync
   content archive, one artefact,         attempts by id, learned marks and
   versioned by a hash of the             tier picks by timestamp. Both ways.
   files it was built from                Failure is silent.
        |                                          |
        v                                          v
   +--------------------------------------------------------+
   |  device: SQLite mirroring the server's tables,          |
   |  the same packages/core functions over the same shapes  |
   +--------------------------------------------------------+
        ^
        |  a track's recordings, one file per key, downloaded
        |  when asked for and never synthesised on demand
```

The archive carries every question in full, correct options included, so the
phone grades locally. That is a real weakening of the guarantee the web keeps,
and it is accepted rather than worked around. See
`docs/decisions/0037-the-mobile-archive-carries-the-answers.md`.

**Four endpoints serve a device, and all four only read.** The build writes
the archive and the server hands it over; nothing is assembled per request, so
the version a device is told about and the bytes it downloads come out of one
build. The archive directory is a bind mount named by `CONTENT_ARCHIVE_DIR`, the
way the recording cache is, so rebuilding the archive rebuilds nothing else.
`npm run deploy` builds it before it copies. See
`docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md`.

`GET /api/device/archive/version` is what a device asks on launch: the version,
the size of the download, and what is in it. The version is the one the archive
on disk has rather than the one `content/` currently hashes to, because an edit
nobody rebuilt is not something a device can be handed.

`GET /api/device/archive` sends the whole thing as one zip, naming the version it
sent in `X-Content-Version`. One URL serves every version, so that header is how
a device tells that what arrived is what it decided to fetch. It is replaced
whole rather than in parts, for the reason the build refuses to write half of
one.

`GET /api/device/audio/<key>` serves a recording and never makes one. That is the
whole difference between it and `/api/speech/<key>`, which synthesises on a miss:
a reader waiting on one section can wait, and a phone asking for a track's worth
of keys cannot be allowed to. What is missing is reported, and
`npm run narration:build` is what makes it. Either archive endpoint that finds
nothing built answers 503, so a device can never read an empty answer as being
up to date.

`POST /api/device/audio` prices a set of keys: each one that has a recording,
and how many bytes it is. A key nothing has been recorded for is left out, so one
answer says both what a download costs and how much of the track has never been
narrated. It is a POST that only reads, because a track is a few thousand sha256
keys and that does not fit in a URL. The phone asks in batches of 500 and the
endpoint takes 1000. See
`docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md`.

**A track's audio is downloaded from the track screen, and the price is shown
first.** The library is 301 MB on this machine, so a screen that started
downloading without saying what it costs would be the wrong shape. What the
phone holds is counted locally by listing `audio/` and reading file sizes, so
that half of the line is there with the server switched off. What is missing is
priced by the endpoint above, and shown when the server answers.

The download is one request per key, written to `audio/<key>.opus` only once
every byte has arrived. There is no resume logic and none is needed: a run that
is killed leaves whole recordings behind, and the next one asks for the rest.
The audio library sits beside the archive rather than inside it, so replacing the
curriculum does not throw the recordings away. A key is the hash of the words,
so an unedited script keeps its recording across a refresh.

A question's prompt can be played in a review session when its recording is on
the device, and no control is shown at all when it is not. The lesson's own
player is task 32.

**`POST /api/device/sync` is the one device endpoint that writes**, and the whole
of the exchange: everything the device has that the server does not goes up, and
everything the server has that the device does not comes back, in one request.

Three things travel, and nothing else does, because nothing else is a fact
somebody entered. Attempts merge by id, and an attempt is immutable, so the same
one arriving twice changes nothing. Learned marks and tier picks merge by
timestamp with the later one winning. Every rule is commutative and idempotent,
so two devices have nothing to resolve and a sync that fails halfway is repaired
by the next one.

The schedule, the streak, the daily queue and every topic status are derived from
those three rather than exchanged. Ingesting attempts replays each affected
question's whole history from the bottom rung through `replaySchedule`, which is
in `packages/core` so that the device folds the same attempts with the same
function. That is what makes both sides agree about when a question is next due,
rather than one of them being told.

Attempts come back by `attempts.recorded_at`, which is when this server learned
of one rather than when it was answered: a phone that was offline all week hands
over attempts dated all week, and a device that synced on Tuesday would never ask
for anything that old. Learned marks and tier picks are exchanged in full both
ways instead, since the curriculum bounds them at one row per topic and one per
track. See
`docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md`.

**The web says when each device last synced**, which is the only thing
`device_sync` is read for. A sync always starts from the device, because the
server has no route to a sleeping phone, so saying so is the whole of what the
web can do about one that has stopped. The dashboard lists each device with how
long ago it was heard from, and adds a reminder to any that has been quiet for
three days or more.

Three days, because a phone syncs on launch and on returning to the foreground,
so a device that was opened at all was heard from, and because an exchange that
fails does so silently by design. The count is calendar days in `APP_TIMEZONE`
rather than elapsed hours, so a sync late last night reads as yesterday.

## Not in V1

AI tutoring, multi-user support, social login, gamification beyond the streak,
SM-2, and any service beyond the three containers. The schema is
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
