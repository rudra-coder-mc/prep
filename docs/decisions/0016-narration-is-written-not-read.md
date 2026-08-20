# 0016 - Narration is separate text, and a section is the unit of playback

## Status

Accepted.

## Context

`0015` put a voice in the stack. This is about what it says, and how a listener
moves through it.

The obvious implementation is to feed the lesson to the engine. It is free, it
stays in step with the prose automatically, and it needs no new content. It is
also unlistenable. A lesson is written to be read: it carries code blocks, a
table of promise combinators, inline symbols like triple equals, and figures
that mean nothing without the picture. Read aloud, a code block becomes a stream
of punctuation names, a table becomes a list of fragments, and the reader has no
idea which part of the page they are in.

The second problem is length. A topic is five minutes of speech. Synthesis runs
at about three and a half times real time, so asking for a whole topic in one
request is a minute of silence, an enormous response, and nothing to seek with.

## Decision

**A narration is separate text, authored beside the lesson.** Each topic may
have a `narration.ts` next to its `lesson.mdx`, holding an ordered list of
titled sections. It says the same things the lesson says, in the order the
lesson says them, but written the way you would explain the topic to someone
sitting in front of you: short sentences, no code read out character by
character, and explicit signposting so a listener always knows where they are.

**Narration is optional, and a topic without one shows no player.** It does not
fall back to reading the prose, because a bad reading is worse than no reading
and would remove the reason to write a script at all. The content check names
the topics that have no script, so a missing one is visible rather than silent.

**A section is the unit of everything.** It is what the player moves between,
what the engine speaks in one request, and what the cache is keyed on. Sections
in this track run forty to seventy seconds, which is short enough that the first
play is a wait measured in seconds, and long enough to be a whole thought. The
schema enforces the engine's own limit, so a section too long to speak fails the
build rather than the play button.

**The next section is fetched while the current one plays.** That is what makes
a first listen continuous. A listener who skips ahead immediately still waits,
because there is nothing else to do; a listener who listens does not.

**There is exactly one audio element, and its source is swapped.** A browser
grants playback permission to an element via a user gesture, and a fresh element
created when a section ended would be refused. One element per player is what
lets a topic play end to end from a single press.

**Speed is remembered across topics**, from one time to two times in four steps.
Past two, a synthesised voice stops being something you can follow, so a faster
setting would only ever be a way to finish without listening. The preference is
read through an external store rather than restored by an effect, because the
server render has no storage to consult and correcting the value afterwards
would both break this project's lint rules and show the wrong speed for a frame.

## Alternatives considered

**Speak the lesson prose, stripped of code.** No new content to write, and it
can never drift out of step with the lesson. Rejected because the result is a
document being read, and because stripping is not a small problem: the code and
the figures are not decoration in these lessons, they are where several of the
explanations actually live. A script that omits them has to say the same thing
another way, which is writing a script.

**Generate the script from the lesson with a model.** Tempting, and it would
scale to the nine content groups still to come. Rejected for now on the same
grounds as `0005` rejects automatic grading: it puts a thing nobody reviewed in
front of the one person this platform exists for. It is a reasonable thing to
revisit as an authoring aid, where the output is edited before it ships.

**One request per topic rather than per section.** Simpler player, one file per
topic in the cache. Rejected: a minute of synthesis before anything plays, no
way to move within a topic, and a single edit anywhere in the script throws away
the whole recording rather than one section of it.

**A progress bar and scrubbing within a section.** Deliberately not built. It
needs a time update listener and re-rendering state several times a second, and
the section list already gives a listener somewhere to move to. If listening in
practice turns out to want it, it is an addition rather than a change.

## Consequences

Every topic now owes a script, and the count grows with every content group
shipped. Eight topics is forty nine sections and about forty minutes of speech.
That is the largest ongoing cost this decision creates, and it is stated in
`TASKS.md` where the content groups are listed.

A narration duplicates its lesson, which means the same maintenance problem
`0014` accepted for concept maps: change a lesson and the script has to be
revisited by hand, and nothing checks that they agree. The mitigation is the
same one - sections follow the lesson's own headings, so the thing to re-read is
obvious.

The player's controls sit on a page where every visual has controls of its own.
The narration speed button is named for what it controls rather than reusing the
visuals' wording, because otherwise a lesson page offers five identically named
speed buttons to anyone navigating by accessible name.
