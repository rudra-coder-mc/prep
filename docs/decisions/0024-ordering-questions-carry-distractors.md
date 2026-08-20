# 0024. An ordering question carries distractors and a fixed display order

## Status

Accepted.

## Context

`0023` replaced typed output with an ordering question: arrange the lines a
program prints into the order it prints them. On its own that form is thin.

Fourteen of the questions that check printed output print more than one line, and
five of those print exactly two. Ordering two items is a coin flip, which is
worse odds than a four option question. Three of the fourteen print the same line
twice, so items cannot be identified by their text. And with every item belonging
in the answer, the last one places itself.

Ordering also has to survive being read aloud. Question audio is built once and
addressed by the hash of its script, so a pool shuffled per session cannot be
recorded. Reading the pool in its authored order would say the answer out loud.

## Decision

**The pool contains lines the program never prints.** Leaving a distractor out is
part of the answer, so the question asks which lines belong as well as in what
order. A two line output with two convincing decoys is a real question again.

**The shape mirrors a choice question.** `items` holds every line in the pool in
the order it is shown, decoys mixed in wherever the author wants them.
`correctOrder` holds the positions of the real lines, in the order they print.
Anything not named in `correctOrder` is a distractor, so decoys need no field of
their own, exactly as wrong options need no field of their own.

**The display order is authored, not shuffled.** It is fixed for a given
question, so the recording can read the pool in the order the screen shows it and
the question stays answerable by ear. That is the same bargain `0011` struck for
choice questions, where the options are also in a deliberate authored order and
the correct one is not always first.

**The browser sends back positions, not text.** Two items reading `hello world`
are position 1 and position 4, so a repeated line grades correctly. The page
never carries `correctOrder`, so the positions reveal nothing.

**Grading is all or nothing**, and the screen never says how many lines are real.
Showing four empty slots would tell you four of the seven items print, which is
most of the answer on a question about what runs. You build a list of whatever
length you believe is right by tapping items in order, and tapping again takes
one back out.

**The content check demands at least three real lines, at least one distractor,
and at most eight items in the pool.** Three because two is a guess. One
distractor because without any the answer is a pure permutation. Eight because a
longer pool tests your memory of the list rather than your reading of the
program.

## Alternatives considered

**Shuffle the pool per session.** Genuinely better practice, since a fixed
arrangement can be memorised by position. Rejected because it makes ordering the
one form that cannot be listened to, and answering by ear is the reason the
question forms were reshaped in the first place. The memorisation risk is also
smaller than it looks: remembering which positions to tap in which order is
remembering the answer, which is what the schedule is trying to produce.

**Give each item an opaque token derived from the question id and its position.**
This was the plan before distractors, to survive duplicate lines. Rejected as
unnecessary once the display order is fixed, because a plain position already
distinguishes two identical lines and reveals nothing.

**Partial credit for a nearly correct order.** Six lines with two adjacent ones
swapped is not the same as no idea. Rejected because scoring it needs a distance
measure and a threshold, and every threshold is arbitrary. A wrong answer shows
the correct order next to the submitted one, which says what was wrong without a
number pretending to measure it.

**Order execution steps rather than printed lines.** A better teaching exercise,
including the steps that print nothing, such as the microtask queue draining.
Rejected for now because it needs a decision about how fine a step is, which is a
judgement the author has to defend on every question. The printed lines write
themselves from output that already exists.

## Consequences

Ordering questions must be authored, not converted. The distractors are the
interesting part and nothing in the existing content has them.

Two fields carry the answer between them. A `correctOrder` that names a position
twice, or a position the pool does not have, is a content check failure rather
than a session that grades nothing correctly.

The form is worth more on the ladder than a choice question, because
reconstructing a sequence and rejecting the decoys cannot be guessed the way one
option in four can. See `0025`.
