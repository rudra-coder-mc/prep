# 0010. Interview preparation is the product, and it is not one language

## Status

Accepted.

## Context

V1 shipped as five JavaScript topics behind a shell that says so. The dashboard
is headed "Track / JavaScript", the topic list calls `getTechnology('javascript')`
directly, and the top bar carries a lettered tile as a logo.

That was accurate when JavaScript was the only content, but it encodes a
narrower product than the one being built. Two things are now clear about the
intended shape, and neither survives a JavaScript shaped shell:

The platform is for interview preparation specifically, not general study. The
question forms that matter are the ones interviews actually use, and the mode of
use is drilling under time pressure rather than reading.

There will be many technologies. The architecture already supports this. A topic
is a directory, attempts are keyed by slug, and nothing in the schema knows what
JavaScript is. But the interface contradicts that, and an interface that
contradicts the architecture is the version people believe.

## Decision

**The shell is track agnostic.** No page hardcodes a technology. The dashboard
aggregates across everything under `content/` and lists tracks as data. Adding
a track stays what it already is at the data layer: adding a directory.

**Interview is the primary mode; learning is a declared second.** The two are
split in the interface rather than blended. Interview preparation is the default
and gets the work. A learning mode exists as a visible placeholder, because
something planned and unbuilt should look planned and unbuilt rather than
absent.

**Questions that can be graded by machine are graded by machine.** Self
assessment was chosen in V1 because grading free text explanations reliably is
harder than the rest of the platform combined, and that reasoning still holds
for concept questions. It does not hold for a multiple choice answer or a short
program's output, where the correct answer is exact. Those grade themselves.
This narrows the scope of self assessment rather than replacing it.

**A topic can be listened to, from a script written for speech.** Audio is not
an accessibility afterthought here, it is a second way to consume a topic when
reading is the bottleneck. That only works if the spoken text is written as
speech. Reading a lesson aloud verbatim produces something worse than silence.

**Dark only.** There is no light theme and there will not be one. It is one
person's tool on one machine, and a second theme doubles what every visual
change has to be checked against for no benefit.

## Alternatives considered

**Keep the JavaScript framing until a second track exists.** Honest about
today, but the framing is load bearing. Every new page copies the shape of the
last one, so the hardcoded technology would spread faster than it could be
removed. The shell is cheaper to generalise while there are four pages than
forty.

**Auto grade everything, including concept questions.** Rejected for the same
reason as in V1. Grading "explain closures" needs a model in the loop, and a
wrong verdict on a correct explanation is worse than no verdict at all, because
it trains the wrong thing.

**Generate narration from the lesson MDX by stripping code and components.**
Free for every topic forever, and it was tempting for exactly that reason. It
produces prose with the rhythm of a written document, which is precisely the
failure this feature exists to avoid. Written scripts cost real authoring time
per topic and are still worth it.

## Consequences

Every topic now carries two authoring costs beyond its lesson: questions in both
gradeable forms, and a narration script. That is a real tax on the plan to cover
everything a JavaScript interview can ask, and it will slow content down.

The narration scripts are a second source of truth about each topic. When a
lesson changes, its script can silently disagree with it. Nothing detects that,
and the content check cannot, so it stays a discipline rather than a guarantee.

Audio adds the first piece of infrastructure that is not the app or the
database. Whichever engine is chosen, `docker compose up` has to keep being the
only setup step, which rules out anything needing a manual model download or an
API key to work on a clean checkout.
