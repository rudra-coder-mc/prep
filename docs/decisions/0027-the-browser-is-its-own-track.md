# 0027. The browser is its own track

## Status

Accepted.

## Context

`TASKS.md` listed one remaining JavaScript group, "the browser, not the
language": the DOM, events and delegation, `fetch`, and storage. It also refused
to say where the group goes, because the group is the first one whose subject is
not the language. Every topic in the JavaScript track so far describes something
the specification defines. None of these four does. `document`, `addEventListener`,
`fetch` and `localStorage` are host objects, defined by the HTML and WHATWG
standards and absent from any JavaScript engine that is not embedded in a
browser.

The question mattered because of what comes after it. The unscheduled work in
`TASKS.md` already plans React, Next.js and Node as their own tracks. If these
four topics sit inside JavaScript, then the React track's prerequisites reach
into the middle of a language track to pick out four topics, and the Node track
has to explain that a good third of what it needs is somewhere else and the rest
of it does not apply.

Nothing in the platform makes this hard either way. A technology is a directory
under `content/`, the dashboard and the topic list group by whatever directories
exist, and `technologyLabel` title cases a name nobody has spelled out. So the
decision is about what the tracks mean, not about what they cost.

## Decision

**The browser is a track: `content/browser/`, four topics at orders 10 to 40.**

The JavaScript track stays the language, all 39 topics of it, and nothing in it
is renumbered.

Node settles it. Node is already planned as its own track, and Node is the same
kind of thing as the browser: a host that embeds the engine and supplies objects
the language never had. `require`, `Buffer` and `process` are not JavaScript in
any sense that `document` and `localStorage` are. Putting one host inside the
language track and the other beside it would be a distinction with nothing
behind it.

**The four topics declare prerequisites into JavaScript**, since they genuinely
assume it. Events assume the event loop, `fetch` assumes promises and
`AbortController`, storage assumes JSON. A prerequisite already carries the
technology in it, `javascript/event-loop`, so pointing across a track boundary
needs no change.

**Nothing in `src/` changed.** The label is the title cased directory name, the
topic list grew a second section on its own, and the dashboard counted two
tracks without being told there were two. That was the intent recorded in
`src/content/technologies.ts` and this is the first time it has been exercised.

## Alternatives considered

**Put the four topics in the JavaScript track.** The honest argument for it is
that interviews do not respect the boundary: a job posting says "JavaScript" and
the interview asks about event delegation. Rejected because the track is the
teaching order, not the job title, and the reader looking for delegation finds it
in a track called Browser on the same page. The cost of being wrong here is also
asymmetric. A React track built on a browser track that turned out to be
unnecessary has lost nothing, and a React track that has to reach into the middle
of a 43 topic language track is stuck with it.

**Call the track `web-apis` or `dom`.** `dom` names one of the four topics and
excludes the other three. `web-apis` is accurate and reads like a specification
index rather than something someone wants to learn. `browser` says where the
things live, which is the property that made them a separate track.

**Wait for the React track and decide then.** This is the decision that has to
be made before the content is written, not after, because moving four topics
between tracks later changes every topic slug, and topic slugs are stored on
every attempt row.

## Consequences

The topics page sorts tracks by label, so Browser now appears above JavaScript,
which is the reverse of the order somebody should read them in. Track ordering
does not exist as a concept: within a track, `order` decides, and between them it
is alphabetical. Four topics is not enough to justify inventing it, and the
prerequisites say what depends on what. If a third track lands and the list still
reads wrong, that is when to add it.

The JavaScript track can no longer answer "everything a JavaScript interview
asks", which was the goal `TASKS.md` set for it. It answers everything the
language is asked about, and the browser track covers the rest. Anyone preparing
for a front end interview needs both, and the README says so.

A topic in one track can now depend on a topic in another, and nothing checks
that the prerequisite exists. It did not check before either, but before it was
a typo within one directory. This is the first time the reference crosses a
boundary, and a track deleted or renamed would leave the pointers dangling
silently.
