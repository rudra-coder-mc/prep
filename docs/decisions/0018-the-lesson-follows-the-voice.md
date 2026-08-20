# 0018. The lesson follows the voice

## Status

Accepted.

## Context

Narration and the lesson were two separate things on one page. The player sat at
the top; the lesson ran on for several screens below it. Press play, scroll down
to read along, and within a minute the controls were somewhere above and there
was nothing on the page saying which part of the lesson the voice had reached.
Listening and reading were happening at the same time, about the same topic,
without ever meeting.

The narration deliberately is not the lesson read out
(`0016-narration-is-written-not-read.md`), so nothing in the text could be
matched up automatically. Section three of the script and section three of the
lesson are not the same thing, and in one topic they are not even in the same
order.

## Decision

Every narration section says which lesson heading it is about, and the page uses
that for two things: it lights up that part of the lesson while the section
plays, and it keeps the controls within reach.

**The anchor is content, not inference.** `heading` on a narration section is the
lesson heading, written exactly as the lesson writes it. `headingSlug` turns a
heading into the `id` it is rendered with, and the same function turns the
narration's heading into the same `id`, so the two cannot drift by accident. The
content check refuses a heading the lesson does not have, and suggests the one it
was probably renamed to.

**A section is a range, not an element.** MDX renders a lesson as a flat run of
headings, paragraphs, code blocks and figures with nothing wrapping a section, so
the marking walks from a heading to the next one and sets an attribute on
everything between. One rule in `globals.css` then dims everything the voice is
not on. This is done to the DOM rather than through React because the lesson is a
compiled MDX component. Mapping over its output would mean rendering it first,
and re-rendering a whole lesson on every section change is a far worse trade than
setting an attribute.

**Following is only for someone listening.** It turns on when a section actually
starts playing and off when the last one ends. A reader who never presses play,
or who has heard the topic out, gets exactly the page that was there before.
Nothing about an ordinary read changed.

**One player, three faces.** The card, the bar that follows the reader down the
page, and the lesson itself all read from one `NarrationProvider`. Two audio
elements would be two voices, and controls that disagreed about what was playing
would be worse than no controls at all.

## Consequences

`heading` is required on every narration section, so a new topic cannot ship a
script that says nothing about where it is. That is deliberate. It is one line of
content, and the alternative is a feature that silently does nothing on the
topics that forgot it.

The page scrolls itself when the narration moves on. Someone reading ahead while
listening will be pulled back to the section being spoken. That is the point of
the feature rather than a side effect of it, but it is the part most likely to
want a way to turn it off, and the bar's "scroll to what is playing" button is
the cheap version of that argument. It exists because the reader is allowed to
wander.

Dimming is opacity only. It changes no layout, so a lesson that is being narrated
and one that is not are the same page at the same size, and nothing moves when
the narration ends.

## Alternatives

**Matching the script against the lesson text.** They are deliberately different
words, so this would be guessing, and it would guess differently every time
either side was edited.

**Wrapping sections in the MDX at build time,** with a rehype plugin. It would
give a real element per section, but it is a build-time dependency and a
transformation to maintain for something one DOM walk does, and it would still
need the narration to say which section it meant.

**Highlighting with a background instead of dimming.** A highlight has to sit
behind a run of elements with margins between them, so it breaks into bands or
needs a wrapper. Dimming the rest needs neither and reads as focus rather than as
decoration.
