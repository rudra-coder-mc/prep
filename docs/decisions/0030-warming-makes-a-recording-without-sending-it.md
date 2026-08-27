# 0030. Warming makes a recording without sending it

## Status

Accepted. Amends `0029`.

## Context

Decision `0029` moved synthesis out of the build and said the wait would be
hidden by making a recording ahead of the listener: the first section when a
topic is opened, and a question's answer while the question is being answered.
It did not say what "ahead of the listener" is over the wire, and there are two
different things it could mean.

The player already fetches the next section while the current one plays. That is
a prefetch: the bytes arrive and sit in the tab, ready to play. Doing the same
for the first section of every topic opened would be the smallest change, and it
would be wrong. A section is one to three megabytes, most topic pages are read
rather than listened to, and the expensive part is not the transfer. Piper runs
at about 22 milliseconds per character, so a section is 25 to 60 seconds of work
and about a second of download on this network.

The answer has a second problem. Everything else the browser can warm, it holds
the key of. The answer's key is deliberately withheld until the answer has been
given, because a key is enough to fetch the recording and listen to it, and that
is a way to hear the answer without answering.

## Decision

**`POST /api/speech/warm` makes a recording and replies 204.** No audio comes
back. A caller fires it and forgets it: the recording is made, and the play that
follows is a file read.

**What to record is named one of two ways**, because the two are addressed
differently:

- `{ "narration": "<key>" }` for anything the browser already holds the key of.
- `{ "answer": { "topic": "...", "question": "..." } }` for a question's answer.
  The server resolves the question to its answer script itself, so the key stays
  here until the reveal.

**Opening a topic warms its first section. Showing a question warms its answer.**
Both are fire and forget, and a failure is not reported: it costs a recording
that has to be made later, which is what would have happened anyway, and whoever
presses play is told properly.

**One recording is warmed at a time, and only the newest request waits for a
turn.** Piper saturates the machine while it runs, so several warms at once do
not merely take longer each: they starve the application serving the page that
asked for them. Answering a handful of questions quickly was enough to stop the
platform responding at all, which is the opposite of what warming is for. A
reader who has moved through five questions has left four behind, so the request
worth keeping is the last one, and the ones it replaces are told they were
replaced rather than left hanging.

**Prefetching the bytes stays where it already is**, which is the next section
while the current one plays. There the listener is known to be listening and the
audio is going to be played in the next couple of minutes.

## Alternatives considered

**Warm by fetching the recording.** Three lines in the player, and it reuses the
request map so a play pressed during the warm joins it rather than starting
again. Rejected because it downloads a few megabytes on every topic page open to
save the second of the wait that was never the problem, and most of those opens
are somebody reading.

**Send the answer's key with the question and warm it like anything else.** One
address space instead of two. Rejected because the key is enough to fetch and
play the answer, so it would put the answer on the page before it was given,
which is the thing the whole key scheme exists to prevent.

**A server action rather than an endpoint.** The question forms already reach the
server that way. Rejected because the section warm is not a question concern and
would need a second mechanism, and because a request the specs can watch is worth
more here than consistency with the forms: warming has no visible effect to
assert on.

**Queue every warm rather than keeping the newest.** Nothing is thrown away, and
each recording eventually gets made. Rejected because the queue is exactly what
makes warming useless: the request at the back is the question on screen, and it
waits behind recordings for questions already answered.

## Consequences

A topic opened and never listened to costs one recording on the server, made
once and kept, and nothing on the wire. A topic opened and played immediately
still waits, for whatever is left of the first section.

A reader moving quickly gets no warming, and that is the intended trade: the
recording being made is for the question in front of them, and it is made once
they slow down enough for a turn to come free. A listener pressing play is not
affected either way, since play goes through the engine directly and joins the
work in flight if a warm started it.

The bound is per process. The platform is one server on one machine, so that is
the whole of it, and it is one more thing that would have to be thought about if
it were ever more than that.
