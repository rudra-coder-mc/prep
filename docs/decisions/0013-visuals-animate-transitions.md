# 0013 - Visuals animate the transition, not the frame

## Status

Accepted.

## Context

The visual library shipped as a step player: each step held a complete
description of the picture, and advancing swapped one description for the next.
Motion was attached, but it could only fade a list item in or out, because
nothing in the implementation connected an item in one step to the same item in
the next. A task leaving the microtask queue and arriving on the call stack was
two unrelated events - a delete in one column, an insert in another.

The result reads as a slideshow of diagrams. It is accurate and it is not
memorable, and memorable is the entire reason these exist: a lesson that can be
read is already a lesson that can be read.

Nothing played by itself either, so the default state of every visual on a page
was a still frame with a play button on it.

## Decision

**Items have identity, and identity is what moves.** A token in any visual
carries a `layoutId` that is stable across steps, so the same object travels
between regions instead of being destroyed and recreated. Where the content
needs to say "this is that", a step can give an item an explicit id:
`{ id: 'timeout', label: 'timeout: log 2' }`.

**Visuals play themselves once, when scrolled into view.** The transport stays,
because a reader who wants to step by hand should be able to, but the first pass
happens without being asked for.

**The rule is performed, not stated.** A scope lookup walks outward one scope at
a time; a prototype lookup lights each `__proto__` hop as it crosses it; a
binding is joined to its heap object by an arrow that is drawn, and redrawn
while the boxes are still moving. The answer is still rendered from the step
data, so skipping ahead never shows a search mid-flight as if it were a result.

**One vocabulary of movement.** `flow.tsx` owns the transitions, the token, the
region, the output log and the caption, so seven visuals animate the same way
rather than seven ways.

## Alternatives considered

**Author the animation per step, as keyframes.** Total control, and it makes
every new visual a bespoke piece of work. The library exists so a lesson can add
a visual by describing states; describing motion instead moves the cost to
exactly the place we do not want it.

**A video or a GIF per concept.** Sharper than anything built from DOM nodes,
and dead: it cannot be stepped, cannot be paused on the frame that matters, and
goes stale the moment the lesson text around it changes.

**Leave playback manual.** Honest and quiet. It also means the common case - a
reader scrolling a lesson - sees a still frame, which is what prompted this in
the first place.

## Consequences

End-to-end tests run with reduced motion forced on, because a visual that starts
itself races any assertion about which step is showing. One spec opts back in
and asserts that autoplay happens; the rest drive the steps by hand.

Exit animations mean a removed element is still in the DOM for a moment. One
call stack test now waits for the pop rather than asserting immediately after
the click, which is a real change in what the test asserts about timing, not in
what it asserts about behaviour.

Duplicate labels within one region would share a layout id and fight over which
element is which. The event loop de-duplicates them; any future visual that
allows repeats has to do the same.

Reduced motion is not a degraded path here: layout ids, probes and the drawn
arrows are all skipped, and the visual becomes the old frame-swap, which is the
correct thing for someone who asked for less movement.
