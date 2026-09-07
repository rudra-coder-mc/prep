add a device-specific authentication path to a new endpoint.** The one thing to
know is that the middleware no longer refuses an API request for want of a
cookie when it carries an `Authorization` header, so a new API route has to
verify its own session rather than assume the gate did it. Every route that
exists does. See `docs/decisions/0040-a-device-carries-its-session-in-a-header.md`.

Task 27 left the rule the app has to be built against. **Only attempts, learned
marks, tier picks and exercise progress travel. Everything else is derived on
both sides**, from those, by the same `packages/core` functions: the schedule
through `replaySchedule`, the streak through the day counts, the queue and every
topic status as they already were. When the app needs a value the server also
has, the question to ask is which of the four it comes from, not how to send it.
Exercise progress is the odd one out and the reason there are four: nothing
derives it, so it is carried as state and merged by `updatedAt`. Task 34 added
it, and `0042` is amended rather than superseded, because it had already said
that is what the fourth collection would look like. See
`docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md`.

Task 34 left one rule and one warning. **The dashboard is one fold run twice.**
`summariseDashboard` in `packages/core` returns the whole page, and
`apps/web/src/lib/dashboard.ts` and `apps/mobile/src/library/dashboard.ts` are
query layers that decide nothing at all: they read rows and hand them over.
`apps/web/src/lib/tracks.ts` moved into the package with it. **A number added to
either dashboard belongs in the fold**, or the two surfaces start disagreeing
about a person who answered the same questions.
`apps/web/src/lib/dashboard-agreement.integration.test.ts` compares the two whole
dashboards after one sync and would say so, and it was checked by breaking the
phone's side on purpose rather than trusted for passing first time.

It also single-sourced one type that was quietly duplicated. `EXERCISE_STATUSES`
is in `packages/core/src/schema.ts` now, and both the `exercise_status` pgEnum in
`apps/web/src/db/schema.ts` and the sync's wire schema are built from it. **The
enum reading from a package rather than from a literal is deliberate**, and
`npm run db:generate` reports nothing to migrate, which was checked rather than
assumed. Putting the literal back is what would let the column, the wire and the
phone drift apart.

The warning is that **the exercises screen is a new route under an existing
one**: `apps/mobile/app/topic/[technology]/[directory]/exercises.tsx` sits beside
`[directory].tsx`. Expo Router allows a file and a directory of the same dynamic
name, which is why it is written that way, but nothing here has run Metro, so it
is on the list of things the first launch on a phone has to confirm.

Task 33 left two things worth carrying into the tasks after it. The device's
half of the exchange is `apps/mobile/src/sync/sync.ts`, and it is deliberately
the mirror image of `apps/web/src/lib/sync.ts`, section for section, so the two
can be read side by side when one of them changes. It adds exactly one rule the
server has no need for: every exchange replays any question that has attempts and
no ladder row, because the archive is a download that can lag behind the attempts
and an answer can arrive for a question the phone holds no copy of.

**Task 42 is closed.** When a new archive is refreshed and unpacked on the phone,
`refreshArchive` runs `enrolAllLearned` to enrol any topics marked learned while
the old archive was installed, and `replayAttemptedQuestions` ensures that
attempts recorded for newly arrived questions are immediately on the ladder.

**Task 40 is closed.** `refreshArchive` now calls `pruneAudioLibrary`, deleting any
local recordings that are no longer referenced in the refreshed archive.

**Task 39 is closed.** `workspaceRoot` is single-sourced in
`packages/content/src/archive/location.ts` and imported by `web-sources.ts` and
`apps/web/src/lib/speech/cache.ts`.

`TASKS.md` carries the whole phase with the blocking edges on each task. Take
the order from there rather than from this file, and read `0033` before any of
it.

The web app is in daily use for the whole phase, so tasks 22 to 28 have to leave
it behaving identically.

### What Phase 4 finished with

Sixteen topics now carry six SWE-1 questions and six SWE-2 questions each, and
run to between thirteen and sixteen questions in total. Everything the four
tasks added was a choice question, because every one of those topics already had
its one open question and its ordering question, and the caps in the brief did
not move to make room.
