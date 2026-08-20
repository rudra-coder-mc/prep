# 0005. Confidence-driven interval ladder, not SM-2

**Status:** accepted, 2026-08-19. Superseded in part by `0025`, which keeps the
ladder and the rung lengths but derives confidence from the answer form rather
than asking for it, and lets a correct answer climb one rung at a time.

## Context

The daily recall queue needs a scheduling rule. The handoff explicitly deferred
"complicated spaced repetition" but also wanted more than a static weak-topic
list.

## Decision

Self-rated confidence sets the next interval directly:

| Confidence | Next due    |
| ---------- | ----------- |
| 1          | later today |
| 2          | 1 day       |
| 3          | 3 days      |
| 4          | 7 days      |
| 5          | 14 days     |

A `failed` result resets to the bottom of the ladder regardless of the confidence
rating. `review_schedule` stores the ladder _step_ alongside the due date. The
daily queue is capped and fills in priority order: overdue, then due today, then
weakest topics.

A day counts toward the streak when the queue is cleared, or when any review is
done on a day with an empty queue, so a light day is never a broken streak.

## Alternatives

**SM-2.** Rejected for V1. Better-tuned over years, but it is the complexity the
handoff deferred, and when a queue misbehaves an ease factor is much harder to
reason about than a five-rung ladder.

**No scheduling, weak topics only.** Rejected. Simplest, but topics answered
well are never revisited and decay silently, which defeats the point.

## Consequences

Intervals are predictable and explainable. Storing a step rather than a computed
delta means SM-2 can replace this later without a schema change. The ladder
becomes the initial ease.

Long-term retention past 14 days is not modelled in V1. If topics start decaying
after mastery, that is the signal to extend the ladder or move to SM-2.
