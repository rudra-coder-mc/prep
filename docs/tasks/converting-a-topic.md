# Converting a topic to the three answer forms

How to move one topic's questions onto the forms decision `0023` describes. One
topic is one branch and one merge.

This brief outlives the twelve conversions it was written for. Every group added
after them is authored to the same rules, so read it before writing new
questions as well as before converting old ones.

## What a converted topic ships

Ten or eleven questions covering all six subjects: `concept`, `output`,
`debugging`, `coding`, `scenario` and `interview`.

- At most one `open` question, and only on `interview` or `scenario`.
- At least one `ordering` question in any topic where something happens in an
  order. Most topics have one.
- Everything else is `choice`.

Roughly eight or nine choice questions, one ordering, one open.

Every question carries `answerInFull` whatever its form.

## What the topic ships around them

A lesson with at least one visual, two exercises, and a `narration.ts` beside
the lesson.

`order` runs in tens, in teaching order across the whole track, so there is room
to insert later. Renumber the topics below a new one rather than squeezing it in
at 45.

Every narration section names the lesson heading it covers, written exactly as
the lesson writes it, which is what makes the lesson follow the voice. The
content check fails on a heading the lesson does not have. See decision `0016`
for why the script is separate text and `0018` for the anchor.

A group of topics is a branch, not a block of the track: its topics take
whatever positions in the teaching order they belong in, which usually means
splitting the group and renumbering what is already there. See decision `0019`.

A prerequisite carries its technology in it, `javascript/event-loop`, so it can
point at another track. Nothing checks that it exists. See decision `0027`.

## Converting what is already there

**A question that was written and self graded** already has its answer in full,
under the old name. The work is inventing the options. Almost all of these
become choice questions.

**A question that printed several lines** becomes an ordering question. Its old
expected output is the correct sequence. You still have to write the
distractors, because nothing in the existing content has any.

**A question that printed one value** becomes a choice question where that value
is the correct option, and the other three are the values it would print if you
misread it in each of the three most likely ways.

**A question that was already multiple choice** keeps its options and gains the
answer in full it has never had. Its id still ends in `-mcq`, a word nothing is
called any more, so rename it to end in `-choice` while you are in the file. Its short `explanation` usually needs cutting
back once the full answer says the main thing, and sometimes it should go
entirely.

## Writing the wrong options

This is the work. Three options that are obviously wrong turn a question into a
reading test, and the reader learns nothing from getting it right.

A wrong option earns its place when someone who half knows the topic would pick
it. Write the answer a reader gives when they:

- apply the right rule at the wrong time, such as reading a `var` declaration as
  hoisted with its value,
- apply a neighbouring rule, such as arrow function `this` where a method call
  would rebind it,
- stop one step early, such as a promise resolving without the microtask queue
  draining first,
- or remember the common case of an API that has an edge here.

Then say why each one is tempting in the `explanation`. That sentence is most of
what the question teaches.

The correct option is not always first. Vary it.

## Writing the distractors

An ordering question's pool holds lines the program never prints. A distractor
earns its place the same way a wrong option does: it is a line the program would
print if you misread it.

For an event loop question that means the line a callback would print if the
timer fired synchronously. For a coercion question it means the value the other
comparison operator would produce.

The check enforces at least three real lines, at least one distractor, and at
most eight items in the pool.

## Keeping a question open

Only where four options would destroy the point of asking, which is a question
with several valid routes to a good answer. One per topic. If both the
`interview` and the `scenario` question resist conversion, make one of them a
better choice question rather than leaving the topic with two.

The answer in full on an open question carries more weight than anywhere else,
because it is the only thing standing between a self grade and wishful thinking.
Write it as what you had to have said, so marking yourself is a comparison
rather than a feeling.

## Before opening the merge

Run `npm run content:check`, then `npm run verify`.

Nothing has to be recorded. A question edited here is new words, so it is a new
key, and the first person to press play on it gets it made.

## Done when

The topic's questions pass the check, the conversion did not quietly turn hard
questions into easy ones, and every wrong option is wrong for a reason you can
say out loud.
