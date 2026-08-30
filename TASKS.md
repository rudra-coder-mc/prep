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
lands. Tasks 22 to 28 are the server, and the web app has to behave identically
through every one of them, because it is in daily use for the whole phase. Tasks
29 to 35 are the app.

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
`docs/decisions/0040-a-device-carries-its-session-in-a-header.md`. Tasks 26 and
27 are unblocked, so they are the two to take next and either order works.

## 26. The server serves what a device needs

Blocked by nothing.

Three endpoints: the current content version, the archive itself, and audio by
key.

**The audio endpoint never synthesises.** It serves what exists and reports what
is missing, because a phone asking for a thousand missing recordings would
occupy the server for a day. `npm run narration:build` is what makes them ahead
of time.
One recording is one file, so an interrupted download needs no resume logic:
what arrived stays, and the next attempt fetches the rest.

Done when a device holding nothing can read the version, pull the archive, and
get a clear answer for both a recording that exists and one that does not.

## 27. Sync, both directions

Blocked by nothing.

Attempts by id, learned marks and tier picks by timestamp with last write
winning. Ingesting attempts replays each affected question's history through the
interval ladder to rebuild its schedule row, which is why the progress half of
this needs no new tables: attempts are only ever inserted, and everything else
worth knowing is derived from them. Two devices merging have nothing to resolve.

The one new table is `device_sync`, a row per device holding its name and when
it last synced.

Done when an integration test against real Postgres runs the exchange both ways,
and a question answered on one side comes out due at the same moment on the
other.

## 28. The web says when a device last synced

Blocked by 27.

The server can never start a sync, because it has no route to a sleeping phone.
So the web shows when each device last synced, and says so when one has not been
heard from in a while. That reminder is the only thing `device_sync` is for.

Done when the web shows the reminder for a device that has not synced recently,
and nothing for one that has.

## 29. The app logs in, refreshes and works with the server off

Blocked by 26. This is where offline first becomes real.

An Expo app that logs in on first run, pulls the archive, mirrors the server's
tables in SQLite, and then opens and works with the stack stopped. It runs the
same `packages/core` functions over the same shapes, so both sides reach the
same answer about what is due. Database access is the only thing written twice,
once against Postgres and once against SQLite.

The address is a tailnet hostname, which is fixed across networks and carries a
real certificate. Whichever machine is serving the stack is the one the app
points at.

Development is Expo Go, not a development build.

Read `0038`.

Done when the app is opened with everything switched off and every screen it has
by then works.

## 30. The daily queue on the phone

Blocked by 29.

The queue and the three question forms, graded locally with the same choice and
ordering functions the server runs. An attempt is written to SQLite and waits
for a sync. The answer in full appears when the question has been answered and
not before, which is the part of the web's guarantee that survives offline.

Done when a review session runs end to end with nothing switched on, and the
schedule the phone computes for a question matches what the server would.

## 31. Downloading a track's audio

Blocked by 26 and 29.

A track at a time, one file per key. The app says how much it is about to
download and how much it already holds, because the library is hundreds of
megabytes and the phone's storage is the constraint that made task 22 worth
doing.

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

Blocked by 27 and 30.

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

Done when the phone's dashboard and the web's agree once a sync has run.

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
