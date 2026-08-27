# 0031. A track remembers the tier you picked, and enrolment follows it

## Status

Accepted.

## Context

Decision `0028` established what a tier is and where it lives: on the question,
picked per track, cumulative, and the thing that decides what marking a topic
learned enrols. It stopped short of saying where the pick is kept or what happens
at the moment it changes, because at the time no question carried a tier and
there was nothing to enrol.

Every question carries one now, so those questions have answers that the code has
to give.

## Decision

**The pick is a row in `track_tier`, one per user per track.** Not
`localStorage`: the mobile client reads the same pick, and a tier that lives in a
browser would be a different tier on a phone. `TASKS.md` already forbids the
platform assuming a browser for this reason.

**A track with no row is on SWE-1.** The default is the bottom of the path
because a tier is a claim about the interview somebody is ready for, and a new
track has produced no evidence for a higher one. Nothing is written when a user
signs up or when a new track appears under `content/`, so a track is on the path
from the moment its directory exists.

**A topic is on the path when the tier covers at least one of its questions.**
Covers means at or below, since tiers are cumulative. A topic asked only above
the pick drops out of the list, and its questions do not enrol.

**A topic off the path is still reachable.** The topic list keeps it in a
collapsed list under the track, named as asked above the pick. Lessons are not
tiered, so hiding one outright would make part of a track unreachable to teach a
promise the lesson never made.

**Changing the pick brings what is already learned up to it.** Every topic in
that track with a `learnedAt` enrols the questions the new tier covers, at the
bottom of the ladder, and everything already scheduled stays exactly where it is.
Without that, a pick would only apply to topics learned after it, and stepping up
would mean re-marking every topic by hand.

**Going back down enrols nothing and removes nothing.** A question already on the
ladder is one somebody has started remembering, and dropping it would throw that
work away over a change of plan. The pick still decides what enrols next, so
going down narrows the future rather than editing the past.

**A topic's status is measured against what the tier covers.** Progress is the
share of the in-scope questions that are passing, and an attempt on a question
above the pick counts toward nothing. Otherwise picking SWE-1 would cap every
topic at a fifth of a bar it can never fill, and a staff question failed last
month would keep a SWE-1 topic reading weak.

## Alternatives considered

**The pick in `localStorage`.** No table and no migration. Rejected because the
mobile client needs the same pick, and because a tier the platform cannot see is
a tier readiness cannot be measured against.

**Making the pick explicit before anything enrols.** Asking on first use, with no
default. Rejected as a gate in front of the one loop the platform exists for. The
picker is on the topic list, in the track header, which is where somebody looks
when the list is not what they expected.

**Unenrolling on the way down.** Symmetrical, and wrong: it deletes ladder
progress that took days of correct answers to build, on a click that was probably
curiosity.

**Recomputing enrolment on every page rather than storing schedule rows.**
Rejected because the ladder is per question and already stored, and a derived
enrolment would have nowhere to keep the interval step.

## Consequences

The topic list is now a shorter list. Thirty-six of the 43 topics have a `swe-1`
question, so the default pick hides seven of them, and the SWE-1 path is 80
questions rather than 466. That is the feature working, and it is also the first
time the platform will look emptier after a change than before it.

The dashboard counts what the tier covers, so its totals move when a pick moves.
Two numbers that used to be constant, the topic count and a topic's question
count, are now per user and per track.

Practice is untouched. Opening a topic's practice page still walks every question
it has, at any tier, because practice is not enrolment and nothing there is
scheduled or scored against a promise. If that turns out to be the wrong call, it
is a filter on one page rather than a change to this decision.
