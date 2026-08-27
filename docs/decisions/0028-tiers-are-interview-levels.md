# 0028. A tier is an interview level, and it lives on the question

## Status

Accepted.

## Context

The platform is a flat bank. Marking a topic learned enrols every question in it,
and the 466 questions carry a `difficulty` of `easy`, `medium` or `hard` that
nothing reads except a chip on the screen. Ninety-seven are easy, 266 are medium,
103 are hard, and 35 of the 43 topics are labelled medium, which says nothing
about anything.

That is a collection of questions rather than a path through them. The owner has
two years of professional experience and is preparing to interview one level
above it. Being handed a staff-level question about what a closure keeps alive,
in the same session as a question about what a closure is, is not a difficulty
problem. It is being asked something no interview at the level being prepared for
would ask, which costs confidence and teaches nothing yet.

What was wanted instead was a promise: finish this tier and you can walk into
that interview. A promise has to be checkable by the software, and it has to be
grounded in what those interviews actually ask, or it is decoration.

## Decision

**Four tiers, named after the roles interviews hire for.**

- `swe-1`, zero to two years. The screen. One concept at a time, definitions, what
  this prints. Failing here means not knowing the language.
- `swe-2`, two to five years. The working developer round. Two concepts
  interacting, the common bug, broken code to fix.
- `senior`, five and up. Trade-offs and judgement, where "it depends" is the
  correct answer and the interview is about what it depends on.
- `staff`, senior and beyond. Internals, failure modes and cost. Honestly, this
  is the deep end of a senior loop rather than a whole interview level, because a
  real staff loop is mostly system design and behaviour, which this platform does
  not cover.

The tier is the candidate level, not the round type. Screen against onsite is a
distinction this platform does not make.

**Tiers are cumulative.** Preparing for `swe-2` means the `swe-1` and `swe-2`
questions together.

**`tier` replaces `difficulty`** on the question, and topic difficulty is deleted
outright.

**The tier lives on the question. A topic has no tier of its own.** A topic
belongs to a tier when it has at least one question at that tier. Closures is
asked at every level and appears at every level. Weak references has no `swe-1`
question and so is not part of `swe-1`. Topic scope follows from the questions
rather than from a second list that would have to be kept in step with them.

**Picking a tier changes what is enrolled and what counts as done**, not what the
daily queue filters. Marking a topic learned at `swe-2` puts its `swe-1` and
`swe-2` questions on the interval ladder and leaves the rest alone. The topic
reads as done when what was enrolled is passing. Stepping up a tier enrols the
newly in-scope questions at the bottom rung and leaves everything already
scheduled where it is.

**Lessons are not tiered.** Every lesson stays one document, traps and interview
angle included. Reading something above your level costs nothing, because nobody
is marking you. Being asked something you cannot answer is what damages
confidence, and questions are what carry the tier.

**Exercises are not tiered, and they keep `difficulty`.** An exercise is
practice you sit down and write, so what varies between two of them is how long
it takes and how much of the topic it uses. That is not a level of interview,
and giving it one would claim a promise the exercise does not make. The two
scales now name different things on different objects, which is why keeping both
words does not repeat the mistake this decision was written to fix.

**The tier is picked per track, not once for the platform.** Being SWE-2 in
JavaScript and SWE-1 in React is the ordinary state of a person, and enrolment is
a per-track decision already.

**Advancing is offered, never automatic.** A tier reaching full readiness says so
and waits. Stepping up silently would enrol a few hundred questions and triple
the next morning's queue with no warning.

**Readiness is the promise, and it is measured on the ladder.** A question counts
toward a tier's readiness once its schedule sits at step 3 or higher, which is
three correct answers spread over at least four days. Answering once is
recognition; this platform exists because recognition and recall are different
things.

## Alternatives considered

**The tier on the topic.** Simpler to store and wrong at the first example. It
produces a `swe-1` track with no closures in it, which no interview resembles.

**`tier` beside `difficulty` rather than replacing it.** Cheaper today, because
nothing has to be re-tagged. Rejected because two scales on the same object
always drift, and the first easy staff question makes both untrustworthy.

**Filtering the daily queue instead of enrolment.** Enrol everything, show only
your tier. Rejected because the queue is the thing that costs time every day, and
this leaves hundreds of scheduled questions permanently due and invisible.

**Base, intermediate, high and master.** The names the idea arrived with.
Rejected because nobody interviews for master, and a name that maps to no real
job cannot settle an argument about which tier a question belongs to.

**Readiness as "answered correctly once".** Rejected for the reason the interval
ladder exists at all.

**Tiering lesson sections.** Rejected on cost. It triples the authoring work per
topic and splits the one document that currently reads as a single thought.

## Consequences

The 266 medium questions have to be split by hand between `swe-2` and `senior`.
`easy` and `hard` map across mechanically. This is the real price of the feature
and it is content work, not code.

That estimate was half right, and the half it got wrong is worth recording. The
bank finished at 80 SWE-1, 254 SWE-2, 73 senior and 59 staff. `easy` did map
mostly to `swe-1`, 69 times out of 97. `hard` mapped nowhere: it split 37 SWE-2,
27 senior and 39 staff, because a famous gotcha is hard to answer and still the
ordinary working-developer round. Every one of the 103 had to be read. The rule
that settled the hard calls is now in `docs/tasks/converting-a-topic.md`, which
is where a new question is authored against it.

Four tiers over 43 topics is roughly two questions per tier per topic, which
cannot carry the promise. The bank has to grow, and it grows at `swe-1` and
`swe-2` first, because those are the levels being prepared for. `senior` and
`staff` stay thin on purpose and must show their real counts on screen so a thin
tier is visible rather than pretended.

Every existing attempt counts immediately. Attempts and schedules are keyed by
question, so tagging a question `swe-1` makes whatever history it already has
count toward `swe-1` readiness with no migration of progress.
