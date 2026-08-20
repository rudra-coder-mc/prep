# 0011. Multiple choice questions grade themselves

## Status

Accepted, then superseded in part.

`0023` removed every typed answer, so the ban on a multiple choice question
carrying a written answer no longer holds: every question now carries an answer
in full whatever its form. `0025` replaced the fixed confidence of 3 with a rung
that climbs. What survives is the shape of the form itself, and the rule that the
correct option never reaches the browser before an answer is submitted.

## Context

Every question in V1 is answered by typing an explanation, revealing the
expected one, and marking yourself Passed, Weak or Failed. That is the right
mechanism for "explain closures", and `0005` and the evaluation section of
`docs/architecture.md` say why. Grading free text technical answers reliably is
harder than the rest of this platform combined, and honest self assessment does
not need a machine.

It is the wrong mechanism for a question with four options and one right answer.
There is nothing to assess. Worse, the ceremony is the problem. The point of
drilling multiple choice before an interview is speed, and a reveal step plus a
self grade plus a confidence rating turns a two second question into a fifteen
second one.

Multiple choice also makes answering by ear possible, which written questions
never will.
A prompt and four options can be read aloud and answered with one tap; a
question that needs a typed paragraph cannot.

## Decision

A new `mcq` question type carrying `options` and `correctOption`. Choosing an
option submits it. The server grades it, records the attempt, and returns the
verdict with the explanation in one round trip.

**The correct option never reaches the browser before an answer is submitted.**
`SessionQuestion` carries the options but not which one is right, exactly as it
already carries the prompt but not the expected answer. Grading happens in a
server action, so the answer is not in the page to be read.

**No self assessment and no confidence rating.** A choice is right or wrong, so
`weak` never applies and the ladder only ever sees a pass or a reset. Attempts
are recorded at a fixed confidence of 3.

Three, rather than 5, because recognising the answer among four is weaker
evidence than recalling it unprompted. A correct multiple choice answer buys
three days, where a confident written explanation buys fourteen. Nothing asks
the user to rate a question this fast; being asked is what would make it slow.

**The two shapes are mutually exclusive in the schema.** A question with options
must not carry an `expectedAnswer`, and a question without them must. A wrong
`correctOption`, duplicated options, or fewer than two of them fails the content
check rather than the study session.

## Alternatives considered

**Keep the confidence rating on multiple choice.** It would keep the ladder
uniform, and there is a real argument that a lucky guess and a certain answer
should not schedule identically. Rejected because speed is the entire reason
this question form exists, and one extra tap per question is the difference
between drilling forty questions and drilling fifteen. The fixed confidence of 3
is the compromise. No correct answer in this form can jump to the top of the
ladder, so a guess is capped rather than trusted.

If that turns out to distort the schedule in practice, the honest fix is to
reintroduce a rating only on a wrong answer, where the interval matters most.

**Derive the expected answer from the correct option, and reuse the existing
reveal flow.** Less new code, but it makes `expectedAnswer` mean two different
things and leaves the self grade buttons on a question that has already been
graded. The user would be asked to mark themselves Passed on an answer the
machine already knows is wrong.

**Store the correct index on the client and grade there.** One less round trip
and instant feedback. Rejected because the answer would be in the page, and the
one thing the session flow has protected from the beginning is that you cannot
see the answer before committing to one.

## Consequences

`Question['expectedAnswer']` is now optional, so anything reading it has to say
which shape it expects. `revealQuestion` throws if asked to reveal a multiple
choice answer rather than returning something empty, since that call is a bug at
the call site.

There are now two question forms in one session component, and a session can mix
them freely. The queue does not care, because both write the same `attempts`
row, so the streak, the dashboard and the interval ladder needed no changes at
all.

Authoring cost goes up. A good multiple choice question needs three wrong
options that are wrong for interesting reasons, which is harder to write than a
model answer and is where the value of the question actually sits.
