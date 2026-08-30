# Handoff

State of the work for whoever picks it up next. `TASKS.md` owns what is pending,
`docs/architecture.md` owns how the system is put together, and
`docs/decisions/` owns why. This file covers the things neither of those record:
what is in flight, and what will bite you.

## Where this stands

`main` holds the browser track, the finished tier migration, the whole of Phase
3, which is the platform work that turns a tier into a path, and every content
phase after it. The repository has no git remote, and no task tracker either.
Both are deliberate; see the hard rule in `CLAUDE.md`, which covers every hosted
service rather than only the company GitLab. That rule now has exactly one named
exception, and it is new: see the trap on it below.

**`main` was green when task 22 merged.** The full `npm run verify` ran through
lint, format check, typecheck, 387 unit tests, 49 integration tests against real
Postgres and a real speech engine, the production build and 61 Playwright specs.
The `tts` image was rebuilt and its compose healthcheck confirmed, since
`verify` does not cover the image and task 22 replaced the server inside it.
`apps/web/e2e/spoken-questions.spec.ts:63` remains the flaky one: it has passed on the
re-run after every failure it has ever had, which is not the same as being fixed,
and a spec that fails half the time makes the merge rule mean nothing.

At the head of `main` the content check reports 46 topics, 563 questions, 92
exercises, 291 narration sections and 1126 question scripts, tiered as SWE-1 150,
SWE-2 275, Senior 79 and Staff 59. That was run rather than remembered. Re-run
`verify` rather than trusting any figure you read anywhere, including here, and
read the section on piping it before you do.

The platform is an interview preparation tool built around one loop: read a
topic, mark it learned, answer recall questions on a schedule. The shell names no
technology. Every topic can be listened to, the lesson shows which part of itself
is being spoken, and every question and its answer can be listened to as well.

**The web platform is finished and so is its content, and the work has moved to
the phone.** No question takes typed input: every one is a choice question, an
ordering question or an open question, at most one open per topic and only on an
`interview` or `scenario` subject, and `npm run content:check` fails a build that
breaks either rule. Nothing in the schema, the session flow or the speech
pipeline is waiting on anything. Phases 4 and 5 are both finished and so is the
documentation loose end that was task 20, so every numbered task in `TASKS.md`
now belongs to the phone.

**The mobile version has been planned, and the plan is committed.** It is an
Expo app for Android, offline first, sharing one content library and one set of
scheduling rules with the web app. Six decisions came out of the session and they
are the thing to read before touching any of it:
`docs/decisions/0033-the-mobile-client-is-offline-first.md` is the spine, and
`0034` through `0038` cover the WebView lessons, the workspace, compressed
recordings, the answers travelling with the questions, and Expo. Three terms went
into `docs/glossary.md`: content archive, refresh and sync. `docs/architecture.md`
gained a mobile client section and the `device_sync` table.

The plan is cut into tasks. Phase 6 in `TASKS.md` was fifteen tasks and two
low-priority ones, each a slice that can be shown working on its own. Task 21 is
done, so fourteen are left and nothing on the phone itself has been started.

**The repository is a workspace.** `packages/core` holds the logic both clients
share, `packages/content` holds the curriculum with its loader and validator, and
`apps/web` is the Next application. The packages are consumed as TypeScript
source rather than a build: npm links them, Next transpiles them, and there is no
compile step to remember. Two things in the move are worth knowing before you
touch them, and both are in the traps below: how the loader finds the curriculum,
and what an old path in a doc means now.

**Every question carries a tier**, one of `swe-1`, `swe-2`, `senior` or `staff`,
named after the level of interview that asks it. The promise it buys is in
`docs/decisions/0028-tiers-are-interview-levels.md`: finish a tier and you are
prepared for that level of interview. The migration ran as expand, migrate,
contract and is finished: the field arrived beside `difficulty`, the bank was
tagged in seven batches that each stayed green, and task 12 made `tier` required
and deleted `difficulty` from questions and from topic meta. `difficulty` still
exists on exercises and means something different there, which
`0028` now says explicitly.

**A tier is now the path rather than a label.** The pick is a row per user per
track in `track_tier`, and enrolment reads it: marking a topic learned schedules
only the questions at or below the pick, and the topic list is the topics that
pick covers. `packages/core/src/tiers.ts` holds what a pick
covers, `apps/web/src/lib/track-tier.ts` stores it,
`apps/web/src/lib/progress.ts` is the only place that
enrols, and
`docs/decisions/0031-a-track-remembers-the-tier-you-picked.md` is the argument
for the default, for what a change of pick does in each direction, and for why a
topic off the path is still reachable.

**Readiness is the promise made checkable, and it is the dashboard's headline.**
A question counts once its schedule reaches step 3 of the ladder, and the share
is taken over every question the tier covers on the track rather than over the
ones enrolled so far, because an interview does not restrict itself to the topics
somebody chose to open. A finished tier offers the tier above it, says how many
questions accepting enrols, and waits. `packages/core/src/readiness.ts` is the calculation
and `docs/decisions/0032-readiness-is-measured-over-the-whole-tier.md` is the
argument. **Expect the number to read as brutal:** every SWE-1 question on the
JavaScript track has to reach step 3, three correct answers each spread over four
days, so it starts at zero and stays low for weeks. That is the claim being
honest, not a bug. Note that Phase 4 made it worse before it makes it better: the
JavaScript denominator was 74 questions when this was written and is 116 now, so
finishing a fill drops the percentage. The browser track is a separate
denominator and task 18 took it from 6 to 24, so the same drop has now happened
there.

**The JavaScript track is thirty-nine topics deep**, in teaching order from types
and coercion to what a bundler changes. `README.md` lists them in that order and
the `order` field in each `meta.ts` is the order itself. Topics arrive in groups
of three or four, one group to a branch, and the groups that have landed since
the conversions are functions, objects, collections and iteration, classes, async
in practice, modules and the runtime, errors, and memory and performance. Read
`git log` for what each one contained rather than a summary here.

**There is a second track now.** The browser is four topics of its own,
`content/browser/`: the DOM, events and delegation, `fetch` and the network, and
storage. They are not the language, they belong equally to a future React track,
and `docs/decisions/0027-the-browser-is-its-own-track.md` is the argument. It
cost nothing in the app: the label is the title cased directory name, the topic
list grew a second section by itself, and the dashboard counted two tracks
without being told. A topic's prerequisites now point across a track boundary,
and nothing checks that the topic on the other end exists.

## In flight

**Nothing is uncommitted.** The mobile planning session landed as six ADRs,
three glossary entries, a mobile section in `docs/architecture.md`, the Expo
exception in the hard rule, and Phase 6 in `TASKS.md`. Task 21 landed after it,
so the repository is now a workspace, task 22 after that, so recordings are
Opus, then task 23, then task 24.

