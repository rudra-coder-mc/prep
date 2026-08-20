# 0025. Confidence is derived from the form, and the ladder climbs

## Status

Accepted. Supersedes the scheduling rule in `0005`, whose ladder and rung
lengths it keeps.

## Context

`0005` built a five rung ladder driven by a confidence rating the user gives
after every answer, and the rung is absolute: rating 5 means fourteen days
whatever happened before it.

`0023` removed every typed answer, and with it the moment where rating your
confidence made sense. On a choice question there is nothing to rate, which
`0011` already recognised by fixing the rating at 3. On an open question you
would be rating your confidence in an answer you never wrote down, before a self
grade that asks the same thing again. Two judgements about one answer, one of
them theatre.

Taking the picker away breaks the schedule, because an absolute rung with a fixed
confidence can never climb. A choice question answered correctly for the tenth
time lands on the same three day rung as the first time. With roughly 117 choice
questions in the converted bank, that is about 39 questions due every day,
permanently, however well the material is known.

## Decision

**Nothing asks for a confidence rating.** The platform derives it from the answer
form and the verdict:

| Form     | Verdict | Confidence |
| -------- | ------- | ---------- |
| choice   | correct | 3          |
| ordering | correct | 4          |
| open     | Passed  | 5          |
| open     | Weak    | 3          |
| any      | wrong   | resets     |

Ordering sits above choice because reconstructing a sequence and rejecting the
distractors cannot be guessed the way one option in four can. Open reaches the
top because it is the only form where the answer was produced rather than
recognised, which is what `0005` reserved the top rung for.

**A graded form climbs one rung at a time.** On a choice or ordering question a
correct answer moves the question up one rung from wherever it currently sits,
capped at fourteen days, and a wrong answer drops it to the bottom. So a choice
question goes four hours, one day, three, seven, fourteen as it keeps being
answered correctly. The derived confidence sets the ceiling that form can reach
in one step, not the rung it lands on.

**An open question keeps the absolute rung.** A self grade of Weak on a question
answered correctly four times is real information, and it should pull the
question back down rather than nudge it up. The self grade is the only judgement
in the platform with a person behind it, so it is trusted to set the rung
outright.

## Alternatives considered

**Keep the picker on open questions only.** It is the one form where a rating is
arguably meaningful, since the answer is unverified. Rejected because Passed,
Weak and Failed already carry it. The three way self grade and a five point
confidence rating are the same judgement asked twice.

**Accept the flat three day cycle and treat the queue as a daily drill.**
Defensible when there is an interview date coming: 39 questions a day is about
twenty minutes and the bank stays warm. Rejected because "cleared" stops meaning
anything if it is unreachable in any lasting sense, and because the platform
outlives any one interview.

**Move to SM-2 now that confidence is machine derived.** An ease factor is the
standard answer to exactly this problem. Rejected for the reason `0005` rejected
it: when a queue misbehaves, one rung up or one rung down is something you can
reason about, and an ease factor is not.

## Consequences

`nextStep` takes the current rung as well as the result, so scheduling is no
longer a pure function of one answer. `review_schedule` already stores the rung,
so nothing new is persisted.

The queue thins as the bank is learned, which is the behaviour `0005` intended
and the fixed confidence of `0011` quietly removed.

A question you have known for months drops to the bottom on one wrong answer,
which is harsh and deliberate. A wrong answer on a four option question means
either you did not know it or you guessed the last four times.

`isConfidence` and the confidence type stay, because the ladder still runs on
rungs one to five. `CONFIDENCE_LABELS` stops being the text on a control and
becomes, at most, a description of a rung on the dashboard.
