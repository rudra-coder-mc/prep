# 0020. The speech engine runs on demand, not as part of the stack

## Status

Accepted.

## Context

Decision 0015 put Piper in a `tts` container. Decision 0017 then made every
narration script into a recording ahead of time, with `npm run narration:build`,
so that no listener ever waits for synthesis.

Those two together left the container with nothing to do. It was still in the
default compose set, so `docker compose up` started it, and it held a voice
model in memory for as long as the platform was running. Between builds it
answered no requests at all, because the player reads recordings from a volume.

It is not free. The model is resident, the container has a healthcheck polling
it every ten seconds, `restart: unless-stopped` brought it back after every
reboot, and the first `docker compose up` on a machine spent several minutes
building an image nobody was about to use. On a laptop also running the app and
Postgres, that showed up. Docker killed the container with exit 137 partway
through a narration build during the functions group, which is the kind of thing
that happens when memory is tight.

## Decision

**The `tts` service moves behind a compose profile, so `docker compose up`
starts the app and the database and nothing else.**

**The commands that need it start it and stop it again.**
`scripts/with-services.sh` and `scripts/e2e.sh` bring it up by name, which is
enough to start a profiled service, and a `trap` stops it on the way out however
the command ends. Both scripts stopped using `exec` for that reason, since an
`exec`ed process replaces the shell and the trap never fires.

**`restart` becomes `no`.** A tool should not come back on its own after a
reboot.

**It is stopped with `SIGINT`, not `SIGTERM`.** Starting and stopping it around
every command made a ten second stop ending in a kill worth fixing. The server
runs as PID 1, and PID 1 only receives signals it has installed a handler for.
Python installs one for `SIGINT` and not for `SIGTERM`, so the default stop was
being ignored until the grace period ran out. `stop_signal: SIGINT` with a five
second grace period brings it down in about a quarter of a second and exit 0.
The image also `exec`s the server so the shell does not sit in front of it.

**A request for an unrecorded section says what to run.** `POST /api/speech`
still answers 502 when the engine does not respond, and the message is now "This
section has no recording yet. Run npm run narration:build to make one." With the
engine deliberately off, "the speech engine is not answering" describes the
mechanism and hides the cause.

## Alternatives considered

**Leave it running and cap its memory.** Smaller change, and it treats a
container that serves nothing as something worth tuning. The load is not the
problem to optimise; the container being up is.

**Drop the container from compose and document `docker run`.** Removes the load
completely and also removes the one thing compose was giving us: the image
build, the port mapping and the healthcheck in a file that is already reviewed.
A profile keeps all of that and changes only when it starts.

**Start it on demand from the application, when a script has no recording.**
Attractive on paper, and it makes the app able to run Docker commands, which is
a much larger permission than playing audio deserves. It also hides the fact
that content is unrecorded, when surfacing that is the point.

**Keep it in the default set but stop the healthcheck and the restart policy.**
Half the saving, all of the confusion, and `docker compose up` still builds the
image on a fresh machine.

## Consequences

`npm run verify` starts and stops the engine twice, once for the integration
tests and once for the end-to-end run, and each start waits about thirty seconds
for the voice model to load. Compute is not the constraint here and the tests
are unchanged, so this is accepted rather than worked around.

Editing a narration script and pressing play no longer synthesises it on the
spot. That was a real convenience while authoring, and it is now `npm run
narration:build`, or starting the container by hand for a session of writing.
The 502 names the command so the path back is obvious.

The first `docker compose up` on a new machine is faster and smaller, because
the voice model is downloaded by the first narration build instead.

Exit 137 from this container no longer means a stop timing out, so it now means
what it usually means: something killed it, most likely Docker running out of
memory. That is worth knowing, because it happened during a build and was
indistinguishable from an ordinary stop before this change.
