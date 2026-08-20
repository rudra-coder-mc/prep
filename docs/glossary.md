# Glossary

The terms this platform uses, and the boundary that separates each one from the
term next to it. Definitions only. How any of it is built is in
`docs/architecture.md` and `docs/decisions/`.

## Question

One thing asked during a practice session, answered once and recorded as an
attempt. A question has a subject and an answer form, which are independent: the
subject says what it is about, the form says how it is answered.

Not to be confused with: an exercise, which is a piece of work you go away and
write, is not timed against a schedule, and produces no attempt.

## Subject

What a question is about, written as its `type`. One of `concept`, `output`,
`debugging`, `coding`, `scenario` or `interview`. The subject decides which
answer forms are allowed but never which one a question uses.

Not to be confused with: difficulty, which says how hard the question is within
its subject.

## Answer form

How a question is answered. One of choice, ordering or open. Every question has
exactly one, and no form accepts typed text.

Not to be confused with: the subject. An `output` question can be a choice
question or an ordering question, and both are still about output.

## Choice question

A question answered by picking one option from a fixed list. The server holds
which option is right and grades the pick, so the answer is never in the page
before the pick is made. The preferred form: anything that can be asked this way
is asked this way.

Not to be confused with: an ordering question, which uses a list of items but
asks for an arrangement of several rather than a pick of one.

## Ordering question

A question answered by arranging items into the one sequence that is correct,
usually the lines a program prints in the order it prints them. The pool holds
distractors as well as real items, so the answer is which items belong and in
what order, not only the order.

Not to be confused with: a choice question, where exactly one item is chosen and
the rest are wrong answers rather than items to leave out.

## Distractor

An item in an ordering question's pool that the program never prints. Leaving it
out is part of the answer, so including one is wrong however well the rest is
ordered.

Not to be confused with: a wrong option on a choice question, which is one of
several answers to the whole question rather than one line of a sequence.

## Open question

A question with nothing to submit. You answer it in your head or out loud,
reveal the answer in full, and record whether you passed, were weak or failed.
The only form the platform cannot grade, and the last resort: it exists for
questions where several routes to the answer are valid and four options would
destroy the point of asking.

Not to be confused with: the old written form, which asked for a typed
explanation before revealing. Nothing is typed in an open question, because a
typed answer nobody grades is a self grade with extra steps.

## Answer in full

What you would say if an interviewer asked the question, carried by every
question whatever its form and shown once the question is answered. Several
paragraphs, and the reason a choice question is worth more than the two seconds
it takes to answer.

Not to be confused with: the explanation, which adds what the answer in full
leaves out rather than saying it again.

## Explanation

What the platform tells you after the answer in full: why a wrong option was
tempting, the follow up an interviewer would ask, the practical consequence. It
is optional, because a question whose answer says everything worth saying does
not need one.

Not to be confused with: the answer in full, which is the thing being tested and
stands on its own.

## Confidence

A rung on the interval ladder, one to five, which decides how long until a
question comes back. Nobody chooses it. The platform derives it from the answer
form and the verdict, and on a graded form it caps how far one correct answer can
climb rather than setting where the question lands.

Not to be confused with: the self grade of Passed, Weak or Failed, which is the
only judgement a person makes and which only an open question has.

## Attempt

One recorded answer to one question: what was submitted, whether it passed, and
the confidence the platform derived from the form and the verdict. Attempts are
only ever inserted, so the history of a question stays readable.

Not to be confused with: the review schedule, which holds one row per question
saying when it is next due, and is overwritten by each new attempt.
