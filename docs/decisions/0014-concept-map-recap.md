# 0014. Every lesson ends with a map of itself

## Status

Accepted.

## Context

A lesson is prose with visuals inside it. Each visual explains one mechanism
well, how a lookup walks or how a queue drains, and none of them says what the
topic _is_. Reading closures end to end leaves five good pictures and no single
one to recall under pressure, which is the moment the material is actually
needed.

Recall is also what the rest of the platform is built on. The questions test
whether a topic is remembered; nothing in the lesson is shaped to be the thing
that gets remembered.

## Decision

**Each lesson ends with a concept map: one centre, four or five branches, a few
details under each.** It is the same step player as every other visual, so it
plays itself, can be stepped, and reads as part of the library rather than as a
new kind of thing.

**The skeleton is visible from the first frame.** Branches are all drawn
immediately, dimmed, and fill in as they are reached. The arrangement is the
part worth remembering, so it is never hidden behind playback.

**The map is authored, not generated.** It sits in the lesson MDX beside the
prose it summarises.

## Alternatives considered

**Generate the map from the lesson's headings.** Free for every topic, and it
produces a table of contents rather than a summary. Headings are written to
introduce a section, not to be the sentence you carry away from it.

**A single map per track instead of per topic.** Useful later as navigation, and
useless as recall. The unit being tested is the topic, so that is the unit that
needs a picture.

**Leave the recap as prose.** The lessons already end with a "Traps" list, which
is close. It is a list of exceptions, not a shape, and it reads in one direction
only.

## Consequences

Every topic now carries a third authoring cost, after the lesson and its
questions. It is small, five branches, but it is per topic, and a map that
disagrees with its lesson is worse than no map, so it has to be revisited
whenever the lesson changes.

The map duplicates content by design. That duplication is the feature, and it is
also the maintenance burden. Nothing checks that the two agree.
