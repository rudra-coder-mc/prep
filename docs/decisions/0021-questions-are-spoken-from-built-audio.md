# 0021. A question is spoken from its own words, and only from built audio

## Status

Accepted, amended by `0029`. A question is still spoken from a key rather than a
script, and the key is now resolved against the content on the server and
synthesised, so nothing tells the reader to run a command.

## Context

Decision 0016 said a narration is separate text, written to be heard, because a
lesson read out verbatim sounds like a document being read. Every lesson
therefore carries a hand-written `narration.ts`.

Questions were left out of that, and the pending task in `TASKS.md` assumed they
would be synthesised on demand when a play button was pressed. Two things have
changed since it was written. Decision 0017 made every recording ahead of time,
and decision 0020 took the speech engine out of the running stack, so there is
no engine to synthesise anything at the moment a button is pressed.

There is also a reason not to hand-write scripts for questions. There are 130 of
them, each needing two, and a question is not a document: it is a sentence
somebody asks out loud. Reading a prompt verbatim is exactly right. What is not
right is reading its code.

## Decision

**A question's audio is generated from the text it already carries.** No new
field, no second copy to keep in step with the first. `src/lib/speech/spoken-question.ts`
turns a `Question` into two scripts.

**Two recordings per question, not one and not seven.** One holds the prompt and,
for a multiple choice question, every option in turn, so it can be answered by
ear in a single play. The other holds the answer and the explanation, so a
reveal is one press.

**Code is left on the screen and named rather than read.** A blank line
separated paragraph containing any indented line is code, and the script says
"The code for this is on screen." once instead. Judging line by line was tried
first and is wrong: the opening `function isEmpty(value) {` and the closing brace
sit in column one, so a line rule keeps them and the voice reads a brace aloud.
Printed output is pointed at for the same reason.

**The answer's key travels with the reveal, never with the question.** The whole
session is built so the answer cannot reach the browser early. A key is not
something an answer can be recovered from, and sending it early would still put
"how long is the answer" on the page before it was given, so it comes back from
the same server action that returns the answer itself.

**The button plays a built recording or says what to run.** There is no
synthesis fallback, because there is no engine running to fall back to. A key
with nothing behind it means the text has changed since the last build, and the
message says `npm run narration:build`.

**`npm run content:check` refuses a question too long to speak.** The engine
takes one request up to 3000 characters. Without this, an explanation that grew
past it would fail partway through a narration build, a long way from the edit
that caused it.

## Alternatives considered

**Hand-write a spoken script per question, as lessons do.** The best sounding
answer and the most expensive: 260 scripts, and every edit to a prompt becomes
two edits. It is also unnecessary for the majority of questions, whose prose is
already speech.

**One recording per part: prompt, each option, expected answer, explanation.**
Finer control of playback, seven recordings per question instead of two, and a
player to sequence them. The player already exists for lessons and is built
around a topic's sections; reusing it here would mean generalising it for a
gain nobody asked for. Answering by ear needs the options in order, which one
recording gives.

**Speak the code with the punctuation named.** "open brace, const a equals one"
is technically complete and unlistenable. The screen is right there.

**Synthesise on demand when a recording is missing.** The behaviour before
decision 0020, and it needs the engine running, which is the thing that decision
removed. Building is a command, and the button says which one.

## Consequences

260 more recordings. Measured on the first full run: fifty minutes of synthesis,
227 of them actually built, and the cache holding the whole curriculum grew to
415 MB. It is a one-off, since everything after it is a skip.

The 33 that were already there are questions whose spoken form is word for word
another one's, which is mostly "What does this print? The code for this is on
screen." Content addressing means they share a recording rather than duplicating
it, which is the same property that makes editing a script a new file.

Editing a prompt or an explanation orphans its recording and needs a build
before that question can be listened to again. The 502 says so.

Question audio is only as good as prose written to be read. A question dense
with operators, `??` against `||` for instance, reads as a pause where the
symbol was. If that turns out to matter, the fix is a hand-written override on
the few questions that need it, not a general rewrite.