**The content archive is built by `npm run content:archive`.** It writes
`.content-archive/`: `content.json` holding every topic in full with the audio key
of every question and narration section, one pre-rendered lesson page per topic,
and the chunk and stylesheet those pages share. It needs neither the stack nor
the database. At the head of `main` it is 46 topics, 563 questions, 92 exercises
and 291 narration sections, which is what `content:check` reports, and the
`apps/web/e2e/archive.spec.ts` specs open every one of the 46 pages.

The thing to know before changing it is that it bundles the web app's own MDX
component map and visual components rather than a copy, so the two surfaces
cannot render a lesson differently. That points a shared package at an
application, which the eslint boundary otherwise forbids and which is switched off
for `packages/content/src/archive/` alone. Every path involved is in
`packages/content/src/archive/web-sources.ts`, and it is meant to be the whole of
the change if those components ever move. See
`docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md` and
task 37.

**The server's recording cache is still WAV, and the app there will read it as
empty.** `scripts/deploy.sh` excludes `.speech-cache` in both directions, so
nothing about a deploy converts it, and a key whose file ends `.wav` is a key
the app does not find. Nothing breaks: a miss is resolved against `content/` and
re-synthesised, so the cost is the wait rather than a 502.

The fix is not to run the migration there. `npm run speech:transcode` needs
node_modules, which the deploy excludes, and the cache on this machine is now
both complete and already converted. rsync it across instead, once, and the
server has every recording rather than the subset it had recorded for itself.
Recordings are content addressed, so a cache from one machine is valid on
another.

**The audio backlog does not exist, and that was measured rather than assumed.**
This file said for months that some question and narration audio had never been
built and nobody knew how much, naming the async topics whose build was stopped
partway, task 18's browser questions and task 19's three topics. Task 23 asked
the cache instead of guessing: every one of the 1417 scripts in `content/` has a
recording, all 1417 are Ogg Opus with an `OpusHead` where one belongs, and the
smallest is 11 KB. Nothing was missing on this machine and nothing had to be
built. The builds that looked lost had run.

What that leaves is a habit rather than a backlog: a script edited without a
rebuild is still silent, so the survey is the thing to run, not a memory of this
paragraph. `npm run narration:build -- javascript` says what is missing before it
records anything, so asking costs the seconds it takes to stat 1265 files.

**The server's cache is a different question, and nobody has surveyed it.** It
is still WAV, so the app there reads it as empty. See the note on rsyncing this
one across, above.

**Merged branches are piling up undeleted**, which the conventions below say
should not happen. `git branch --merged main` lists twenty of them, up from
nineteen. All are merged, so deleting them loses nothing, and nobody has done it
because permission was never asked for.

Read that list before acting on it. A branch with no commits of its own also
shows as merged, so a session holding work on a fresh branch has that branch
sitting in the output looking exactly like the dead ones. Task 16 spent a session
in that state.

## The next action

**Take task 25**, the phone's credential. It was never blocked, and it is now the
only thing 26 is waiting for, since task 24 built the archive.

Task 23 closed the oldest unknown in this file rather than finding work: nothing
was missing. See the note on the backlog above before planning around any audio
that is supposedly unbuilt.

Task 24 turned up one thing worth carrying forward. The lesson bundle was half
zod, because `apps/web/src/mdx-components.tsx` reached `headingSlug` through the
`@prep/core` barrel and the barrel pulls the content schema in behind it. On the
web Next drops it again and nothing shows; in a plain browser it was 320 KB of a
668 KB download and a hard `ReferenceError` on load, because `day.ts` reads
`process.env` at module scope. It imports `@prep/core/headings` now. **Anything
else that gets bundled for the phone should reach for a leaf module rather than
the barrel**, and should be opened in a browser rather than trusted to a build
that passed.

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

**The fill turned out to be almost entirely SWE-1.** Fifteen of task 16's sixteen
questions were, all sixteen of task 17's were, and all eighteen of task 18's
were: the four browser topics were already at six or more SWE-2, and at one or
two SWE-1. The bank was authored before tiers existed and tagged afterwards, and
tagging it honestly produced few SWE-1 questions, so what Phase 4 filled was a
thin bottom rather than a thin middle.

The total per topic followed from that rather than being aimed at. Two of task
17's topics and two of task 18's finished at sixteen questions, because a topic
already carrying eight or nine SWE-2 questions keeps them.

**What an SWE-1 question turned out to be**, over three tasks of writing them: a
bug somebody meets in their first year, where the wrong options are wrong on a
fact rather than on a judgement. A forgotten `await`, a script that runs before
the element it looks for exists, a `NodeList` that has no `map`, a form that
reloads the page because nothing called `preventDefault`, and a `false` that
comes back out of `localStorage` as a truthy string. The test in the brief is
whether somebody two years in has met the API at all, and it rules out more than
it sounds like it does.

### What the tier tagging has taught

**Nothing checks that a tier is right.** `content:check` counts how many
questions are untagged and stops there. There is no test that can fail for a
question tagged senior that should be staff, so the batches are judgement work
with the safety net only under the mechanical part. That is the reason the rule
in `TASKS.md` is written down and kept current rather than being re-derived per
batch.

**Two boundaries settle almost every hard call**, and they are in `TASKS.md` in
full. A senior question has a decision at the end of it; a staff question has
spec internals or a failure mode and nothing to decide. SWE-2 asks what went
wrong, senior asks what you would do instead, and a trade-off whose answer is a
single rule is still SWE-2.

**The `difficulty` field is a weak signal and gets weaker as topics get
advanced.** `easy` mapped to `swe-1` 32 times out of 34 in the first batch and 63
out of 91 by the sixth, because an easy question in a topic a junior has never
met is still not a junior question. `hard` never mapped anywhere: 33 of 94 hard
questions are SWE-2, since a famous gotcha is hard to answer and still the
ordinary working-developer round. Over the finished bank, `easy` mapped to
`swe-1` 69 times out of 97 and `hard` split 37 SWE-2, 27 senior and 39 staff.

**Report the counts a topic actually has.** Ten topics finished with one SWE-1
question and seven with none. The topic list is built from the questions, so a
topic with no SWE-1 question drops out of the SWE-1 list, which is the right
outcome and not a gap to fill. That is live now.

**A whole batch can come out with almost no SWE-1 questions, and that is the
answer rather than a mistake.** The async and modules batch produced two across
six topics, because cancellation, async iteration, module resolution and bundling
are not what a first round asks about. Four of those six topics have no SWE-1
question at all. The consequence is real and belongs to Phase 4 rather than to
the tagging: task 17 fills async and names only `event-loop`, `promises`,
`async-error-handling` and `es-modules-and-commonjs`, so `abortcontroller`,
`async-iteration`, `module-resolution-and-side-effects` and
`what-a-bundler-changes` stay out of the SWE-1 topic list unless somebody decides
to author into them. Nobody has decided that.

