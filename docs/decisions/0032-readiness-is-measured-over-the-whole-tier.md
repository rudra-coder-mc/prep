# 0032. Readiness is measured over the whole tier, not over what you enrolled

## Status

Accepted.

## Context

Decision `0028` made the promise: finish a tier and you are prepared for that
level of interview. It said readiness is measured on the interval ladder, and
that a question counts once its schedule sits at step 3 or higher. It did not say
what the share is a share of, and there are two defensible answers that give
wildly different numbers.

Somebody who has marked one topic learned and answered its four SWE-1 questions
correctly three times over a week is either 100% ready or 5% ready, depending on
which denominator the platform picks.

## Decision

**The denominator is every question the tier covers on the track**, whether or
not its topic has ever been opened. A tier is a claim about an interview, and an
interview does not restrict itself to the topics somebody chose to enrol. The
enrolled-only reading measures effort, which the streak already does.

**The count is shown beside the share.** "18 of 74 questions retained" rather
than "23%" on its own. Senior and staff are deliberately thin, and a thin tier
reads as a confident percentage of almost nothing unless the number it is drawn
from is on screen next to it. This is the same reason `content:check` prints the
count at each tier.

**Readiness is per track**, because the tier is per track. There is no single
number for the platform, and there should not be one: being ready for a SWE-2
JavaScript round says nothing about React.

**A finished tier offers the next one, says what accepting costs, and waits.**
The offer names how many questions stepping up enrols, because the whole reason
advancing is not automatic is that it lands a few hundred questions in tomorrow
morning's queue. An offer that does not say by how much is the same surprise with
a button on it.

**That number is what lands in the queue, not what the tier covers.** Stepping up
enrols the newly covered questions of the topics already marked learned and
reaches no others, so counting the whole of the next tier would overstate the
cost by every topic nobody has opened. The topics that join the path enrol when
they are marked learned, the same as at any other tier.

**Step 3 is the bar, and one form reaches it faster.** Three correct answers
spread over at least four days is what step 3 means for a choice or ordering
question, which climb a rung at a time. A self graded open question is placed by
its grade rather than moved, so one Passed puts it at the top of the ladder. That
is left alone: a person judging their own explanation is the strongest evidence
this platform collects, and `0023` caps a topic at one open question, so the
effect on any tier's readiness is small.

## Alternatives considered

**The share of enrolled questions.** Flattering and useless. It reaches 100% the
moment somebody finishes the questions they happen to have started, which is a
claim about diligence rather than about an interview.

**The share of topics that read as mastered.** Rejected because topic status is
computed from recent attempts rather than from the ladder, so it moves on a good
morning and moves back on a bad one. Readiness has to be the slower number or the
promise is worth nothing.

**Counting a question once it has been answered correctly at all.** Rejected for
the reason the interval ladder exists: recognition is not recall, and this
platform was built because those two are different.

**Advancing automatically at 100%.** Rejected in `0028` and rejected again here
once the size was visible. Stepping the JavaScript track from SWE-1 to SWE-2
enrols 177 questions at once on today's bank, and puts seven more topics on the
path behind them.

## Consequences

Readiness starts near zero and stays there for a long time. Seventy-four SWE-1
questions on the JavaScript track have to reach step 3, each taking at least
three correct answers spread over four days, so the number will read as brutal
before it reads as encouraging. That is the honest shape of the claim, and
softening it would be softening the promise.

The dashboard's track cards now lead with readiness, and the mean topic progress
they used to show is gone. Two bars measuring nearly the same thing is worse than
one bar measuring the real one, and per-topic progress is still on the topic list
where a topic is chosen.

The step-up offer cannot be reached end to end. Getting a track to full readiness
means putting every question it covers at step 3, which no browser session can do
in a test, so the offer is covered by `src/lib/dashboard.integration.test.ts`
placing rows on the ladder directly. The end-to-end suite asserts only that
nothing is offered while a tier is unfinished.
