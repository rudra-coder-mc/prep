# 0047. The phone syncs when it can, and says nothing when it cannot

Status: accepted
Date: 2026-09-01

## Context

`0042` settled what an exchange carries and how it merges, from the server's end.
It left the device's end to the task that built it, and three questions with it.

When does an exchange start? The server can never begin one, because it has no
route to a sleeping phone, so every sync is the device asking and something on
the device has to do the asking.

What does a failed one cost? The app is built to work with the server switched
off, so a sync is never the thing standing between somebody and their queue.

And what does the device do that the server never has to? On the server the
content and the attempts move together: a question answered there is a question
the process can read. On the phone the curriculum is a download that can be days
behind, so an attempt can arrive for a question this device holds no copy of.

## Decision

**Three triggers, all of them cheap.** A sync runs on launch, on returning to the
foreground, and at the end of a review session. Launch and foreground are when a
phone carried around all day is most likely to be back on the tailnet. The end of
a session is the one moment the device certainly holds something the server does
not.

One exchange runs at a time. All three triggers can land together, and a caller
that arrives while one is running is given the running one.

**Failure is silent.** There is nothing for a person to do about a server that is
switched off, and everything the app offers works without one, so an error on
the screen would train them to ignore errors. Nothing is retried either: the next
launch or the next foreground is the retry. A device that has gone quiet shows up
on the web dashboard instead, which is what `device_sync` is read for (`0042`).

The one place the app says anything is the end of a review session, where the
card says whether the answers went over or are still waiting.

**The device rebuilds what it derives, the way the server does.** Ingesting
attempts replays each affected question through `replaySchedule`, recomputes each
affected topic's last review, and counts each affected day back into
`daily_activity`. Both sides run the same fold over the same attempts, which is
the whole reason they agree about when a question is next due.

**And one rule the server has no need for: a question with attempts and no ladder
row is replayed too, on every exchange.** That is what an ingest leaves behind
when the archive was too old to hold the question. The alternative is an answer
that sits in the table forever with nothing to put the question back into
rotation. A refresh brings the question, the next sync schedules it, and the
repair costs one query that finds nothing on an up-to-date device.

**The order of writes says what a failure costs.** Attempts are marked as sent
first, so a failure after that costs a duplicate send, which the server drops by
id. The watermark is written last, so an exchange that failed anywhere asks from
the same point next time. Sending a row twice is free. Never sending it is not.

## Alternatives considered

**A periodic background sync.** Android's background execution is unreliable
under Expo, and it buys nothing here: the phone is used at a desk or on a train,
and both of those are a launch or a foreground event. Three triggers cover the
same ground with no scheduler to debug.

**Tell the person when a sync fails.** On a device designed to work without a
server, a banner about an unreachable server is noise, and noise that appears
every day teaches somebody to stop reading it. The web dashboard says which
device has been quiet, which is the same information at the moment it means
something.

**Retry with a backoff.** The triggers already are the retry, and a phone that is
offline is usually offline for hours rather than seconds.

**Refuse an attempt naming a question this device does not hold.** It would keep
the tables tidy and lose answers. Keeping the row and repairing the schedule
later keeps them.

**Enrol every learned topic after a refresh.** It would close the matching hole
one level up: a topic learned on the laptop and marked here while the archive was
too old to hold it enrols nothing, and no later refresh puts its questions into
recall. It is a separate change with its own tests, and it is task 42 in
`TASKS.md` rather than part of this one.

## Consequences

Both surfaces agree about what is due once an exchange has run, and neither is
authoritative.

An exchange that lands while a screen is open changes the rows that screen is
built from. The app state carries a revision that a screen can depend on, so the
count of what is due moves without waiting for the screen to be focused again.

A sync on launch means the first thing a fresh install does after signing in is
download the archive, and the exchange waits for it: with no curriculum there is
nothing to replay an attempt against. The trigger fires again as soon as the
archive lands.

Exercise progress still does not travel, as `0042` says. Task 34 adds it as a
fourth collection in the same payload.
