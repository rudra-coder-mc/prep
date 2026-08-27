# Handoff

State of the work for whoever picks it up next. `TASKS.md` owns what is pending,
`docs/architecture.md` owns how the system is put together, and
`docs/decisions/` owns why. This file covers the things neither of those record:
what is in flight, and what will bite you.

## Where this stands

`main` holds the browser track, merged from
`feature/the-browser-not-the-language`. The repository has no git remote, and no
task tracker either. Both are deliberate; see the hard rule in `CLAUDE.md`, which
covers every hosted service rather than only the company GitLab.

Verified green there: `npm run verify` exited 0 through lint, format check,
typecheck, 310 unit tests, 26 integration tests against real Postgres and a real
speech engine, the production build, and 52 Playwright end-to-end tests. The
content check reports 43 topics, 466 questions, 86 exercises, 269 narration
sections and 932 question scripts. Re-run `verify` rather than trusting any
figure you read anywhere, including here, and read the section on piping it
before you do.

The platform is an interview preparation tool built around one loop: read a
topic, mark it learned, answer recall questions on a schedule. The shell names no
technology. Every topic can be listened to, the lesson shows which part of itself
is being spoken, and every question and its answer can be listened to as well.

**The platform is done and the remaining work is content.** No question takes
typed input: every one is a choice question, an ordering question or an open
question, at most one open per topic and only on an `interview` or `scenario`
subject, and `npm run content:check` fails a build that breaks either rule.
Nothing in the schema, the session flow or the speech pipeline is waiting on
anything.

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
cost nothing in `src/`: the label is the title cased directory name, the topic
list grew a second section by itself, and the dashboard counted two tracks
without being told. A topic's prerequisites now point across a track boundary,
and nothing checks that the topic on the other end exists.

## In flight

**Nothing is half done.** The working tree is clean at the head of `main`.

**Twelve merged branches were never deleted**, which the conventions below say
should happen: `docs/measured-question-audio-cost`, `feature/classes`,
`feature/collections-and-iteration`, `feature/errors`,
`feature/javascript-functions-group`, `feature/modules-and-the-runtime`,
`feature/spoken-questions`, `feature/the-browser-not-the-language`,
`fix/a-404-that-outlives-the-missing-recording`,
`fix/recordings-the-container-cannot-see`, `improvement/speech-engine-on-demand`
and `improvement/unslop-content`. All of them are merged into `main`, so deleting
them loses nothing. Nobody has done it because permission was never asked for.

## The next action

**There is no next action, and that is the state to understand before choosing
one.** `TASKS.md` has nothing scheduled in it. Everything left in it is real work
left unordered on purpose, each item needs breaking down before it is
actionable, and none of it should be picked up as "the next task" without
discussing it first: the browser runners, the `prep` CLI and its verdict
endpoint, a backup for the one database nobody can reproduce, the other nine
tracks, and the unused `shiki`.

The open items below are a second source of candidates, and two of them are
close to actionable. The em dash sweep over `content/` is a branch of its own
with nobody on it. And nobody has yet listened to a question read aloud and
judged whether it works, which is the cheapest way left to find out whether the
audio is worth what it cost.

Any content work is authored to `docs/tasks/converting-a-topic.md`. That brief was written for the twelve
conversions and outlives them: every group since has been written to it.

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
- **A group is a branch, not a block of the track.** Its topics take whatever
  positions in the teaching order they belong in, which usually means splitting
  the group across the track and renumbering everything below it. The memory
  group put its four topics in three different places and renumbered fourteen.
  See `docs/decisions/0019-a-group-is-a-branch-not-a-block-of-the-track.md`.
- **Build the audio last.** A recording is keyed by the hash of its spoken text,
  so a question edited after `npm run narration:build` was started is simply not
  recorded, and catching up costs another pass over the whole bank. Finish the
  content, run `content:check`, then build the audio, then `verify`.

Do not start by reading the schema. The schema is finished and the work is
authoring: three wrong options that are wrong for interesting reasons is the part
that teaches something, and it is required on nearly every question in the bank.

## Open items

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
`improvement/unslop-content` cleaned the original twelve topics, and the newest
group added two more in option text. The house style forbids them. Nobody owns
the sweep, and doing it as one pass over `content/` is a branch of its own.

**Nobody has listened to a question read aloud and judged whether it works.**
The pipeline is verified end to end, the recordings are valid WAV and the right
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
`src/content/loader.ts`. Cosmetic, only appears under Vitest, pre-existing.

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
`e2e/speech.spec.ts` now covers the endpoint from inside a real page, and that
spec was checked by reverting the middleware fix and watching it fail. A
regression test nobody has seen fail is a guess.

**`npm run test` does not typecheck, and the Docker build does.** A `Uint8Array`
that TypeScript considers possibly backed by a `SharedArrayBuffer` passed every
unit test and failed the image build. That is the reason for the `Audio` type
alias in `src/lib/speech/audio.ts` and the warning in its comment. Run
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

**Never add a git remote, and never push.** The self-hosted GitLab belongs to
the company and this is a personal project. `CLAUDE.md` states the rule in full.

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
a topic page: select the lesson's by role heading, as `e2e/topic.spec.ts` does,
because plain `getByText` matches both. Do not be tempted to derive one field
from the other - "Truthiness, and the list worth memorising" is a good thing to
hear and a bad heading.

