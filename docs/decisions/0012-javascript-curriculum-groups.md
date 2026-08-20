# 0012 - The JavaScript track is built in groups, fundamentals first

## Status

Accepted.

## Context

V1's five topics - closures, the event loop, `this`, prototypes and promises -
are the five topics a JavaScript interview article always lists. They are also
all mid-level: each one assumes scope, coercion and object identity are already
understood, and none of them teaches those.

That gap shows up in the questions. The closures topic explains `var` in a loop
by talking about bindings per iteration, which is a scope answer given inside a
closures lesson. The event loop lesson leans on promise identity. The material
exists, scattered through topics that are not about it.

Covering "anything reasonably asked in a JavaScript interview" is somewhere
around thirty topics. That cannot be one task, and a list of thirty unordered
topics is not a plan either - it is a backlog nobody can start.

## Decision

**The track is planned as groups of three or four related topics, and one group
is one task and one branch.** A group is small enough to finish in a session and
large enough that its topics can reference each other honestly.

**Fundamentals come first, and existing topics were renumbered to sit after
them.** Types and coercion, scope and hoisting, and values and references now
occupy orders 10 to 30, and the original five moved to 40 to 80. The `order`
field is the teaching order for the whole track, not the order things were
written in.

**`order` runs in tens and gets renumbered when something is inserted.** The
alternative - filling the gaps with 45 and 47 - buys one insertion and then
reads as archaeology. Renumbering a directory of files is a two-line change and
the numbers stay meaningful.

**Every topic carries the same question mix**: concept, output, debugging,
coding, scenario, interview, and three or four multiple choice. A topic missing
a form is a topic that cannot be drilled the way an interview drills it.

## Alternatives considered

**Keep adding topics one at a time, in whatever order feels next.** This is how
the five got written and it worked, because five topics do not need a plan. It
stops working at thirty: without groups there is no way to tell what is missing,
and the natural bias is to write the interesting topics and skip the ones that
are merely necessary.

**Write all thirty meta files first as a skeleton, then fill them in.** It makes
the plan visible in the product, which was the appeal. It also puts thirty
topics in front of a user that cannot be opened, and an empty topic is worse
than an absent one - it looks like a broken page rather than a plan.

**Leave the original five where they were and give the fundamentals negative or
fractional orders.** Rejected as a hack that saves five one-line edits and
permanently confuses anyone reading the numbers.

## Consequences

Each group is a real authoring session, not a quick task. Ten questions and two
exercises per topic, written to interview standard, is most of the work, and it
does not parallelise across a branch.

The narration task grows with every group shipped. Eight topics need scripts
now; thirty will need thirty. That is the tax accepted in 0010, and it is worth
restating: writing content is now two jobs, the lesson and the script.

Renumbering means a topic's `order` can change under an existing branch. Nothing
in the database references it, so the cost is a merge conflict in one file
rather than a migration.