**A tooling topic tests the two boundaries hardest.** In the bundler and
resolution topics almost every question is about a mechanism somebody has to
know, so "is this staff" comes up on all of them. What settled it was asking what
the question does rather than how obscure the mechanism is: an inlined
environment variable, a barrel that keeps a package alive and a minified class
name are all diagnosis, so they are SWE-2 however deep the machinery. What went
to staff is the machinery asked about directly, such as what a bundle has done to
your modules, and what went to senior is the design question, such as how to
shape a package so it can be shaken.

**Derive any count you write into `TASKS.md` from the files.** The guidance
paragraph there cites examples and totals, and one of them was written from
memory and named the wrong tier for a question. A short script over
`packages/content/content/*/*/questions.ts` is how the numbers in it are
produced.

### What authoring a group has taught

Read `shadowing-output` in `content/javascript/prototypes/questions.ts`,
`bind-output` in currying, `countdown-order` in recursion and
`plus-and-minus-order` in types and coercion. They are the four cases where an
existing question converted straight into an ordering question, and all four did
it because the original already printed several lines.

- **The ordering question is more often authored than converted.** A pool needs
  lines the program never prints, so look for a skipped element, an ignored
  `reject`, a default that never ran, a line a `throw` jumped over. If nothing in
  the topic can fail to print, write a new program.
- **Refuse an ordering question whose answer is internal scheduling.** The
  promises topic had one whose order turned on how many microtask turns
  `allSettled` takes. That measures trivia. It was replaced rather than
  converted.
- **Replacing a near-duplicate is normal.** Two questions asking the same thing
  is worse than ten questions in a topic. Say in the commit which one went and
  where its content already lives.
- **Run every code sample before writing its answer.** `node -e` has twice caught
  something an answer would otherwise have asserted wrongly. An answer in full is
  the thing a reader trusts most, so it is the worst place to be approximately
  right.
- **An error message is a fact about the installed runtime, and runtimes move.**
  A question in the modules topic was going to be built on `Cannot use import
statement outside a module`, which recent Node no longer produces for a file
  with no `type` field: it detects the module syntax, reparses and warns instead.
  The question became one about what classifies a file, with the message as the
  symptom, which is the better question anyway. Reproduce an error before
  quoting it, in a scratch directory rather than from memory.
- **A group is a branch, not a block of the track.** Its topics take whatever
  positions in the teaching order they belong in, which usually means splitting
  the group across the track and renumbering everything below it. The memory
  group put its four topics in three different places and renumbered fourteen.
  See `docs/decisions/0019-a-group-is-a-branch-not-a-block-of-the-track.md`.
- **Do not build the audio as part of the task.** Finish the content, run
  `content:check`, then `verify`, then commit and merge. Recording is a separate
  step Atul decides on, so ask once the work is done rather than folding it in.
  It is also why the order matters when he says yes: a recording is keyed by the
  hash of its spoken text, so anything built before the content settled is not
  recorded, and catching up costs another pass over the whole bank.

Do not start by reading the schema. The schema is finished and the work is
authoring: three wrong options that are wrong for interesting reasons is the part
that teaches something, and it is required on nearly every question in the bank.

## Open items

**The daily queue and the streak disagree about what "today" is.**
`packages/core/src/day.ts`
defines a day as a calendar day in `APP_TIMEZONE`, deliberately, so that
travelling cannot shift when a streak rolls over. `packages/core/src/daily-queue.ts`
computes the start and end of the day with `setHours` on whatever timezone the
process is in. On one machine those are the same answer and the disagreement is
invisible. Across a laptop and a phone they are not. It is task 36 in the
proposed phase, deliberately low priority, because it cannot affect anybody who
stays in one timezone.

**A topic now says the same thing three times, and nothing checks the three
agree.** The lesson, the concept map that closes it, and the narration script
beside it are written separately and by hand. Change a lesson and the other two
have to be revisited, or the page contradicts itself, which is worse than not
having them. Both duplications were accepted deliberately, in
`docs/decisions/0014-concept-map-recap.md` and
`docs/decisions/0016-narration-is-written-not-read.md`. The mitigation is
mechanical for one of the three: every narration section names the lesson heading
it covers, and `npm run content:check` fails the build if that heading does not
exist, so a rename cannot pass silently. Nothing checks that the two say the same
thing, only that they point at each other.

**Every new topic owes a narration script as well as a lesson.** Thirty-nine
topics is two hundred and forty-one sections, all hand-written, and it is the
cost most likely to be underestimated when planning a group. Question audio is
generated, so it does not add to this; narration is written and does.

**Em dashes have crept back into the content.** Two hundred and ninety-one of
them across thirty-one files, in the groups written after
`improvement/unslop-content` cleaned the original twelve topics. The house style
forbids them. Nobody owns the sweep, and doing it as one pass over `content/` is
a branch of its own. All four Phase 4 fills added none, so the number is a
backlog rather than a trend: check it with a `grep -ro` over `content/` before
believing any figure here.

**Nobody has listened to a question read aloud and judged whether it works.**
The pipeline is verified end to end, the recordings are valid audio and the right
one is requested at the right moment, but no human has confirmed that a question
dense with operators is followable by ear. `??` against `||` is the case to
check, in the types and coercion topic. If a handful read badly, the fix is a
hand-written spoken override on those questions rather than a general rewrite,
and `docs/decisions/0021-questions-are-spoken-from-built-audio.md` says so.

**The speaker button is a single-clip player with a module level lock.** Starting
one stops whichever was speaking, through a module scoped variable in
`speak-button.tsx`. That is enough for the two buttons a question page has and it
is not a player: no seeking, no queue, no speed control of its own beyond reading
the stored narration speed. If a page ever needs three or more of these, or a
sequence, move it onto `NarrationProvider` rather than growing the lock.

**One topic highlights backwards.** In `closures`, the narration talks about what
a closure costs before it gives the interview answer, but `lesson.mdx` puts Traps
after The interview angle, so that section scrolls the reader up the page rather
than down. The anchor is correct; the two documents genuinely disagree about
order. Reordering either is content work and nobody owns it yet. Every topic
written since keeps the two in the same order, so this is the only one.

**One topic has no open question at all**, `iterables-and-iterators`. The rule is
a cap rather than a quota, so it passes the check. Worth knowing before reading
it as an omission.

**The duplicate open question is settled.** `prototypes` and `class-syntax` both
used to end on whether `class` is only syntax over prototypes. Task 16 dropped
`class-is-sugar` from `prototypes` and left the `class-syntax` one, which is the
fuller answer and is in the topic named after the thing being asked about. The
prototypes lesson still teaches what `class` really is, so nothing about the
reading order changed. Its open question is now `patching-a-built-in`, which is
about the shared mutable prototype and shares nothing with `class-syntax`.