**There is one audio element and its source is swapped.** Creating an element
per section would be refused by the browser's autoplay policy, because playback
permission belongs to the element that the user gesture reached. A narration
that stops after its first section is this rule being broken.

**The first play of a section takes tens of seconds and every play after it is
instant.** That is the engine, not a bug. `e2e/topic-reader.spec.ts` raises its
own timeout for exactly this reason, since the suite empties its speech cache at
the start of every run.

**A lesson heading's `id` is generated from its own words**, by `headingSlug`
in `src/content/headings.ts`, and it is what a narration section points at.
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

**`.speech-cache` is gitignored, holds 2.7 GB and takes most of a working day to
rebuild.** One file per script, addressed by content: 241 narration sections and
844 question recordings, plus the orphans left behind by every edited script. The
last group added 114 recordings in about forty-five minutes, which is the rate to
plan against. The app bind mounts this directory, so it is not a
convenience copy, it is where playback reads from. Deleting it means nothing
plays until `npm run narration:build` has finished, and there is no synthesis
fallback any more, so every listen button says to run the build until it does.

**Question audio is generated, so a prompt or an explanation edited without a
rebuild goes silent.** The key is the hash of the spoken form, so changing a
single word in an explanation orphans that recording. The 502 names the command.
Running `narration:build` after content work is now part of finishing it.

**Node 26 ships a `localStorage` global that shadows jsdom's and is unavailable
without `--localstorage-file`.** `vitest.setup.ts` puts a working one back, the
same way it does for `matchMedia`. Anything that remembers a preference in a
test depends on that shim.

**`server-only` throws inside the test runner, so a module that imports it
cannot be imported by a test.** That is why `src/lib/speech/` puts the marker on
`index.ts` alone and leaves the parts unmarked, and why
`attempts.integration.test.ts` reimplements its SQL rather than calling the
module it is testing. Adding `import 'server-only'` to `narrate.ts` would take
the engine's own tests with it.

**Piper answers with `Content-Type: text/html` even when the body is a WAV.**
Its recordings and its Flask error pages are indistinguishable by header, so the
client checks for a `RIFF....WAVE` prefix before anything is written to the
cache. Without that check a 500 would be cached as audio and played forever.

**Empty text makes Piper itself throw a 500**, which is why the script is
checked before the request is made rather than after.

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
every test in `e2e/speech.spec.ts` brings its own sentence.

**Which is why `e2e/spoken-questions.spec.ts` stubs the audio.** Question
recordings are never built for an e2e run, so the specs route `/api/speech/*` to
a WAV they construct themselves. Construct it, do not paste a truncated header:
the browser really decodes this, and `play()` rejecting on a malformed fixture
reads exactly like the button being broken. One spec deliberately does not stub,
so the real 404 and its message are covered.

**`e2e/speaking.ts` calls the endpoint with the browser's own `fetch`**, not
Playwright's request fixture, because the fixture would not reproduce the
failure that matters: a browser follows a redirect silently and hands whatever
comes back to the caller as a success.

### The visuals

**End-to-end runs with reduced motion forced on**, through
`contextOptions: { reducedMotion: 'reduce' }` in `playwright.config.ts`. A
visual that starts itself races every assertion about which step is showing. One
spec in `e2e/topic.spec.ts` opts back in with `test.use` and asserts that
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
left. `e2e/answering.ts` exists for exactly this: use `answerable(page)` to wait,
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
`src/db/reset.ts` drops both and says why.

**The commit guard reads the whole shell command, not just the message.** The
PreToolUse hook in `~/.claude/hooks/` that keeps assistant references out of
commit text greps everything you typed, so staging the project instructions file
in the same command that commits is refused because of the filename, not the
message. Stage it separately. The same hook fires on this paragraph if you quote
that filename while writing about it.

**Integration tests can import `server-only` modules; unit tests cannot.**
`vitest.config.ts` aliases `server-only` to the package's own empty build for the
integration project, so `src/lib/attempts.ts` and anything else marked server
only can be tested there. The unit project runs in jsdom and deliberately has no
such alias. Put a test for a server module in a `.integration.test.ts` file.

**`src/db/index.ts` exports a `Proxy`, on purpose.** Next imports route modules
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

**The development profile only bind mounts `src/`, `content/` and `public/`.**
Everything else, including `package.json`, `next.config.ts` and the Dockerfile,
is baked into the image. Change one of those and the stack needs
`npm run dev:docker -- --build`.

**Plain `docker compose up` mounts none of them, so it serves the image as it was
last built.** A change to `src/` is simply absent until `docker compose up
--build`. This has already cost an afternoon: a feature that had shipped, been
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

**Internal links go through `AppLink`, not `next/link`.** `AppLink` is what
feeds the global progress bar. The only deliberate exception is
`src/app/not-found.tsx`, which renders outside the signed-in shell.

## Conventions

One task, one branch named `<type>/<slug>`, merged into `main` locally with
`--no-ff`, and the branch deleted after. The `TASKS.md` entry is deleted in the
commit that completes it.

`npm run verify` must pass before merging into `main`. There is no CI, so the
pre-commit hook (lint, format check, typecheck, unit tests) and that command are
the entire safety net.

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
