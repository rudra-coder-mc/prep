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
the whole tier. The content phases are done: the bank covers SWE-1 and SWE-2
across the whole language track.

What is left is the second surface. The same loop on a phone, working with the
server switched off, because the machine that serves the platform usually is.

Phase 6 lists the decisions it rests on at its head, and
`docs/decisions/0033-the-mobile-client-is-offline-first.md` is the one to read
first. For the content behind the loop, read
`docs/decisions/0028-tiers-are-interview-levels.md`, then `0031` and `0032` for
how the pick and the promise behave. The terms are in `docs/glossary.md`, the
content conventions are in `docs/tasks/converting-a-topic.md`, and
`docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md` is what a new
narration script needs to know.

**Phases run in order.** Inside a phase, take the tasks top to bottom unless a
task names what blocks it. One task is one branch and one merge, as always.

Task numbers are the blocking graph's names, so a finished task leaves a gap
rather than renumbering the ones after it, and a finished phase goes the same
way. The numbering starts partway through because the tasks before it are done.

---

# Phase 6: the same loop on a phone

The machine serving the platform is off most of the time the phone is in a hand,
so the app holds everything and needs nothing at rest. It replaces a content
archive when it can reach the server and exchanges progress both ways when it
can, and neither of those blocks anything the app does.

Six decisions in `docs/decisions/` stand behind this phase, and they are worth
reading together before the first task rather than one at a time, because the
blocking edges below only make sense that way.

- `0033-the-mobile-client-is-offline-first.md`, which every task here serves
- `0034-lessons-are-pre-rendered-and-shown-in-a-webview.md`
- `0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md`
- `0036-recordings-are-stored-compressed.md`
- `0037-the-mobile-archive-carries-the-answers.md`
- `0038-expo-is-the-one-hosted-service.md`

Tasks below name them by number.

Each task is a vertical slice that can be shown working on its own when it
lands. Tasks 22 to 28 were the server and the web, and the web app had to behave
identically through every one of them, because it is in daily use for the whole
phase. Tasks 29 to 35 are the app.

The workspace that was task 21 is in place: `packages/core` holds the logic both
clients share, `packages/content` holds the curriculum, and the Next app is
`apps/web`.

Task 22 is done too: recordings are Ogg Opus at 32 kbps mono, the `tts`
container runs `services/tts/server.py` rather than Piper's own server, and
`npm run speech:transcode` is the migration that converts a cache made before
that. The library on this machine went from 3.6 GB to 301 MB. The server's cache
is still WAV, which the app reads as an empty cache and re-records from: see
`HANDOFF.md`.

So is task 23: `npm run narration:build` takes a whole track, says what is
missing before it records and reads the cache again to say it has finished. It
also answered the question it was written to answer. Nothing was missing: all
1417 scripts in `content/` have a recording on this machine.

Task 24 is done: `npm run content:archive` writes `.content-archive/`, holding
the curriculum as one JSON file and one pre-rendered lesson page per topic. It
bundles the web app's own lesson components rather than a copy of them, so a
lesson reads the same on both surfaces. That reach across the workspace boundary
is `docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md`,
and task 37 is the tidy-up it defers.

Task 25 is done: a device signs in at `/api/device/session` and carries the
session it gets back as a bearer token, which every endpoint already accepts
because better-auth resolves the header before the session check runs. Nothing
new is stored, and the browser still gets a cookie. See
`docs/decisions/0040-a-device-carries-its-session-in-a-header.md`.

Task 26 is done: a device reads `/api/device/archive/version`, downloads the
whole archive as one zip from `/api/device/archive`, and gets a recording or a
clear refusal from `/api/device/audio/<key>`, which never synthesises. The
server only reads: `npm run content:archive` writes `archive.zip` and
`npm run deploy` runs it first, so the archive on the server is never older than
the content beside it. See
`docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md`.

Task 27 is done: `POST /api/device/sync` exchanges attempts, learned marks and
tier picks in one request, and the schedule, the streak and every topic status
are rebuilt from them rather than exchanged.
`replaySchedule` in `packages/core` is the fold both sides run, which is what
makes them agree about when a question is next due. The one new table is
`device_sync`; the one new column is `attempts.recorded_at`, without which a
device that synced yesterday never sees the week a phone answered offline. See
`docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md`.
Exercise progress deliberately does not travel yet: see task 34.

Task 28 is done, so the whole web side of this phase is finished. The dashboard
lists every device that has ever synced with how long ago it was heard from, and
reminds about any quiet for three days or more, which is the only thing
`device_sync` is read for. The threshold and why it is three days are in
`docs/architecture.md`.

Task 29 is done: `apps/mobile` is an Expo app that signs in at
`/api/device/session`, downloads and unpacks the archive, mirrors the server's
progress tables in SQLite, and reads its tracks and topic statuses out of both
with nothing switched on. The screens it has are sign in, what this device holds,
and a track's topics.

Three things it settled that the tasks below inherit. The curriculum stays a
directory of files and only progress goes into SQLite, which is
`docs/decisions/0043-the-phone-keeps-content-in-a-file-and-progress-in-sqlite.md`.
Every platform module sits behind an interface with a Node-backed twin in
`apps/mobile/test-support/`, so anything written in `src/` is testable without a
phone, and `apps/mobile/tsconfig.app.json` typechecks the app with no `node` and
no `dom` libraries to keep it that way. And
`apps/web/src/app/api/device/device-client.integration.test.ts` runs the phone's
client against the real endpoints and a real archive build, which is the test to
extend when an endpoint grows.