**One end-to-end spec is flaky, nobody owns it, and it now blocks the merge
rule.** "A question can be listened to before it is answered",
`apps/web/e2e/spoken-questions.spec.ts:63`, has failed seven times in sixteen full suite
runs, and passes on a re-run of the same commit every time.

**It has now taken a second spec with it.** In one run,
`spoken-questions.spec.ts:75`, "the answer gets its own listen button", failed
alongside it in exactly the same way, and both passed on the immediate re-run of
the same build. Those two are the only specs in the file that press a listen
button behind the `serveAudio` stub, which is weak evidence for the route
interception hypothesis below and against the hydration one: a hydration race
would not pick out two specs that share a stub.
It always fails the same way: the listen button never becomes "Stop listening"
within the five second timeout, so the audio never started. Every failure has
been on a tree that touched nothing but content data, and one of them was on
unmodified `main` immediately after a green run of the same commit, which rules
out the content and rules out the last change. Passing in isolation is not
evidence either; it has done that after every failure.

This is the urgent one, because the convention below says nothing merges into
`main` with `verify` failing, and at one in two the rule now means running the
suite until it passes. That is the same as not having the rule, and task 16 was
merged that way. **The decision
worth taking first is whether this becomes a task**, and the answer is probably
yes, because whoever writes the fix also gets to decide what the spec should
assert rather than being told by a timeout.

Two hypotheses fit, and nobody has separated them. The older one is the route
interception: `serveAudio` adds a handler for `**/api/speech/warm` after the
audio handler deliberately, because Playwright consults the last handler added
first, and the warm call racing the play call would leave the play with nothing
to start. The newer one, from reading the page snapshot Playwright captured on
the last failure, is a hydration race: the click lands on a button that has
rendered but has no React handler attached yet, so nothing happens at all. The
snapshot shows the question fully rendered with its options and the button still
reading "Listen to the question", which fits either an unhandled click or a play
attempt that failed and reset the label.

The cheap way to separate them is to assert on the `asked` array before asserting
on the button. Under the warm race a request was made, so `asked` has an entry;
under the hydration race it is empty. `test-results/` holds the trace and the
error context from the last failure, and it is gitignored, so it survives until
the next run overwrites it. Raising the timeout would hide either one rather than
answer it.

Do not diagnose this from a run where anything else was touching Docker or port 3100. Two of the failures in the log that prompted this entry were caused by
exactly that, and they are not evidence of anything.

**The topic list is about to look shorter on the server, and that is the feature
working.** No database has a `track_tier` row yet, so every track lands on SWE-1
after the next deploy, and seven of the 43 topics have no SWE-1 question and move
into the collapsed group under their track. Topic progress drops with it, because
a topic's progress is now the share of the in-scope questions that are passing.
Nothing was unenrolled and no attempt was lost: pick a higher tier in the track
header and both come back.

**The dashboard will read 0% ready on both tracks after that deploy**, and it is
right to. Readiness only counts a question once its schedule reaches step 3, and
nothing on the server has climbed that far. It is the slowest number the platform
has on purpose; see
`docs/decisions/0032-readiness-is-measured-over-the-whole-tier.md`.

**The step-up offer has no end-to-end test and cannot have one.** Reaching it
means every question a track's tier covers sitting at step 3, which is 74 rows on
the JavaScript track and nothing a browser session can produce. It is covered by
`apps/web/src/lib/dashboard.integration.test.ts`, which places rows on the ladder
directly, and the end-to-end suite asserts only that nothing is offered while a
tier is unfinished. If the offer ever renders wrongly, no test will catch it.

**`shiki` is an unused dependency.** It is in `package.json` and nothing imports
it. Left over from V1, when lessons were going to have syntax highlighted code
blocks. Nobody owns it; it is recorded at the bottom of `TASKS.md`.

**Two dashboard labels changed meaning.** Topic status reads results and how much
of a topic is passing rather than an average confidence. Three questions passed
out of eight reads "learning" rather than "understood", and one Weak self grade
among the last three keeps a topic at "learning". Both are more honest than what
they replaced, but if a status looks pessimistic against a memory of the old
dashboard, this is why.

**`APP_TIMEZONE` defaults to UTC.** Until it is set in `.env`, the daily streak
rolls over at UTC midnight rather than local midnight. Deliberate default, one
line to change.

**Next 16 deprecation warning on every start.** The `middleware` file convention
is deprecated in favour of `proxy`. Pre-existing, harmless, unowned.

**A Vite warning during unit tests** about the dynamic content imports in
`packages/content/src/loader.ts`. Cosmetic, only appears under Vitest,
pre-existing.

## What verification has caught, and how

Findings worth keeping, because each one names a class of mistake this project
keeps making rather than a bug that is now fixed.

**A negative answer can outlive the condition that produced it.** The listen
button reported that no recording existed for hours after every recording had
been built. The server was answering 200 with valid audio the whole time; the
browser was replaying a 404 it had stored earlier and never re-asked. What made
it stick was two ordinary looking choices meeting: a refusal with no
`Cache-Control` on it, which is heuristically cacheable, and a fetch written with
`cache: 'force-cache'`. Signing in with `curl` against the running container and
getting the audio back in one request is what separated "the server is wrong"
from "the client never asked". Any endpoint whose 404 means "not yet" rather than
"never" needs `no-store` on it.

**Two things called the same cache were two different places.** The app read a
named Docker volume and the build wrote to a host directory. That was invisible
for as long as a missing recording could be synthesised on demand, because the
container silently filled its own copy; removing the fallback turned a latent
split into an outage. Verifying a path end to end means checking that the process
that writes and the process that reads name the same location, not that each of
them works.

**A handler's tests describe the handler, not what a request to the running
application actually meets.** The speech route's own tests asserted a 401 for a
signed-out request, and passed, and the real stack could never have returned
one: the middleware redirected every unauthenticated request to the login page,
`/api/*` included, so a `fetch` for audio would have followed that redirect
silently and got a page of HTML with a 200. Nothing in the suite could see it,
because the middleware is not in the route's unit test and no end-to-end spec
called the endpoint. Driving the running container with `curl` is what found it.
`apps/web/e2e/speech.spec.ts` now covers the endpoint from inside a real page, and that
spec was checked by reverting the middleware fix and watching it fail. A
regression test nobody has seen fail is a guess.

**`npm run test` does not typecheck, and the Docker build does.** A `Uint8Array`
that TypeScript considers possibly backed by a `SharedArrayBuffer` passed every
unit test and failed the image build. That is the reason for the `Audio` type
alias in `apps/web/src/lib/speech/audio.ts` and the warning in its comment. Run
`npx tsc --noEmit` before believing a green test run.

