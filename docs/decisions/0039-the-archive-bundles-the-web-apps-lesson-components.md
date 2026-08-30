# 0039. The archive bundles the web app's lesson components

Status: accepted
Date: 2026-08-30

## Context

`0034` decided that lessons are compiled ahead of time into self-contained pages
and shown in a WebView, and that the build lives in `packages/content`. Building
one of those pages needs the MDX component map and the visual library, and both
are in `apps/web`, where `0035` put everything that touches the DOM.

So the archive build needs code the workspace's own boundary says it may not
have. An eslint rule enforces that boundary, which is how the conflict surfaced
rather than being discovered later.

The requirement underneath both decisions is that a lesson is authored once and
reads the same on a laptop and on a phone. Two copies of the component map that
agree on the day they are written are the failure this has to avoid: a heading
styled differently, or a visual missing a prop, shows up as a lesson that is
subtly wrong on one surface only, and nothing fails.

## Decision

The archive build reaches into `apps/web` and bundles its component map and
visual components directly. Every path it reaches for is named in
`packages/content/src/archive/web-sources.ts`, and the eslint boundary is
switched off for `packages/content/src/archive/` alone, with the exception
written down at both ends.

There is one copy of the lesson rendering code and both surfaces render through
it. Nothing is duplicated, and nothing is moved.

## Alternatives considered

**Move the visuals and the component map into a package of their own.** The
structurally correct answer, and the one to take if a third surface ever renders
a lesson. It costs a fifth workspace member, an amendment to `0035`, and a
mechanical diff across the app while the app is in daily use, and it buys
nothing today that the alias does not already buy. Deferred rather than rejected:
see the task in `TASKS.md`.

**Copy the component map into `packages/content`.** Cheapest to write and the
one option that fails the actual requirement. Two maps drift, and the drift is
invisible until somebody reads the same lesson on both surfaces and notices the
difference.

**Snapshot the web app's rendered lesson route.** Rejected in `0034` already: a
rendered Next page references the build's chunks by URL, so the snapshot has to
carry the chunk graph with it.

## Consequences

One definition of what a lesson looks like, which is what the e2e spec asserts by
opening every page in the archive.

The dependency points the wrong way, from a shared package into an application.
It is confined to one directory, named in one file, and the eslint exception
lists it, so the cost of reversing it is that file rather than a search. If the
lesson components ever move, `web-sources.ts` is the whole of the change.

The build breaks if those files move without it being updated. That is caught by
the archive build itself, which is run by the e2e suite, rather than by a device
finding a blank lesson.

`packages/content` gains build-time dependencies on esbuild, MDX, PostCSS and
Tailwind. They are reached as `@prep/content/archive` rather than through the
package's entry point, so the web app does not pull a bundler into its own build.
