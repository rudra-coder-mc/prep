# 0033. The mobile client is offline first

Status: accepted
Date: 2026-08-30

## Context

The platform is served from one machine over Tailscale (`0026`). That machine is
not always on. It is a spare PC in another location, and the laptop that also
runs the stack gets shut at the end of a day. Meanwhile most of the day is spent
holding a phone, and both halves of the loop, reading a lesson and answering a
question, are things a phone does well.

An app that needs a reachable server is an app that works some of the time,
which is not worth building.

Two things already in the design make the alternative affordable. Content is
files in git (`0002`), so it can be shipped whole rather than queried. Attempts
are only ever inserted, and everything else worth knowing is derived from them.

## Decision

The phone holds everything and needs nothing at rest. It talks to the server in
two exchanges, both started by the device, both optional, neither blocking.

**A refresh replaces the content archive.** One artefact holds every topic's
meta, questions, exercises, narration scripts and audio keys, plus one
pre-rendered lesson page each and the code those pages animate with. It is
versioned by a hash of the files it was built from and replaced whole rather
than in parts.

Audio is not in it. Recordings are addressed one at a time and downloaded a
track at a time, because they are two orders of magnitude larger and grow with
every track. Each recording is its own file, so an interrupted download needs no
resume logic: what arrived stays, and the next attempt fetches the rest. The
endpoint that serves them never synthesises. It serves what exists and reports
what is missing, because a phone asking for a thousand missing recordings would
occupy the server for a day. Making them ahead of time is what
`npm run narration:build` is for.

**A sync exchanges progress in both directions.** Attempts by id, learned marks
and tier picks by timestamp with last write winning. On the server, ingesting
attempts replays each affected question's history through the interval ladder to
rebuild its schedule row, which is why the progress half of this needs no new
tables. A sync fires on launch, on returning to the foreground, and at the end
of a review session. Failure is silent, and the app keeps working entirely from
what it already holds.

The device mirrors the server's tables in SQLite and runs the same functions
from `packages/core` (`0035`), so a merge is row for row and both sides reach
the same answer about what is due.

The server can never start a sync, since it has no route to a sleeping phone. So
the web shows a reminder when a device has not synced recently. That reminder is
the one thing here that needs a new table: a row per device, holding its name
and when it last synced.

The address is a tailnet hostname, which is fixed across networks and carries a
real certificate. Whichever machine is serving the stack is the one the app
points at: the laptop while the laptop is it, `work` once it is running again.

## Alternatives considered

**A thin client over Tailscale.** The least work to build and useless whenever
the server is off, which is most of the time this app would actually be used.

**Read offline, write online.** Half the loop. The answering is the loop, and
the reading is what you can already do on a laptop.

**A sync engine or a CRDT library.** Nothing here needs one. There is one writer
at a time, the only table with volume is append-only with generated ids, and
everything else is two fields settled by a timestamp comparison.

**Baking the archive into the APK.** Rejected in `0038`. It puts the whole
curriculum on a build service to serve a case that cannot happen, because a
first run has to reach the server to log in regardless.

## Consequences

The app works with everything switched off, which was the requirement.

Progress made on two devices between syncs merges without a conflict to resolve,
because attempts are additive and everything derived is recomputed from them.

A device that has not reached the server for thirty days needs one login again,
because sessions expire. Reading and answering never stop.

The laptop gains a job before a trip: run `narration:build` for the track so the
recordings the phone will want exist before it asks for them.

One inconsistency is now visible that was not before. The daily queue computes
"today" in the device's local timezone while the streak uses `APP_TIMEZONE`. On
one machine that never shows. Across two devices it is a real disagreement. It
is recorded as a low-priority task rather than fixed here, because it cannot
affect anyone in a single timezone.
