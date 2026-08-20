# 0023. Every question is answered, never typed

## Status

Accepted. Supersedes part of `0011`, which forbade a multiple choice question
from carrying a written answer.

## Context

A practice session had three ways to answer, and two of them took typed text.

Sixty two of the 130 questions asked for an explanation in a textarea, revealed
the model answer, and then asked you to mark yourself Passed, Weak or Failed.
Nothing reads the text back. The textarea is a place to put an answer nobody
grades, and the record it produces is what you decided about yourself, not what
you knew.

Thirty one asked you to type what a program prints, and 27 of those checked it
against the real output. That check is honest and it is also wrong about the
wrong things. `normaliseOutput` exists because the comparison kept failing over
indentation, repeated spaces, curly quotes and trailing newlines, none of which
are the answer. Every loosening of it makes it accept more genuinely wrong
answers, and it still fails you for writing `a` where the program printed `'a'`.

The platform is preparation for an interview. What you need at the end of a
question is not a mark, it is the paragraph you would have said out loud.

## Decision

**No question takes typed input.** A question is answered by one of three forms,
and the form is the field `form`:

- `choice`, one option from a fixed list. Preferred: anything that can be asked
  this way is asked this way.
- `ordering`, items arranged into the sequence a program prints. See `0024`.
- `open`, nothing to submit. Read the question, answer it in your head or out
  loud, reveal the answer, mark yourself.

**Subject and form are separate fields.** `type` keeps `concept`, `output`,
`debugging`, `coding`, `scenario` and `interview`, and loses `mcq`. What a
question is about and how it is answered were never the same axis, and `mcq` sat
in the subject list only because nothing else had claimed the slot. An `output`
question can now be a choice question or an ordering question and is still about
output.

**`open` is the last resort and the content check enforces it.** Allowed only on
`interview` and `scenario`, and at most one per topic. Every topic has exactly
one question of each of those subjects today, so the cap forces a real choice
between them. Without a limit that binds, `open` becomes whatever was too much
work to convert, and the platform is self graded again.

**Every question carries `answerInFull`, whatever its form.** It is what you
would say if an interviewer asked, several paragraphs, and it is shown once the
question is answered. It is the reason a two second choice question is worth
asking. The field is the old `expectedAnswer` renamed, because nothing is
expected of the reader any more.

**`explanation` becomes optional and means only what the answer leaves out.**
Why a wrong option was tempting, the follow up an interviewer would ask, the
practical consequence. An explanation that restates the answer should be shorter
or absent.

`expectedOutput` is removed. An ordering question's output is its items in their
correct order, and a single value the program prints is a choice question where
that value is the correct option.

## Alternatives considered

**Keep the written form for interview questions.** The smallest change, and it
keeps the one exercise where writing the answer out is genuinely useful.
Rejected because the writing is not the problem. The problem is that nothing
reads it, so the textarea adds fifteen seconds and produces no evidence. The
`open` form keeps the exercise and drops the ceremony: you still have to answer
before you look, you just do not type it.

**Grade free text with a language model.** It would make every question gradeable
and keep the richest answer form. Rejected because it needs a hosted service and
this project does not talk to one, and because a grader that is wrong now and
then is worse than one that does not pretend to grade. A wrong pass is a question
that stops coming back.

**Keep typed output with a more forgiving comparison.** Rejected because the
direction of travel is bad. Every rule added to `normaliseOutput` widens what it
accepts, and the failures it was fixing were never about whether the answer was
right.

## Consequences

All 130 questions are rewritten, one topic per branch. The 62 written questions
already carry the answer in full, so their work is authoring options. The 37
existing choice questions have only a short explanation and need an answer
written. The 27 output questions split between ordering and choice.

A large amount of code is deleted rather than changed: the written form and its
textarea, the confidence picker, `revealQuestion`, the free text path through
`recordAttempt`, `matchesExpectedOutput` and `normaliseOutput`.

`attempts.answer` stops holding prose. It holds the chosen option, or the
positions submitted for an ordering question.

Every question's audio key is derived from its text, so all 260 question
recordings are rebuilt. The build skips what it already has, so this happens one
topic at a time rather than in one fifty minute run.

Authoring gets harder, which is the point. Three wrong options that are wrong for
interesting reasons is the part of a question that teaches something, and it is
now required on nearly every question in the bank.
