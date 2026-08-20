# 0022. Recordings live in one directory, and the container reads it

## Status

Accepted.

## Context

`npm run narration:build` runs on the host and writes into `.speech-cache`,
because that is what `SPEECH_CACHE_DIR` defaults to outside the stack. The app
container was given a named volume, `speech-cache`, mounted at `/cache/speech`.

Those are two different places. Recordings made by the build were never visible
to the container, and the container's own copy only ever held whatever it had
synthesised itself through `POST /api/speech`.

Nothing looked broken while that fallback existed. A section with no recording
in the volume was simply synthesised on first play and cached there, so the app
filled its own copy over time and the host copy was for the tests. Decision 0020
took the engine out of the running stack and removed the fallback, which turned
a slow first play into audio that does not play at all: 415 MB of recordings on
the host, 20 MB in the volume, and no way to get from one to the other.

## Decision

**The app bind mounts `./.speech-cache`, the same directory the build writes
into.** The named volume is gone.

One location, filled by one command. Anything `npm run narration:build` makes is
immediately playable in the stack, with nothing to copy and nothing to keep in
step.

## Alternatives considered

**Run the build inside the app container so it writes to the volume.** Keeps the
volume and needs the container running to record, which means the authoring
command depends on the application being up. It also puts the recordings
somewhere only Docker can reach, so inspecting or deleting them means a throwaway
container.

**Copy the host directory into the volume as a build or entrypoint step.** Two
copies of 415 MB, and a rule about which one wins.

**Leave the volume and accept the fallback.** This is the state decision 0020
deliberately left behind. It needs the engine running to be correct, which is the
thing that decision removed.

## Consequences

The recordings sit in the working tree, gitignored, at around 415 MB. That is
visible in a way a named volume was not, which is an improvement: it is
inspectable with `ls`, and deleting it is `rm -rf`.

The old `prep_speech-cache` volume is orphaned rather than removed, since compose
does not delete a volume it has stopped referencing. `docker volume rm
prep_speech-cache` clears it.

A machine with no `.speech-cache` gets an empty directory created by Docker, and
every listen button says to run the build. That is the correct message and it is
now the only failure mode, rather than one of two.
