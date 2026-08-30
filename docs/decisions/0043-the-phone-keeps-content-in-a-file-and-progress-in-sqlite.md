# 0043. The phone keeps content in a file and progress in SQLite

Status: accepted
Date: 2026-08-30

## Context

`0035` says the device mirrors the server's tables in SQLite and runs the same
functions from `packages/core` over the same shapes. That settles progress. It
does not settle the curriculum, which reaches the phone as a content archive
(`0033`): one JSON file of every topic, question, exercise and narration script,
plus a pre-rendered page each.

Something has to decide what that archive becomes once it is unpacked. The
obvious reading of "mirror the server's tables" would put the curriculum in
tables too, and the obvious reading is wrong, because the server has no such
tables. Content is files in git (`0002`), loaded and cached, and Postgres has
never held a question.

The file is 1.7 MB at 46 topics and 563 questions.

## Decision

The archive stays a directory of files in the app's document storage, and only
progress goes into SQLite.

`content.json` is read and parsed once per launch and held for as long as the
app runs. The lesson pages stay as the files the WebView will open (`0034`).

Each version is unpacked into a directory named after itself, and which one is
installed is a row in a small `settings` table. So a refresh writes beside the
archive in use rather than over it, and the swap is that one row. No directory is
ever half replaced, because no directory is ever replaced. The old version is
deleted afterwards, and an install killed between the two is swept up by the next
one rather than leaking for good.

That also keeps the app off filesystem semantics it cannot check here. Renaming a
directory onto a path that may or may not exist behaves differently on different
platforms, and this repository has no way to run the phone's filesystem, so the
design leans on a database write it can test instead.

That gives each of the two a store shaped like what it is. The curriculum is
replaced whole, is read whole, and is identical on every device: a file. Progress
is written a row at a time, merged a row at a time, and differs per device: a
table.

An install checks everything it can refuse in memory before it touches the disk,
so a refresh that fails leaves the device holding exactly the archive it was
already working from. A phone that has been offline for a week must not lose that
by being handed a bad answer once. Two of those checks are about paths rather
than about content: a version becomes a directory name and a zip entry becomes a
file path, and neither is joined onto one until it has been shown to be a name.
Both should be unreachable, since the archive is this project's own build over an
authenticated connection, and both are one line.

The archive shapes now live in `packages/content/src/archive/types.ts`, a leaf
that imports nothing but `@prep/core`. The build that writes an archive runs on
Node and the phone that reads one does not, so the two agree about the shape by
importing it rather than by describing it twice.

## Alternatives considered

**The curriculum in SQLite tables.** It reads as the consistent choice and is
not. It is a second definition of the content schema that has to be migrated
whenever the first one changes, it turns replacing an archive from a directory
swap into a delete-and-reinsert across six tables, and it buys a query surface
nothing wants: the daily queue reads every enrolled question anyway. It would
also put the phone's model of content further from the server's rather than
closer.

**Renaming a staging directory over the installed one.** The usual shape, and it
needs the platform to agree about what moving a directory onto a non-existent
path means. That is not something a test in this repository can settle, and the
one operation the whole refresh rests on is the wrong place to be unsure.

**Parsing the archive lazily, a topic at a time.** It saves the launch cost by
splitting the file per topic. The cost being saved is a fraction of a second
once, and the price is that the archive stops being one artefact that is either
wholly present or wholly absent, which is the property the whole refresh design
rests on.

**Keeping the parsed content in a module-level cache.** React state is where the
app already keeps things that change, a refresh already invalidates it, and a
second cache beside it is a second thing that can be stale.

**Putting the archive in the cache directory.** Android reclaims that when
storage runs short. The archive is the thing the app cannot work without and the
expensive thing to fetch again, so it goes in document storage, which Android
leaves alone.

## Consequences

Launch parses 1.7 MB of JSON. That grows with the curriculum, and the number to
watch is the launch, not the file: when it stops being unnoticeable, splitting
the file per topic is the change, and it is confined to
`apps/mobile/src/archive/`.

A refresh that fails costs nothing, which is what makes it safe to attempt on
every launch once task 33 lands.

The app is typechecked twice, by `tsconfig.app.json` with no `dom` and no `node`
libraries and by `tsconfig.json` with Node for the tests. The first is what keeps
a Node import out of a bundle that would otherwise fail on the phone rather than
in the terminal. The Node-backed test stores live in `apps/mobile/test-support/`
rather than in `src/` for the same reason.
