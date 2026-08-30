# 0037. The mobile archive carries the answers

Status: accepted
Date: 2026-08-30

## Context

`0011` grades choice questions on the server so that the correct option is never
in the page before the pick is made, and `0023` extends the same reasoning to
every form: the answer in full arrives with the verdict, not before it.

A device that works with the server switched off cannot ask anything what the
correct option is. The answers have to travel with the questions, or the recall
loop does not work offline, which is the reason the mobile app exists.

## Decision

The content archive carries every question in full, correct options included,
and the phone grades locally using the same functions the server uses.

The guarantee weakens from "the answer is not on the device" to "the app does
not show the answer until the question has been answered". No effort is spent
making the archive hard to read.

## Alternatives considered

**Grade choice questions online only.** It makes the daily queue useless with
the laptop off, which is the entire point of the app.

**Obfuscate or encrypt the archive.** The key ships beside it, so it buys the
appearance of a guarantee and none of the guarantee, in exchange for real
development time.

**Ship the questions and fetch each answer on reveal.** The same failure as
grading online, one step later in the flow.

## Consequences

The recall loop works with nothing switched on, on a train, on a plane, with the
laptop shut.

Somebody willing to dig through app storage can read ahead. That is accepted
deliberately. This is a single-user tool, later shared with a handful of
friends, with nothing to win by cheating: no payment, no ranking, no
credential, and no one to fool but yourself.

The web app is unchanged and keeps grading on the server, so the original
guarantee still holds where it can.

If the platform ever gains something worth cheating for, this is the decision to
revisit, and the shape of the revision is that graded answers stop being
available offline.