The one thing nobody has verified is the app running on a phone. Every piece of
its logic is under test, and the rendering is not, because it needs Expo Go and a
device. Open it before building on it.

## 30. The daily queue on the phone

Blocked by nothing now that 29 has landed.

The queue and the three question forms, graded locally with the same choice and
ordering functions the server runs. An attempt is written to SQLite and waits
for a sync. The answer in full appears when the question has been answered and
not before, which is the part of the web's guarantee that survives offline.

Done when a review session runs end to end with nothing switched on, and the
schedule the phone computes for a question matches what the server would.

## 31. Downloading a track's audio

Blocked by nothing now that 29 has landed.

A track at a time, one file per key. The app says how much it is about to
download and how much it already holds, because the library is hundreds of
megabytes and the phone's storage is the constraint that made task 22 worth
doing.

`/api/device/audio/<key>` answers one key, so nothing yet says how large a whole
track is without asking key by key. Decide here whether that is a listing
endpoint or an estimate from what the archive already knows.

Done when a track's audio is on the phone and plays with nothing switched on,
and an interrupted download continues rather than starting again.

## 32. The lesson on the phone

Blocked by 31.

The pre-rendered page in a WebView, with the player and everything else native
around it. The bridge carries four messages and no state: React Native sends in
the heading the narration is on and the colour theme, the page sends back taps
on internal links so navigation stays native.

Read `0034`, and `docs/decisions/0018-the-lesson-follows-the-voice.md` for how
a section of speech finds its section of lesson.

Done when a lesson reads and animates on the phone the way it does on the
laptop, the lesson follows the voice, and a link inside it navigates natively.

## 33. The phone syncs

Blocked by 30.

A sync on launch, on returning to the foreground, and at the end of a review
session. Failure is silent, and the app keeps working entirely from what it
already holds.

Done when a session answered on the phone and a session answered on the laptop
merge in both directions with no attempt lost, and the app with the stack off
neither blocks nor complains.

## 34. The dashboard, the tier pick and the exercises

Blocked by 30.

The rest of the loop, natively: readiness over the whole tier, the streak, the
weak-topic list, picking a tier per track, and exercises with their status and
notes.

Exercise progress is the one part of the loop the sync does not carry. It is
neither derived from attempts nor needed before this task, so task 27 left it
out. It is a fourth collection in the same payload, merged by `updatedAt` the
way a tier pick is, and task 33's exchange has to grow to include it.

Done when the phone's dashboard and the web's agree once a sync has run,
exercises included.

## 35. An installable APK

Blocked by 33.

EAS Build on the personal Expo account, downloaded and sideloaded onto the
phone. `.easignore` excludes `content/` and the built archive, so what leaves
the machine is application source and nothing else. Check what the upload
actually contained rather than trusting the ignore file to be right.

Read `0038`, and the Expo exception in `CLAUDE.md` before it.

Done when the APK is on the phone, logs in against the tailnet hostname, pulls
the archive and a track's audio, and runs a review session with the
laptop shut.

---

# Low priority

Blocked by nothing and blocking nothing. Take them when they are worth taking.

## 36. `buildDailyQueue` takes a timezone

`packages/core/src/day.ts` defines a day as a calendar day in `APP_TIMEZONE`,
deliberately, so that travelling cannot shift when a streak rolls over.
`packages/core/src/daily-queue.ts` computes the start and end of the day with `setHours`
on whatever timezone the process is in. On one machine those are the same answer
and the disagreement is invisible. Across a laptop and a phone they are not.

It stays low priority because it cannot affect anybody in a single timezone.

Done when the queue and the streak name the same day whatever the device is set
to, with a test that fails if they part again.

## 37. Move the lesson components into a package of their own

`packages/content/src/archive/` reaches into `apps/web` for the MDX component map
and the visual library, because a lesson has to render identically on both
surfaces and the cheapest way to guarantee that is for both to use one copy. The
dependency points from a shared package into an application, which is backwards,
and the eslint boundary is switched off for that one directory to allow it. See
`docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md`.

The structurally right answer is a package holding the visuals, the component map
and the three small helpers they use, with `apps/web` keeping thin re-export
shims so its own imports do not change. It was deliberately not done first: it
costs a fifth workspace member and an amendment to `0035`, and buys nothing until
something other than these two surfaces renders a lesson.

Take it when a third surface appears, or when the reach starts causing trouble.
`packages/content/src/archive/web-sources.ts` names every path involved, and is
meant to be the whole of the change.

Done when no package imports from an app, the eslint exception is gone, and the
archive and the web still render the same lesson.

## 38. The daily reminder on the phone

One local notification a day, at a time that can be changed.

Expo Go is unreliable about local notifications on Android, so this is verified
on a real build rather than in the development loop, which means it is only
properly testable after task 35.

## 39. One definition of the workspace root

Three copies of the same eight-line walk up to `package-lock.json` now exist:
`apps/web/src/lib/speech/cache.ts`, `packages/content/src/archive/location.ts`
and `packages/content/src/archive/web-sources.ts`. They agree today. Two of them
return `process.cwd()` when they find nothing and the third throws, which is the
kind of difference that stays invisible until a build runs somewhere new.

It stays low priority because a wrong answer here is loud rather than subtle:
nothing is found and the command says so.

Done when one function has one home that both packages can reach, with the
behaviour on "no lockfile above here" decided once.

---

# Not scheduled

Real work, deliberately unordered. Do not pick these up as "the next task"
without discussing it first. Each needs breaking down before it is actionable.

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
