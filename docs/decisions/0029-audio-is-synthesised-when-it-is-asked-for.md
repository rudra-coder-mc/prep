# 0029. Audio is synthesised when it is asked for, and warmed ahead of the listener

## Status

Accepted. Supersedes `0017`, replaces the built-audio-only half of `0021`, and
amends `0020`.

## Context

Decision `0017` made every recording ahead of time, because synthesis is slow and
the wait was landing on the listener at the worst moment. Decision `0020` then
took the speech engine out of the running stack, since nothing needed it between
builds. Decision `0021` followed both: a question plays a built recording or says
which command records it, because at the moment a button is pressed there is no
engine to fall back to.

Three years of that reasoning is still sound and the result stopped fitting. The
cache holds 1201 recordings. Roughly 900 of them are question recordings, and
almost none have ever been played once. Every content change is followed by a
command that runs for tens of minutes, and the thing it produces is mostly never
heard.

Measured on the machine this runs on, Piper synthesises at about 22 milliseconds
per character. A 63 character line takes 1.4 seconds and a 711 character one
takes 15.6, so a narration section costs 25 to 60 seconds, a question prompt
about 9, and an answer with its explanation about 40. The engine idles at 168 MB
with the voice model resident.

Two of the original premises have also changed. The platform now runs on one
server reached over Tailscale rather than on a laptop competing with itself,
which is what made a resident voice model expensive in `0020`. And a mobile
client is planned, which will want a topic's audio downloaded before a journey,
so bulk generation has to survive in some form regardless.

## Decision

**The speech engine runs whenever the platform runs, on the server.** The compose
profile stays, so a laptop still starts the app and the database alone, and a
missing recording there behaves as it does today.

**Nothing is synthesised ahead of the build. Audio is made the first time it is
asked for**, keyed by the same hash of the spoken words, and kept until nothing
hashes to it. A script edited is a new key, so a change generates one new
recording on the next request and never invalidates anything.

**A question's audio becomes lazy without its script reaching the browser.** The
endpoint takes a key, resolves it against the content on the server, and
synthesises if there is nothing behind it. The browser still receives only a key,
and an answer's key still travels with the reveal.

**The wait is hidden by synthesising ahead of the listener rather than ahead of
the build**, which is the part `0017` had no answer for:

- Opening a topic page warms its first narration section.
- While a section plays, the next one is made. A section runs for two to three
  minutes and costs under one to produce, so from the second section onward
  nobody waits.
- A question's answer is made while the question is being answered, which is the
  one moment the reader is guaranteed to be busy.

**The bulk build survives, scoped to a topic.** The e2e suite empties the cache
and asserts on synthesis, so it needs a deterministic way to prepare one, and the
mobile client will need the same command with a different caller.

**A `speech:prune` command deletes any recording no current script hashes to**,
because otherwise the cache only ever grows.

## Alternatives considered

**Keep building everything ahead.** The status quo. Rejected because the waste is
the point of the complaint: hundreds of recordings that exist because a script
does, not because anyone wanted to hear it.

**Lazy with no warming.** The obvious version, and it makes the product worse
than it is now. A 60 second wait on a button press is not a trade anyone would
accept once.

**Warm a whole topic when the topic page opens.** Removes every wait and brings
back most of the waste, since opening a lesson is not saying you intend to listen
to all of it.

**Regenerate on content change, through a watcher.** Fixes the manual command and
none of the waste, because it still makes audio for text nobody has asked to
hear.

## Consequences

The server carries a resident voice model, 168 MB, whenever the platform is up.
That is the cost of every play button working without a build step.

A listener who opens a topic and presses play immediately still waits for the
first section. Warming starts when the page opens, so the wait is whatever is
left of it, and only for the first section of a topic.

The question button stops telling anyone to run a command. `0021` said there was
no engine to fall back to, and now there is.

The cache stops being a build artefact and becomes a cache in the ordinary sense:
losing it costs latency rather than correctness, and `speech:prune` can empty
most of it safely.
