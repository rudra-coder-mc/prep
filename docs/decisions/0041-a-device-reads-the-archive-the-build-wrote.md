# 0041. A device reads the archive the build wrote

Status: accepted
Date: 2026-08-30

## Context

A device holds everything and needs nothing at rest (`0033`). To get there it
needs three things from the server: what the current content is, the content
archive itself, and the recordings for a track.

The archive is already built by `npm run content:archive`, which reads files and
needs neither the stack nor the database (`0034`). What was not settled is who
turns that build into something a phone can download, and where the result lives
while it waits to be asked for.

Two facts about the running server decide most of it. The image is a Next
standalone build, so it carries neither `content/` nor the web app's sources.
And the archive build reaches for esbuild, MDX and Tailwind to compile a lesson
page, which is a compiler and not something a server should be holding.

## Decision

The build writes the archive and the server only ever reads it.

`npm run content:archive` now writes `archive.zip` beside the directory it
already wrote: one file holding the curriculum and every lesson page. That is
the artefact a device downloads. Writing it at build time rather than assembling
it per request means the version a device is told about and the bytes it
receives come out of the same build.

The archive directory is a bind mount named by `CONTENT_ARCHIVE_DIR`, the way
the recording cache is (`0022`). It is not baked into the image, so rebuilding
the archive does not rebuild anything. `npm run content:archive` builds it on the host so the server serves the updated archive.

Three endpoints, all authenticating the way every other endpoint does (`0040`).

- **`GET /api/device/archive/version`** answers with the version, the size of
  the download and what is in it. It reports the version of the archive that
  exists, which is not always the version of what is in `content/`. An edit
  nobody rebuilt is not something a device can be handed, and saying otherwise
  would send it to fetch a version the server cannot deliver.
- **`GET /api/device/archive`** sends the artefact, naming the version it sent
  in a header. One URL serves every version, so that header is the only way a
  device can tell that what arrived is what it decided to fetch.
- **`GET /api/device/audio/<key>`** serves a recording and never synthesises
  one. A phone holds every key in the archive and asks for the ones it lacks, so
  a track that has never been recorded arrives as hundreds of requests. Each
  synthesis is half a minute of the machine's whole attention.
  `npm run narration:build` is what makes them ahead of time.

Both endpoints that can find nothing answer 503 rather than an empty 200, so a
device can never read "nothing has been built here" as "you are up to date".

## Alternatives considered

**Build the archive in the server, on demand.** It removes the step somebody has
to remember, and it puts a compiler and a Tailwind pipeline inside a running
application. The standalone image carries neither the curriculum nor the app's
own sources, so it would also have to start carrying both.

**Bake the archive into the image.** Then every content edit is an image rebuild
and a restart, which makes publishing a corrected lesson a deployment.

**Serve the directory file by file, with the manifest as an index.** Fifty
requests instead of one, and a device that stopped halfway would hold questions
from one version beside lesson pages from another. The build already refuses to
leave that state behind; the transport should not reintroduce it.

**Report the live version of `content/` rather than the built one.** It is the
more current answer and it is the wrong one: a device would be told a version
that no archive on the server can satisfy, download whatever is there, decide it
is still behind, and do it again on every launch.

**Serve audio from `/api/speech/<key>`, which already exists.** It synthesises on
a miss, which is right for a reader waiting on one section and wrong for a phone
asking for a track. Adding a "do not synthesise" flag to it would put the
distinction in a query parameter, where a caller can get it wrong.

## Consequences

A device can go from holding nothing to holding the whole curriculum, and the
web app is untouched.

Content edited and not rebuilt is invisible to a device. `npm run content:archive` is run on the workstation after editing lessons, and the build takes about a second.

The archive is 934 KB at 46 topics, which is one download over a phone
connection rather than something to think about.

The recordings still have to exist before a device asks for them, and nothing
about this makes them. The job before a trip is unchanged:
`npm run narration:build` for the track.

A refresh that races a rebuild is possible, because the file is replaced while
the server may be reading it. It costs a retry rather than a wrong archive: the
version travels with the download, so a device that gets something it did not
ask for can tell.
