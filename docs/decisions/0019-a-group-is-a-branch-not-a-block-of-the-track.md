# 0019. A group is a branch, not a block of the track

## Status

Accepted.

## Context

Decision 0012 split the JavaScript track into groups of three or four related
topics, one group per branch, and listed the groups in the order they should be
written. It did not say where a group's topics land in `order`, and the
fundamentals group set an unhelpful precedent by landing contiguously at 10 to
30 and pushing everything else down.

The functions group is the first one where that breaks. It holds four topics:
parameters and arguments, higher order functions, currying and partial
application, and recursion with the call stack. Written as one block after the
existing eight, they would sit at 90 to 120, which puts every one of them in the
wrong place.

Parameters and arguments is more basic than closures and is assumed by it.
Higher order functions assume closures, so they have to come after. Currying
leans on higher order functions, and `bind` is the bridge from currying into
`this` and binding. Recursion is where the call stack gets explained, and the
event loop lesson already assumes the reader knows what the stack is.

So the group is one coherent piece of work and four separate positions in the
teaching order.

## Decision

**A group is a unit of authoring, not a contiguous block of the syllabus.** Its
topics take the `order` values they belong at, and everything below them is
renumbered in the same commit.

The functions group interleaves:

| order | topic                            |
| ----- | -------------------------------- |
| 40    | parameters and arguments         |
| 60    | higher order functions           |
| 70    | currying and partial application |
| 100   | recursion and the call stack     |

Closures moved from 40 to 50, `this` and binding from 50 to 80, prototypes from
60 to 90, the event loop from 70 to 110, and promises from 80 to 120.

**The groups in `TASKS.md` lost their numbers.** They were "Group 2" through
"Group 10", which implied both a fixed sequence and a fixed identity. Shipping
one left a hole in the list, and renumbering the rest each time is churn that
means nothing. They are now named and ordered by position.

## Alternatives considered

**Append the group at 90 to 120 and accept the order.** One line of work saved,
and a reader who follows the track in order meets higher order functions three
topics after the event loop. The `order` field is the only thing that expresses
the teaching sequence, so getting it wrong is not cosmetic.

**Split the group into four branches, one per position.** Consistent with "one
topic, one place", and it throws away the reason groups exist. These four share
vocabulary and cross-reference each other, and writing them together is what
keeps the cross-references honest.

**Use fractional orders so nothing has to be renumbered.** Rejected in 0012 for
the same reason it is rejected here. Renumbering five files is one commit;
`45.5` is permanent.

## Consequences

Shipping a group now touches topics it did not write. That is five one-line
edits here, and it will be more later, so a group's branch is never purely
additive.

Nothing in the database stores `order`, so renumbering costs a merge conflict at
worst, never a migration.

Reviewing a group now includes checking that the numbers still read as a
sequence somebody would want to learn in. That is a judgement call each time,
which is the price of the numbers meaning something.