**Rewriting a topic's content is a platform change, whatever the diff says.**
Converting `closures` touched only one content file and five end-to-end specs and
two integration tests went red, none of them in a way that read as a content
problem: a thirty second timeout clicking a disabled button, a counter that never
reached "2 of 11", a question id that no longer existed. Every one of them was a
test leaning on a fact about the content it was driving, and none of those facts
was written down as a fact. What is worth taking from it is that the suite is
coupled to whichever topic it drives, so before converting a topic, expect to
find out which of its properties something depends on.

**A lesson page accumulates controls, and a new one has to be named for what it
controls.** The narration player's speed button shipped with the same accessible
name as the speed button on every visual, so a single page offered five
identically named controls and nothing could tell them apart - not a test, and
not a screen reader. Only opening the real page found it, because in isolation
each component is unambiguous.

**A test can assert something that is only true because of what ran before
it.** A new end-to-end spec claimed that the first play of a section synthesises
it, which is true from an empty cache and false once another spec in the same run
has already spoken those words: the suite shares one speech cache for the whole
run, the same way it shares one database. It passed alone and failed in the
suite. What the spec is actually about is the play after that one, so it now
plays once without asserting anything about it and asserts on the reload.

**Anything positional in the visual library has to be checked by screenshot.**
The tests were green while the concept map was visibly broken: below 640px it
stacks the centre above its branches, but links were still drawn from the
centre's right edge to each branch's left edge, cutting diagonally across
everything between. jsdom has no layout, so every rectangle it measures is zero.
`linkPath` in `flow.tsx` is now exported and unit tested with hand-built
rectangles, and the standing practice is to drive a scratch Playwright spec at a
few viewport widths, look at the images, then delete the spec. That pass also
caught a highlight band spanning two non-adjacent lines and a reference arrow
keeping a stale colour.

## Traps

**The loader finds the curriculum by walking up from the working directory, and
that is deliberate.** `packages/content/src/loader.ts` looks for
`packages/content/content` above `process.cwd()`, because the web app runs from
`apps/web`, the scripts run from the repository root and the built server runs
from the image's root. `import.meta.dirname` is the obvious answer and it is
wrong: it is undefined once a bundler has compiled the file, which showed up as
the production build failing to collect page data and nowhere earlier. Anything
that needs a path beside a topic should call `topicFile` rather than rebuild one.

**The standalone image carries the curriculum because it is told to, not because
it was traced.** `outputFileTracingIncludes` in `apps/web/next.config.ts` names
it, and `outputFileTracingRoot` points at the repository root so the workspace
packages come with it. A file read at request time is invisible to a static
trace, so removing either line produces an image that builds, starts, and has no
topics. Check with
`docker run --rm --entrypoint sh <image> -c 'ls packages/content/content'`.

**A path written in a doc before task 21 is one level out.** `src/lib/x.ts` means
`apps/web/src/lib/x.ts` unless task 21 moved that file into a package. The ADRs
were left as they were written, since they record what was decided at the time;
`README.md` and `docs/architecture.md` are kept current and are where to look.

**Never add a git remote, and never push.** The self-hosted GitLab belongs to
the company and this is a personal project. `CLAUDE.md` states the rule in full.

**The hard rule now has exactly one named exception, and reading only its
headline will make you refuse work that is allowed.** `CLAUDE.md` says nothing
about this project goes to an external service, and that is still true of the
GitLab, ClickUp and every hosted tracker. Expo is the one thing that was named,
for building the Android APK and for nothing else, and
`docs/decisions/0038-expo-is-the-one-hosted-service.md` is the argument. What
keeps it honest is `.easignore`: the curriculum and the built content archive
never reach Expo, recordings are not in the repository, and progress is in
Postgres. Do not extend it to another Expo service and do not read it as
precedent for a second provider.

**A scripted rewrite of a `questions.ts` can eat a whole question silently, and
the content check is the only thing that will tell you.** Reordering the options
on a few questions with a Python script that located each `options: [` by
searching forward from an id went wrong on the second question it touched: the
region it computed spanned the end of one object and the start of the next, and
it wrote over a question that was never mentioned in the script. Nothing failed.
Prettier reformatted the result happily, TypeScript accepted it, and the only
visible symptom was `npm run content:check` reporting 495 questions where the
previous run said 496.

Two rules come out of it. Read the question count after any bulk edit of a
content file and compare it against the run before; it is the cheapest tripwire
in the repository. And prefer editing the block of new questions before appending
it, or an exact whole-string replacement, over any script that computes a region
by searching for delimiters, because the objects in these files are large enough
that a wrong region looks plausible.

**The speech cache key is a hash of the script, not of the audio, which is the
one fact that makes the Opus change cheap.** Changing the stored format does not
invalidate a single key, so the 1776 recordings in `.speech-cache` are
transcoded in place and nothing is re-synthesised. A session that assumes a
format change means rebuilding the cache will spend days of CPU it did not need
to spend. `docs/decisions/0036-recordings-are-stored-compressed.md` says so, and
`apps/web/src/lib/speech/cache.ts` is where the key is made.

**The cache holds more recordings than there are current scripts, so transcode
after pruning rather than before.** The content check counts 291 narration
sections and 1126 question scripts, which is 1417, against 1776 files on disk.
The difference is orphans left behind by edited scripts, which is the designed
behaviour: editing a script produces a new recording and abandons the old one.
`npm run speech:prune` deletes what no current script hashes to. Running it first
means not spending compression time on recordings nothing points at.

**Do not delete `.speech-cache` to reclaim space.** It is called a cache and
losing it costs latency rather than correctness, which is true and misleading:
that latency is roughly 23 hours of speech at about a second of CPU for every
three and a half seconds of audio. It is the single most expensive thing in the
working tree and it is not in git.

**Prettier checks untracked files, so a scratch file at the repo root fails
`verify` and blocks every commit.** The pre-commit hook runs the same check.
Keep stray notes formatted or keep them outside the repository.

**`next dev` rewrites `CLAUDE.md`.** Next appends a block of its own agent
instructions to it on every dev run. `agentRules: false` in `next.config.ts`
turns that off. If that line disappears, the policy file starts growing content
nobody wrote.

**Adding a route breaks `npm run typecheck` until types are regenerated.** Typed
routes mean a new path is not a valid `href` until Next has seen it. Run
`npx next typegen` after adding a page, or the error reads as though the link
itself is wrong.

**Content files are typed with the post-defaults `Question` type**, so a new
question must spell out `hints: []` even though the schema defaults it. The
schema will accept the object; TypeScript will not.

### The narration player and the engine

**A lesson page has five speed buttons on it.** Every visual carries one, and so
does the reader. The reader's is named "Narration speed" rather than "Playback
speed" precisely so the two can be told apart, by a screen reader as much as by
a test. Do not tidy the wording back into line.

