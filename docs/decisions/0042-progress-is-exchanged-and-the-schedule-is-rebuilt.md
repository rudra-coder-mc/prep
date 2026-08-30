# 0042. Progress is exchanged, and the schedule is rebuilt from it

Status: accepted
Date: 2026-08-30

## Context

A device holds everything and needs nothing at rest (`0033`). It answers
questions with the stack switched off, and so does the web app, so both sides
accumulate progress the other has not seen. Neither is authoritative: the phone
was used on the train, the laptop was used at the desk, and both are the same
person doing the same work.

The server can never start the exchange, because it has no route to a sleeping
phone. Every sync is the device asking.

The hard part is not moving rows. It is that a review schedule is a running
total. The web app moves a question one rung per answer and stores where it
landed, which is correct exactly while answers arrive in the order they were
given. A phone that spent a week offline breaks that: it hands over Monday's
answer on Thursday, and applying it to Thursday's rung puts the question
somewhere neither side would have put it.

## Decision

Three things travel, and nothing else does, because nothing else is a fact
somebody entered: **attempts, learned marks and tier picks**. The schedule, the
streak, the daily queue and every topic status are derived from those on
whichever side receives them.

**Attempts merge by id.** An attempt is a fact about a moment, so the id is made
where the answer was given and the same attempt arriving twice changes nothing.
Rows are only ever inserted.

**Learned marks and tier picks merge by timestamp, later wins.** Both are a
person's most recent intention about one topic or one track, so there is nothing
to combine.

All three rules are commutative and idempotent. Two devices merging have nothing
to resolve, and a sync that fails halfway is repaired by the next one rather
than needing to be rolled back, which is why the exchange is not wrapped in a
transaction.

**Ingesting attempts rebuilds rather than steps.** Every question the incoming
attempts touch has its whole history replayed from the bottom rung through
`replaySchedule`, in the order the answers were given. Because the fold applies
the same `nextRung` the live path applies one answer at a time, a question with
no offline history lands exactly where it already was, and one with offline
history lands where it would have landed had the answers arrived on the day.
`daily_activity` is rebuilt the same way, from the days the attempts were
answered on, so a week offline keeps the streak it earned.

`replaySchedule` is in `packages/core`, so the device runs the same fold over its
own copy of the same attempts. That is what makes the two sides agree about when
a question is next due, rather than one of them being told.

**One endpoint, `POST /api/device/sync`.** Everything up and everything back in
one request, because a phone gets one moment of connectivity and there is no
reason to spend it on four. It authenticates with a bearer token like every
other device endpoint (`0040`).

**Attempts come back by when the server learned of them**, which is a new
`attempts.recorded_at`, rather than by when they were answered. A device asks for
everything since the `syncedAt` of its last exchange. Learned marks and tier
picks are exchanged in full both ways instead: there is one row per topic and one
per track, so the curriculum bounds them and a full exchange stays small forever.

**`device_sync` holds one row per device**: its name and when it was last heard
from. It feeds the reminder in the web app and nothing else.

## Alternatives considered

**Apply an incoming attempt to the rung the question is on now.** It is what the
live path does and it is wrong for anything that arrived late: the same three
answers put a question in a different place depending on when the phone happened
to find signal.

**Store the form on the attempt so replay needs no content.** It would remove the
lookup, and it would put a second copy of a question's form in the database,
where it can disagree with `content/`. The form is read from the content instead,
and a question whose content has been deleted keeps the schedule row it has,
since there is nothing left to replay it against.

**Send the schedule as well, and merge it.** Two computed values that have to be
reconciled, when the thing they are computed from is already being exchanged. A
disagreement between them would have no right answer.

**Ask for attempts by `attempted_at`.** It needs no new column and it silently
loses rows. A phone offline all week hands over attempts dated all week, and a
second device that synced on Tuesday would never ask for anything that old.

**Version vectors, or a change log table.** The general answer to the problem
this does not have. Attempts are append-only and identified at the point they are
made, and the other two are single values with a timestamp. Nothing here needs
ordering between devices.

**Wrap the exchange in one transaction.** Correct in the ordinary sense, and it
buys nothing here: every step is idempotent, so a partial sync is repaired by
the next one, and the device retries on any failure anyway.

## Consequences

Both surfaces reach the same answer about what is due, and neither is
authoritative.

The exchange grows with the number of attempts since the last sync, so a device
used daily sends and receives almost nothing.

Replay costs one query and one write per question an ingest touches, not per
question in the bank.

**Exercise progress does not sync.** Nothing about it is hard, and it was left
out because it is the one part of the loop that is neither derived from attempts
nor needed by anything before task 34. It is a fourth collection in the same
payload when that task wants it.

Two devices whose clocks disagree can fold the same answers in a different
order. The ladder is order-sensitive only where a wrong answer is involved, and
the two devices belong to one person on one tailnet, so this is accepted rather
than defended against.
