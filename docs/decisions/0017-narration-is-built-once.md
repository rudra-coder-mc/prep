# 0017. Narration is built once, not synthesised on demand

## Status

Accepted.

## Context

Every narration script in `content/` is static text sitting in git. Nothing about
it depends on who is reading, when, or what they have answered. Yet the first
person to press play on a section paid for it. Piper synthesises at roughly three
and a half times real time, so a ninety second section is about half a minute of
waiting, once per section per machine.

The cache made that a one-off, which is why it was tolerable. But that one-off
was being paid at the worst possible moment. Mid-lesson, by a listener who
pressed play, for content that had been sitting on disk since it was written.
The expensive work was scheduled by the reader rather than by the build.

## Decision

Synthesis happens ahead of time, and playback is a file read.

`npm run narration:build` walks every topic, hashes every section's script, and
synthesises the ones that have no recording yet. It skips the rest, so adding one
topic builds one topic. The output is the same content-addressed cache the engine
already had, so nothing about addressing, invalidation or the volume changed.

`GET /api/speech/<key>` serves a built recording. The key is the hash of the
words, so the bytes behind one can never change and the response says
`private, max-age=31536000, immutable`, so a section played twice is not fetched
twice. The topic page computes each section's key on the server and hands it to
the player, so the browser never hashes anything.

`POST /api/speech` stays exactly as it was, and the player falls back to it when
a key has nothing behind it. That case is a script edited since the last build,
and the fallback is silent. It synthesises, caches, and every play after it takes
the fast path. Editing a script and pressing play still works with no build step
in between, which is what keeps authoring pleasant.

## Consequences

The build is a manual step, not part of `npm run build`. It needs the speech
engine running, and the Docker image is built without a network or a `tts`
container, so wiring it into the build would only produce a build that fails on a
clean machine. A fresh checkout that never runs it behaves exactly as before,
with the first play of each section synthesising, which is the right failure.

The e2e suite empties the speech cache on every run and does not pre-build, so
its assertions about a section being synthesised on first play are still
assertions about something real, and the fallback path is exercised by every
narration test in the suite.

## Alternatives

**Generating into `public/` as static files.** Next serves those without a route
and without a session. It also means the audio has to exist when the image is
built, which is the one place the speech engine is not available, and it puts
lesson audio on an unauthenticated URL. The cache volume is already the right
home for it.

**Committing the audio to git.** Roughly 44 KB per second of speech, which is
about two megabytes a section and ninety for the eight spoken topics. The scripts
are the source; the audio is a build artefact of them, and a content-addressed
one, so it rebuilds identically anywhere.