**A narration section's title and the lesson heading it covers are two
different fields, and sometimes the same words.** `title` is what the player
shows a listener; `heading` is what the lesson calls that part of itself, and
several sections use the same string for both. So those words can appear twice on
a topic page: select the lesson's by role heading, as `apps/web/e2e/topic.spec.ts` does,
because plain `getByText` matches both. Do not be tempted to derive one field
from the other - "Truthiness, and the list worth memorising" is a good thing to
hear and a bad heading.

**There is one audio element and its source is swapped.** Creating an element
per section would be refused by the browser's autoplay policy, because playback
permission belongs to the element that the user gesture reached. A narration
that stops after its first section is this rule being broken.

**The first play of a section takes tens of seconds and every play after it is
instant.** That is the engine, not a bug. `apps/web/e2e/topic-reader.spec.ts` raises its
own timeout for exactly this reason, since the suite empties its speech cache at
the start of every run.

**A lesson heading's `id` is generated from its own words**, by `headingSlug`
in `packages/core/src/headings.ts`, and it is what a narration section points
at.
Rename a heading in `lesson.mdx` and the anchor breaks - but it breaks loudly:
`npm run content:check` runs before every build, names the heading that no longer
exists and suggests the one it probably became. Fix the narration, do not weaken
the check.

**The lesson is marked by mutating the DOM, on purpose.**
`markNarratedSection` walks the rendered article and sets an attribute on the run
of elements belonging to the section being spoken, because MDX compiles a lesson
into one component whose output cannot be mapped over without rendering it, and
re-rendering a whole lesson every time the voice moves on is far worse. A
refactor that "does this properly in React" is the thing this deliberately
avoids. The dimming itself is one rule in `globals.css`.

**`.speech-cache` is gitignored, holds 301 MB and takes most of a working day to
rebuild.** One file per script, addressed by content, and since task 22 pruned
it and task 23 surveyed it the two sides agree exactly: 1417 files on disk
against the 291 narration sections and 1126 question scripts `content:check`
counts. Expect that to part again the moment a script is edited, because the old
recording is orphaned rather than replaced, and `npm run speech:prune` is what
closes the gap. The last group added 114 recordings in about forty-five minutes,
which is the rate to plan against. The app bind mounts this directory, so it is
not a
convenience copy, it is where playback reads from. Deleting it means nothing
plays until `npm run narration:build` has finished, and there is no synthesis
fallback any more, so every listen button says to run the build until it does.

**Question audio is generated, so a prompt or an explanation edited without a
rebuild goes silent.** The key is the hash of the spoken form, so changing a
single word in an explanation orphans that recording. The 502 names the command.
**Do not run `narration:build` in the middle of a task.** Finish the content,
merge it, and then ask Atul whether to record. It is his call, and he may say
no. Nothing breaks by waiting: an unrecorded question is silent until somebody
builds it, and the build is incremental when they do.

**`narration:build` takes a track or a topic, and does nothing without one.**
Run bare it starts the containers, prints the usage line and exits 1, so a
green-looking run that recorded nothing is easy to walk away from. The forms are
`npm run narration:build -- javascript` and `npm run narration:build --
javascript/event-loop`, so a group of four topics is now one command over the
track rather than four.

**It reads the cache to decide it is finished, rather than counting what it
did.** A survey runs before anything is recorded and again at the end, and the
closing line is the second survey speaking. That is deliberate: the reason the
command was widened is that a run was stopped partway, its log was lost, and
nobody could tell afterwards what existed. A tally in a lost log answers nothing
and the disk answers every time.

**Node 26 ships a `localStorage` global that shadows jsdom's and is unavailable
without `--localstorage-file`.** `vitest.setup.ts` puts a working one back, the
same way it does for `matchMedia`. Anything that remembers a preference in a
test depends on that shim.

**`server-only` throws inside the test runner, so a module that imports it
cannot be imported by a _unit_ test.** That is why `apps/web/src/lib/speech/`
puts the
marker on `index.ts` alone and leaves the parts unmarked. Adding
`import 'server-only'` to `narrate.ts` would take the engine's own tests with it.
The integration project aliases the marker away, so a server module can be
imported there.

**An integration test can now call the real module rather than restating its
SQL.** `apps/web/src/db/index.ts` binds the shared connection to `DATABASE_URL` on first
use, which is why `attempts.integration.test.ts` re-writes the SQL it is testing
instead of importing `recordAttempt`. `useTestDatabase` in
`apps/web/src/db/testing.ts`
closes that connection, points the variable at the throwaway database and hands
back the undo, so `progress.integration.test.ts` runs `markTopicLearned` itself.
Two rules come with it: call it in `beforeAll` before anything touches `db`, and
run the undo before `drop()`, because the variable is process wide and vitest
reuses a worker between files. Re-writing SQL in a test is now a choice, and
`attempts.integration.test.ts` is a candidate for the same treatment.

**A Flask app that fails serves an HTML page, and the engine is a Flask app.**
Its recordings and its error pages are not distinguishable by status alone, so
the client checks for `OggS` with `OpusHead` behind it before anything is
written to the cache. Without that check a 500 would be cached under the key of
the script that failed and played as silence forever. This was Piper's own
server labelling audio as `text/html`; the check outlived the reason.

**Empty text makes Piper itself throw a 500**, which is why the script is
checked before the request is made rather than after.

**The `tts` container does not run Piper's HTTP server.** It runs
`services/tts/server.py`, ours, because Piper's only writes WAV and recordings
are stored as Opus. It speaks `/info`, `/synthesize` and `/transcode` and
nothing else, so anything in Piper's own API that a search turns up, voices and
downloads especially, is not there. `opus-tools` in the image is what does the
encoding, chosen over ffmpeg because the whole job is WAV in and Ogg Opus out.

**A recording is `<key>.opus`, so a cache of `.wav` files reads as no cache at
all.** Nothing warns about this: the app resolves the key against `content/` and
re-synthesises, which looks like a cold cache rather than a mistake. `npm run
speech:transcode` converts one, and it is safe to run twice and safe to
interrupt.

**`speech:prune` matches both extensions, and that is load-bearing.** Pruning
has to run before a transcode, or the engine is spent on recordings no current
script hashes to, and that only works if a stale WAV is still something prune
deletes. Do not tighten that regex to `.opus`.

**Opus rules out Safari and nothing else.** Every other browser decodes Ogg
Opus, and the client is Android. If Safari ever matters, the format changes and
the cache is rebuilt from the scripts, which costs synthesis time and nothing
else.

**Changing `PIPER_VOICE` is two steps, not one.** A cache entry is addressed by
the words in the script and not by the voice, so a rebuild alone leaves every
old line playing in the old voice. Delete `.speech-cache` as well. The old
`prep_speech-cache` named volume still exists and is no longer referenced by
anything; `docker volume rm prep_speech-cache` reclaims it.

