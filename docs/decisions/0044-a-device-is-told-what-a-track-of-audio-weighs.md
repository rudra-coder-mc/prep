# 0044. A device is told what a track of audio weighs

Status: accepted
Date: 2026-08-30

## Context

Audio is not in the content archive. It is two orders of magnitude larger than
the curriculum, so a device downloads it a track at a time, one file per key
(`0033`). The library on this machine is 301 MB after compression (`0036`), and
the phone's storage is the constraint that made compressing it worth doing.

The device already knows which recordings a track needs. Every question in the
archive carries `promptAudioKey` and `answerAudioKey`, and every narration
section carries `audioKey`, so the keys arrive with the curriculum. What no
device could work out is what any of them costs. `GET /api/device/audio/<key>`
answers one key with one recording (`0041`), and asking it about a whole track
to find out the size means downloading the track.

Two other things are invisible to the phone. Whether a key has been recorded at
all: `npm run narration:build` makes recordings ahead of being asked, and a
track nobody has run it over has keys and no audio. And which keys the server
has gained since the archive was built, because a recording made after a build
is served by a server whose archive does not mention it.

## Decision

**`POST /api/device/audio` reports what a set of keys weighs.** The device sends
the keys, and the answer names each key that has a recording and how many bytes
it is. A key with no recording is left out of the answer rather than reported as
an error, so one response says both what the download costs and how much of the
track has never been narrated.

It is a POST that only reads. A track is a few thousand sha256 keys, and that
does not fit in a URL. The client asks in batches of 500 and the endpoint takes
1000, so the two can move apart without breaking.

The device measures what it already holds itself, by listing the audio directory
and reading file sizes. That half of the answer needs no server, so the track
screen says what the phone is carrying whether or not the machine is on.

A download needs no resume logic. One recording is one file and one request, and
the file is written only after all its bytes have arrived, so a run that is
killed leaves whole recordings behind and the next run asks for the rest.

## Alternatives considered

**Put the sizes in the archive.** The build has the cache beside it, so it could
record the size of every key it finds. Then the phone could price a download
offline. It cannot download offline, so the offline answer buys nothing, and the
archive would go stale the moment a recording was made after a build: a device
would be told a track was short of recordings the server already had.

**Estimate the size from the script.** Recordings are 32 kbps mono, so bytes are
roughly the length of the script over the speaking rate. It needs no endpoint
and no round trip, and it is wrong by a fifth either way. The screen also shows
what the device holds, which is exact, so the two numbers would not reconcile
after a download finished.

**Ask `GET /api/device/audio/<key>` with `HEAD`.** It gives an exact size per key
from an endpoint that already exists. A track is a few thousand requests to
answer one question.

**List the whole cache in one `GET`.** No request body, and no track in the
question either: every device asking about one track would receive every key on
the machine.

## Consequences

A track screen states the price before anything is downloaded, and states it
again as what the phone holds once the download is done.

A half-narrated track is legible. The screen says how many recordings have not
been made, which is the state of the machine rather than a failure, and the
answer to it is `npm run narration:build` on the laptop.

The endpoint is only as current as the cache, which is what it reads. A
recording made while a phone is downloading is not in an answer given before it,
and the next survey finds it.

The device can now hold two things that fall out of step: the archive is
replaced whole, and the audio library is not. That is deliberate. A key is the
hash of the words, so a script that did not change keeps its recording across a
refresh, and only edited scripts are downloaded again. Nothing yet deletes the
recordings of a script that was edited away. The server has
`npm run speech:prune` for the same problem and the phone has nothing, which is
task 40 in `TASKS.md`.
