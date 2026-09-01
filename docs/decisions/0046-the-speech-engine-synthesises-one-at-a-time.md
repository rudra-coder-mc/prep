# 0046. The speech engine synthesises one at a time

Status: accepted
Date: 2026-09-01

## Context

`services/tts/server.py` loads one voice into one process and serves it over
HTTP. Flask gives every request its own thread, so two requests that arrive
together run two inferences on the same voice at the same time.

For months `apps/web/e2e/spoken-questions.spec.ts` was recorded in `HANDOFF.md`
as a flaky spec. It was never the spec. `docker compose logs tts` held twenty
instances of `terminate called without an active exception`, and reading them as
twenty crashes is what made the diagnosis take so long. They are two different
events wearing one line.

The ones that broke a spec carry a cause from onnxruntime on the line above
them, `Non-zero status code returned while running Conv node. Status Message:
GetElementType is not implemented`, which is what a node reports when an input
is not a tensor. An allocation that did not happen leaves exactly that behind.
The process died with a synthesis in flight, whoever was waiting got nothing,
and the spec timed out. The rest carry no such line and happen as the container
is being stopped at the end of a run, where nothing is waiting on anything.

The cost of one inference is the fact the design missed. A sentence is the unit:
piper splits text on sentence ends and runs the model once per sentence. On this
machine, one 338 character sentence takes the container from 168 MiB at rest to
a peak of 0.58 GiB while it decodes. Concurrent requests each want their own,
and they add up. Two at once peak at 0.99 GiB, four at 1.83 GiB, six at
3.19 GiB.

Given a machine with 16 GiB of memory, a Docker VM allowed 11.67 GiB of it, and a
`npm run verify` run that has a Next build, a Postgres, and a Chromium in it
already, a spike of gigabytes is what fails. The same failure reproduces on
demand by bounding the memory instead of loading the machine. In a container
limited to 1500 MiB, one request peaks at 0.58 GiB and four kill the process with
exit code 137, losing all four.

The callers cannot coordinate. A reader presses play, a lesson page warms the
section it expects to need next, and `npm run narration:build` records a whole
track, and none of them knows about the others. `warmRecording` serialises warms
against each other and `narrate` joins requests for the same key, which is why
the overlap is occasional rather than constant, and why the crash moved between
specs.

## Decision

**One synthesis runs at a time, and the engine is what enforces it.** A module
level `threading.Lock` in `services/tts/server.py` is held around
`voice.synthesize_wav` and released before the Opus encoding, which costs a
subprocess and a few megabytes rather than the model's working set. Requests
that arrive during a synthesis wait for it and are then served.

The engine owns this because the engine is the shared resource. Any rule the
web application applied would hold only for the callers that went through it,
and `npm run narration:build` does not.

Peak memory is now flat in the number of callers. Four concurrent requests peak
at 0.80 GiB and six at 0.82 GiB, against 1.83 GiB and 3.19 GiB before. The
container limited to 1500 MiB serves six at once and stays up.

## Alternatives considered

**Serialise in the application.** `narrate` already has an in-flight map, and
widening it from one key to all keys is a few lines in TypeScript rather than a
rebuild of the image. It only covers the app. `npm run narration:build` reaches
the engine directly, and an engine that dies when somebody else calls it is
still broken.

**Refuse a request while one is running.** A 503 with a retry is honest about
being busy and needs no queue. Every caller then grows retry logic to say the
same thing the lock says once, and a reader pressing play would hear a failure
where waiting two seconds is the right answer.

**Run several processes, one voice each.** Gunicorn with four workers is the
usual shape for a Flask service, and it would raise throughput. It multiplies
the memory by four rather than bounding it, which is the opposite of the fix,
and nothing here needs throughput: narration is recorded ahead of time and a
reader asks for one recording at a time.

**Give the Docker VM more memory.** The machine has 16 GiB and the VM is already
allowed 11.67 GiB of it. Raising the limit moves the threshold and leaves the
engine able to spend without limit.

## Consequences

The flaky spec is not flaky. `apps/web/e2e/spoken-questions.spec.ts` and every
other spec that reaches the real engine now depends on a process that concurrent
callers cannot kill, so `npm run verify` can be trusted again.

`terminate called without an active exception` still appears once at the end of
a run, as the container is stopped. It is the teardown inside onnxruntime rather
than a failed request, the container is on its way down when it happens, and the
only thing it costs is an exit code of 133 instead of 0. It is left alone: what
would silence it is a signal handler that ends the process before Python
finalises, and hiding the line is worth less than being able to read it. The way
to tell the two apart is the line above: a crash that lost a request names the
onnxruntime node it failed in, and this one names nothing.

Concurrent callers wait. Six requests at once take about six times as long as
one, which is what serialising means. Nothing in the platform asks for audio in
bulk while somebody is listening: `npm run narration:build` is the only bulk
caller and it runs alone.

The queue is first come first served, and the engine cannot tell a person from a
warm. A reader who presses play while `POST /api/speech/warm` is making the next
section waits for that recording before their own starts, where before the two
ran together. Both were slow either way, because one inference already saturates
the machine, but the order is now fixed. If that wait is ever felt, the answer is
for the application to hold its warms while a reader is waiting rather than for
the engine to learn about priority.

The other axis is still unbounded. One inference costs memory in proportion to
the length of a single sentence: 2199 characters in one sentence peak at
2.80 GiB, 4399 at 5.91 GiB, and 8799 kill a container with 11.67 GiB to spend.
`MAX_SCRIPT_LENGTH` caps a whole script at 3000 characters, in the app and in
the content schema both, and it says nothing about sentences, so 3000 characters
of ordinary prose and 3000 characters in one sentence cost very different
amounts. The longest sentence in `content/` is 424 characters, which is why no
sentence cap was added: it would be a number chosen against nothing.

`apps/web/src/lib/speech/speech.integration.test.ts` sends four concurrent
requests to the real engine and asserts that every one is answered and that the
engine still serves `/info` afterwards. It cannot see the memory, which is where
the fix works, so `services/tts/server.py` records the measurement beside the
lock.

The image has to be rebuilt for this. `docker compose build tts` is not part of
`npm run verify`, and a machine running an image built before this decision has
the crash.