**The speech engine is behind a compose profile and is off by default.**
`docker compose up` will not start it and `docker compose config --services` will
not list it. Naming it on the command line is enough to start it anyway, which is
what `scripts/with-services.sh` and `scripts/e2e.sh` do, and both stop it again
through a `trap`. Neither script can use `exec` for its final command any more,
or the trap never fires and the container is left running.

**Starting it by hand is the way to author a narration script.** `docker compose
up -d tts` and the `POST /api/speech` fallback works exactly as it used to, so an
edited script plays without a build. Stop it when you are done.

**The first `npm run test:integration` on a clean checkout builds the speech
image**, which downloads a voice model and takes minutes. Every run after that
starts the container in seconds. `scripts/with-services.sh` is the script that
brings it up, renamed from `with-db.sh` because it now brings up two things. The
end-to-end suite needs it too, through `scripts/e2e.sh`.

**The end-to-end suite empties its speech cache at the start of every run**, at
`.speech-cache-e2e`. That is what lets a spec assert a script had to be
synthesised. A spec that reuses another spec's words is asserting nothing, so
every test in `apps/web/e2e/speech.spec.ts` brings its own sentence.

**Which is why `apps/web/e2e/spoken-questions.spec.ts` stubs the audio.** Question
recordings are never built for an e2e run, so the specs route `/api/speech/*` to
`apps/web/e2e/fixtures/silence.opus`. That is a file rather than something the
spec builds, because an Ogg stream is checksummed and cannot be assembled by
hand the way a WAV header could. Regenerate it with `opusenc` in the `tts`
container if it is ever needed at another length. The browser really decodes
this, and `play()` rejecting on a malformed fixture reads exactly like the
button being broken. One spec deliberately does not stub, so the real 404 and
its message are covered.

**`apps/web/e2e/speaking.ts` calls the endpoint with the browser's own `fetch`**, not
Playwright's request fixture, because the fixture would not reproduce the
failure that matters: a browser follows a redirect silently and hands whatever
comes back to the caller as a success.

### The visuals

**End-to-end runs with reduced motion forced on**, through
`contextOptions: { reducedMotion: 'reduce' }` in `playwright.config.ts`. A
visual that starts itself races every assertion about which step is showing. One
spec in `apps/web/e2e/topic.spec.ts` opts back in with `test.use` and asserts that
autoplay happens; leave that one alone. In this version of Playwright
`reducedMotion` is not a top level test option, so it has to go through
`contextOptions` or it will not typecheck.

**Select a visual by its accessible name, not by its text.** A figure's caption
is its accessible name, and lesson prose repeats the words in these captions -
the concept map's branch labels collide with figure titles outright. Use
`page.getByRole('figure', { name: '...' })`. `locator('figure', { hasText })`
will match two figures and fail on strict mode.

**An element that has left is still in the document while it animates out.** An
assertion that runs immediately after a click can see the frame that was just
popped. Wrap it in `waitFor`, as the call stack spec does.

**`layoutId` matches globally across the page.** Two visuals that happened to
label an item the same way would swap elements with each other, so every visual
namespaces its ids with `useVisualNamespace()`. Repeated labels within one
region are a second version of the same problem: the event loop de-duplicates
them, and any new visual that allows repeats has to do the same.

**The lint rules from the React Compiler reject the obvious version of this
code.** No `setState` in an effect body, no reading a ref during render. That is
why `useStepPlayer` keeps its index and direction in one state object and why
`useSearchProbe` derives its reset from the step key instead of writing it.
Tidying either back into the shape it wants to be will fail `npm run lint`.

**The walkthrough's highlight is positioned by arithmetic, not measurement.**
`LINE_HEIGHT` must match the `leading-6` on the code block and `CODE_PADDING`
must match its `p-3`. Change a class, and the band silently stops lining up with
the line it is pointing at.

**The lesson column is capped at about 720px**, so on a normal window every
visual is in its wide layout. The stacked layouts, and the concept map's spine
down the margin, only appear in a narrow window or at high zoom. Check both.

### The question session and its tests

**A question animates out before the next one mounts.** During that gap the
previous question's controls are still in the document. Any end-to-end check that
reads which form is on screen without waiting will act on the question that just
left. `apps/web/e2e/answering.ts` exists for exactly this: use `answerable(page)` to wait,
and `walkToForm` rather than a hand-rolled loop, or the loop will consume the very
question it is looking for. `walkToForm` takes `choice`, `ordering` or `open`.

Waiting for a control to be present is not enough. Answering a question disables its controls without removing
them, so a suite that asks whether an options list is on screen finds the answered
one still animating out and then waits thirty seconds for a disabled button to
become clickable. `answerable` now asks for a control that is still enabled, which
is the thing the outgoing question no longer has. This only shows up once a topic
has two questions of the same form in a row, so it was invisible while closures
was eight open questions followed by three choice ones.

**Answering the last question in a topic finishes the session rather than showing
another one.** A spec that waits for the next question after marking one will hang
if the form it walked to happens to sit last, which is where the one open question
in a converted topic naturally lands. `movedOn(page)` covers both endings; use it
rather than asserting on the "N of M" counter.

**The end-to-end specs share one database and run in order.** Nothing resets
between spec files, so what is in the review queue at any point depends on what
earlier specs did. Do not write an assertion that depends on the queue holding a
particular question or a particular form. Drive from a topic's practice page,
whose order is the content order, when a specific question is needed.

**A failed answer comes back the same day.** The bottom of the ladder is "later
today", four hours out, not tomorrow. Only a passed question is promised to be
gone for the rest of the day, and a test that says otherwise will pass or fail
depending on which form it happened to answer.

**The end-to-end suite is coupled to specific markup.** It selects on the
`data-panel`, `data-exercise`, `data-completed` and `data-streak` attributes and
on the `Answer options` list label; it requires the question prompt to remain
the first `h2` on `/review`; it reads "N of M" as one element's text, so that
string cannot be split across elements; and it navigates by the link names
"Start review" and "Browse topics" on the dashboard. Changing any of these is
fine, but change the test in the same commit.

**Pages stream in behind their `loading.tsx`.** A Playwright check that does not
retry, such as `isVisible()` or `page.content()`, will see the skeleton if it
runs immediately after `goto`. Wait for a real element from the page first.

**`getByText` matches substrings and ignores case.** The ordering question's
prompt contains the words "it prints", which is also the label above the correct
sequence, so an assertion on that label matched the prompt and then matched two
elements once the verdict rendered. Section labels in that component are short
enough to collide with prose; pass `{ exact: true }`.

**No answer reaches the browser before it is given.** `SessionQuestion` carries
the prompt, the code, a choice question's options and an ordering question's pool.
It deliberately carries neither `correctOption`, `correctOrder` nor
`answerInFull`. Grading happens in server actions. A well meaning refactor that
sends the whole question to the client would quietly remove the one guarantee the
session flow has always made.

