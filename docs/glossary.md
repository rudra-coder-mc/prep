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

Not to be confused with: the tier, which says which level of interview asks a
question. A `concept` question exists at every tier.

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

## Track

Every topic under one technology, and the unit a tier is picked on. Being SWE-2
in JavaScript and SWE-1 in React is the ordinary state of a person, so the pick
belongs to the track rather than to the platform. A track is a directory under
`content/`, which is why adding one is a content change.

Not to be confused with: a topic, which is one subject inside a track and carries
no tier of its own.

## Tier

The level of interview a question belongs to, and the level a learner is
preparing for. One of `swe-1`, `swe-2`, `senior` or `staff`, named after the
roles interviews hire for rather than after how hard a question feels.

Every question carries exactly one. A topic carries none: a topic belongs to a
tier when it has at least one question at that tier, so the topics somebody sees
follow from the questions rather than from a second list. Tiers are cumulative,
so preparing for SWE-2 means the SWE-1 and SWE-2 questions together.

The tier is picked per track and remembered, and a track nobody has picked on is
on SWE-1.

Not to be confused with: the subject, which says what a question is about and is
independent of level.

## SWE-1

The first tier. Zero to two years, and the round that decides whether somebody
knows the language. One concept at a time, definitions, and what a piece of code
prints.

Not to be confused with: SWE-2, which asks about two concepts meeting.

## SWE-2

The second tier. Two to five years, and the round about being a working
developer. Two concepts interacting, the bug that actually happens, and broken
code to fix.

Not to be confused with: Senior, which asks what you would do instead, rather
than what went wrong.

## Senior

The third tier. Five years and up. Trade-offs and judgement, where "it depends"
is the correct answer and the interview is about what it depends on.

Not to be confused with: Staff, which asks what it costs and how it fails rather
than which option to take.

## Staff

The fourth tier. Internals, failure modes and cost, and the follow-up after the
follow-up. It is the deep end of a senior loop rather than a whole interview
level, because a real staff loop is mostly system design and behaviour, which
this platform does not cover.

Not to be confused with: Senior, whose questions have a decision at the end of
them.

## Enrolment

Putting a question on the interval ladder, which is what marking a topic learned
does. Only the questions the track's tier covers are enrolled, so enrolment is
where a picked tier stops being a label and starts deciding what somebody is
asked each morning.

Not to be confused with: the daily queue, which decides which of the enrolled
questions are due today.

## Readiness

How much of a tier somebody has retained, and the only thing behind the claim
that they are prepared for that level of interview. A question counts toward
readiness once its place on the interval ladder reaches step 3, which takes three
correct answers spread over at least four days.

It is measured per track, over every question the tier covers rather than over
the ones enrolled so far, because an interview does not restrict itself to the
topics somebody chose to open.

Not to be confused with: a topic's status, which describes one topic, or the
streak, which describes attendance rather than knowledge.
