# 0036. Recordings are stored compressed

Status: accepted
Date: 2026-08-30

## Context

Piper writes 22 kHz mono 16-bit WAV. The cache holds 1776 recordings across 46
topics, which is 3.6 GB, about 23 hours of speech, and roughly 78 MB for one
topic.

That was free while the only reader was a browser on the same machine as the
files. It stops being free the moment a phone has to hold the library offline,
and it gets worse with every track added, since the curriculum is planned to
grow to TypeScript, React, Node and the rest.

## Decision

Recordings are stored as Opus at 32 kbps mono, and the WAV is not kept. A topic
becomes about 7 MB and the current library about 330 MB.

Existing recordings are transcoded in place rather than re-synthesised. The
cache key is a hash of the script, not of the bytes, so every key survives the
change and no work is thrown away. Compression happens in the `tts` container,
which is where audio is made, so the app container gains no dependency.

## Alternatives considered

**Keep the WAV and serve a compressed copy beside it.** It doubles the storage
to protect a master nobody needs. A recording is reproducible from its script,
which is what makes the cache a cache.

**AAC instead of Opus.** It loses on quality per byte at this bitrate. AAC would
have won on iOS, and the client is Android only.

**Leave the format alone and download less to the phone.** It makes offline
listening a per-topic chore forever in order to avoid a transcode that runs
once.

## Consequences

Server storage and the download to the phone both drop by an order of magnitude.

Quality is not perceptibly affected. The source is 22 kHz speech, so there is
nothing above 11 kHz to lose, and Opus at this bitrate is transparent on that
material.

It ties playback to browsers that decode Ogg Opus, which is every browser except
Safari. If Safari ever matters, the format changes and the cache is rebuilt from
the scripts, which costs synthesis time and nothing else.