**`revealQuestion` refuses anything that is not an open question, and that guard
is load bearing.** The answer in full names the correct option, or the correct
sequence, so serving it for a choice or ordering question turns a server action
into a way to read the answer without answering. Server actions are public
endpoints; the component never calling it is not protection. Three integration
tests hold the guard in place, and each was watched failing with the guard
deleted. It was removed by accident once while that function was being rewritten
and caught in review, which is the only reason it is written down here.

Those tests read their question ids off the closures topic rather than naming
them, because converting a topic moves questions between forms and renames them,
and a hardcoded id turns a guard failure into a missing question. If you change
which forms closures contains, they will say so plainly.

### Running it

**Only one thing may touch Docker at a time.** `scripts/with-services.sh` stops
the speech engine on exit, through a trap, whatever else is using it. Running
`npm run test:integration` or `npm run test:e2e` while `npm run narration:build`
is going will kill the build partway through, and the build reports it as the
engine having stopped rather than as something having stopped it. Nothing is
corrupted, because recordings are content addressed and the build skips what it
already has, so running it again carries on. Do not run it in the background and
then do other work.

**`npm run db:reset` drops two schemas, not one.** Drizzle keeps its migration
journal in a schema called `drizzle`, separate from `public`. Dropping only
`public` leaves the journal behind, the next migration decides there is nothing
to do, and you get an empty database with no tables and a confusing seed failure.
`apps/web/src/db/reset.ts` drops both and says why.

**The commit guard reads the whole shell command, not just the message.** The
PreToolUse hook in `~/.claude/hooks/` that keeps assistant references out of
commit text greps everything you typed, so staging the project instructions file
in the same command that commits is refused because of the filename, not the
message. Stage it separately. The same hook fires on this paragraph if you quote
that filename while writing about it.

**Integration tests can import `server-only` modules; unit tests cannot.**
`vitest.config.ts` aliases `server-only` to the package's own empty build for the
integration project, so `apps/web/src/lib/attempts.ts` and anything else marked
server
only can be tested there. The unit project runs in jsdom and deliberately has no
such alias. Put a test for a server module in a `.integration.test.ts` file.

**`apps/web/src/db/index.ts` exports a `Proxy`, on purpose.** Next imports route modules
during the build, when `DATABASE_URL` is absent. Collapsing it into a top level
connection makes the build fail rather than the request.

**Port 3100 belongs to the end-to-end suite, and an interrupted run leaves a
server behind on it.** Playwright starts its own server there and only tears it
down on a clean exit, so a run that is killed, or a second run started while one
is still going, strands a listener. The next run then fails with
`Timed out waiting 120000ms from config.webServer` or
`Process from config.webServer was not able to start`, which reads like a broken
application and is not. Clear it with
`lsof -ti :3100 | xargs kill` before blaming the code. A development server left
running there does the same thing.

**Piping `npm run verify` into anything throws its exit code away.** A shell
pipeline reports the exit status of its last command, so
`npm run verify | tail -30` exits 0 even when Playwright has just failed a test,
and the summary that scrolls past says "1 failed" three lines above a green
looking finish. Redirect to a file and check `$?`, or read the counts rather than
the exit code. This has already produced one "green" run that was not.

**Never run two stages of `verify` at once.** They share port 3100, one Postgres
and one speech cache, so a parallel `test:e2e` does not go faster, it corrupts
both runs.

**Running `verify` in the background counts as running it.** Starting it and then
doing anything else that touches port 3100 or the speech container is the same
mistake as running two stages at once, and it is easier to make because nothing
about the second command looks parallel. Worse, the documented remedy for a
stranded port, `lsof -ti :3100 | xargs kill`, kills the running `verify`'s own
Playwright server, and the tests it had left then fail in ways that read as
application bugs. This has already produced a five-failure run that meant
nothing. Run `verify` in the foreground and wait.

**The development profile only bind mounts the source directories:**
`apps/web/src`, `apps/web/public`, `packages/core/src`, `packages/content/src`
and the curriculum. Everything else, including the manifests,
`apps/web/next.config.ts` and the Dockerfile, is baked into the image. Change one
of those and the stack needs `npm run dev:docker -- --build`.

**Plain `docker compose up` mounts none of them, so it serves the image as it was
last built.** A change to the sources is simply absent until
`docker compose up --build`. This has already cost an afternoon: a feature that had shipped, been
merged and been verified was reported missing from the running application,
because the image predated it. Both profiles do mount `.speech-cache`, since
compose merges volume lists by target.

**Exit 137 from the speech container now means something.** It used to be what
an ordinary stop produced, because the server ignored `SIGTERM` and was killed
after the grace period. A clean stop exits 0, so a 137 means something killed it,
most likely Docker running out of memory. That has happened once, mid-build.
Recordings already made are kept, so running the command again carries on.

**`npm run verify` needs the Docker daemon** for its integration and end-to-end
stages, and both of them start and stop the speech container around themselves.
With Docker Desktop not running, the suite gets as far as the integration stage
and stops on a socket error from `docker compose`, having already printed a green
unit run above it. Read the last line before believing a run, because a failure
there looks nothing like a failing test.

**Internal links go through `AppLink`, not `next/link`.** `AppLink` is what
feeds the global progress bar. The only deliberate exception is
`apps/web/src/app/not-found.tsx`, which renders outside the signed-in shell.

## Conventions

One task, one branch named `<type>/<slug>`, merged into `main` locally with
`--no-ff`, and the branch deleted after. The `TASKS.md` entry is deleted in the
commit that completes it.

`npm run verify` must pass before merging into `main`. There is no CI, so the
pre-commit hook (lint, format check, typecheck, unit tests) and that command are
the entire safety net. The flaky spec above is the one thing standing in the way
of taking that literally: what has been done so far is to re-run the suite and
merge on the green one, having first confirmed the failure is that spec failing
in its usual way. Anything else failing is a real failure.

Commit messages say what was wrong or missing and what was done about it, in
plain sentences. No file by file changelogs, no notes about tests passing.

A Claude Code hook, `commit-text-guard.sh`, rejects em dashes in commit and pull
request text. It is user level tooling rather than part of this repository, but
it will block a commit and the message is easy to misread as a git failure.

Every significant decision gets a numbered file in `docs/decisions/`, and any
documentation the code contradicts is updated in the same commit as the code.

`TASKS.md` carries the whole task rather than a link to one, because there is no
ticket tracker to point at and there is not going to be. `docs/tasks/` holds a
brief when several tasks share one, as the twelve topic conversions do.

`docs/glossary.md` defines the terms the code uses. It was written during the
planning session for the answer forms and it is the fastest way into the
vocabulary: subject against answer form, choice against ordering against open,
answer in full against explanation.
