# 0015 - Narration is synthesised locally by Piper, and cached by content

## Status

Accepted.

## Context

Every topic is to get a button that explains it aloud, and the thing being
optimised for is ten unbroken minutes of listening. That rules out a voice that
is merely intelligible: a robotic one is not listened to twice, and the feature
is then dead weight.

Three engines were on the table, and the difference between them is not really
audio quality. It is where the lesson text goes.

## Decision

**Piper, running as a third container, synthesising on demand and caching by
content.**

`services/tts/` builds a `python:3.12-slim` image with `piper-tts[http]`, which
ships its own Flask server as `piper.http_server`. `POST /synthesize` with a
JSON body answers with a 22050 Hz mono 16 bit WAV, roughly 44 KB per second of
speech. The voice model, `en_US-lessac-high`, is downloaded at image build time
rather than on first run, so `docker compose up` remains the only setup step and
the container needs no network afterwards.

**The voice model is baked in; the cache is addressed by words alone.** A cache
entry's name is the SHA-256 of the script after whitespace is normalised, and
nothing about the voice enters the key. A cache directory therefore belongs to
one voice. Changing `PIPER_VOICE` means rebuilding the image _and_ discarding
the `speech-cache` volume, or old lines keep playing in the old voice. That is
written in `compose.yaml` next to the build argument, where anyone changing it
will be standing.

Addressing by content rather than by topic slug means editing a script is
automatically a new recording, and moving a script between topics reuses the one
already synthesised. The cost is that the old entry is orphaned rather than
deleted, so the volume grows by every draft ever played. Removing the volume is
the reset, and audio is regenerated on demand.

**One endpoint, and no interface yet.** `POST /api/speech` takes
`{ "text": "..." }` and answers with the WAV, gated by the same session
everything else is. `X-Speech-Cache` says `hit` or `miss` and `X-Speech-Key`
names the file, so a slow response can be traced without guessing. The script
travels in the body because a section of narration is longer than a URL should
be.

**A section, not a narration, is one request.** Synthesis runs at about three
and a half times real time, so three minutes of speech is about fifty seconds of
work. Scripts are capped at 3000 characters and a longer one is a 400, not a
request that hangs. Splitting a narration into sections is what the player needs
anyway, so the cap costs nothing.

**Nothing about the audio gates the application starting.** `app` waits on
Postgres and not on the voice model loading. A request that arrives before the
engine is ready gets a 502 saying so and can be retried.

## Alternatives considered

**The browser's `speechSynthesis`.** No container, no cache, no volume, no
endpoint - by a distance the smallest thing that speaks, and it was seriously
considered on that basis alone.

Rejected because what it sounds like is not a property of this project. It is a
property of whichever voices the machine happens to have installed, which
differ between macOS, a Linux desktop and a phone, and several of the defaults
are exactly the robotic voice that makes the feature dead weight. A tool whose
central feature is only good on the author's laptop is not a tool that survives
being handed over. It is also the one option that could not be improved later
without being replaced.

**A cloud API.** Better than Piper, and by enough to notice. Rejected on the
project's own hard rule rather than on cost: it is the only option that sends
lesson text off this machine, and it makes the platform stop working when the
network does or when a key expires. A learning tool that is unavailable on a
train is worse than one with a slightly flatter voice.

**Pre-rendering every script at build time.** Tempting, because it moves all the
waiting to the build and needs no engine at runtime. Rejected: it would put tens
of megabytes of WAV into the image for every topic, and the narration scripts
are authored in the same session as the lesson they belong to. Waiting minutes
to hear a sentence read back is the friction `0006` exists to avoid. The cache
gets the same result for everything except the very first play.

**Compressing the cached audio.** WAV at 44 KB per second is about 26 MB for ten
minutes, where Opus would be under 2 MB. Rejected for now, not on principle: it
needs an encoder in the image, and this is a local tool serving one listener over
a loopback interface, where the bytes cost nothing. If the volume becomes a
nuisance, encoding in the `tts` container is the place to do it.

## Consequences

The stack is three containers, which is one more than `docs/architecture.md`
said it would ever be. `0006`'s promise still holds - `docker compose up` is
still the only step - but the first build is several minutes longer because it
downloads a voice model, and the integration tests inherit that cost the first
time they run. `scripts/with-db.sh` became `scripts/with-services.sh` and now
brings up the engine alongside Postgres, because the test worth having is one
that proves the bytes coming back are audio a browser will play.

The end-to-end suite needs the engine for the same reason, and gets its own
speech cache, emptied at the start of every run exactly as its database is
dropped. A cache that survived the run would make "this had to be synthesised"
an assertion about the previous run rather than this one.

Two identical requests arriving at once both miss the cache and both synthesise,
and the second to finish wins. Wasteful rather than wrong, and with one listener
it is not worth an in-flight registry to prevent. If the player ever starts
requesting speculatively, that changes.

Piper answers with `Content-Type: text/html` even when the body is a WAV, so its
audio and its Flask error pages are indistinguishable by header alone. The
client checks for a `RIFF....WAVE` header before anything is cached, which is
the difference between a failure and a permanently cached error page.

The middleware no longer redirects a signed-out request to `/api/*`. It used to
send every unauthenticated request to the login page, which answers a request
for audio with a page of HTML and a 200; endpoints now get a 401 they can act on
instead. Pages are unaffected.

The speech library is the first module in `src/lib/` whose barrel carries
`server-only` while its parts do not. `server-only` throws on import outside a
server module, and a test runner counts as outside, so marking every file would
have made the engine untestable. The parts read the filesystem and so cannot
reach a client bundle regardless.
