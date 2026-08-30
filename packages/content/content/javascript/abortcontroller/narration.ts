import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Cooperative cancellation',
    heading: 'Why this matters',
    script: `Every combinator conversation ends the same way. Nothing in the promise
      API stops work. Abort controller is what stops work.

      The one sentence model is worth memorising. A promise cannot be cancelled,
      so cancellation is cooperative. A signal is a flag everyone can watch, and
      stopping still has to be built into the code doing the work. Interviews
      like this topic because it separates people who know the promise model
      from people who can build with it.`,
  },
  {
    title: 'The pieces',
    heading: 'The pieces',
    script: `A controller makes signals. You pass the signal to whatever should be
      cancellable, and call abort on the controller when the work becomes
      unwanted.

      A signal carries three things worth knowing. A boolean you can read at any
      time, an event that fires when it flips, and throwIfAborted, which turns
      the flag into an exception on demand. Abort also takes an optional reason,
      and that reason arrives as the rejection reason for anything watching,
      which lets callers tell superseded apart from cancelled for cause.

      Aborting a fetch in flight rejects its promise with an abort error. And
      aborting after completion does nothing at all. The signal settles once,
      like a promise.`,
  },
  {
    title: 'Timeouts that actually stop the request',
    heading: 'Wiring fetch to a deadline',
    script: `Here is the distinction interviewers listen for. Racing a request
      against a timer stops your waiting. The timer wins, your await throws, and
      the request keeps running in the background, paying for bandwidth and
      server time for nothing.

      Passing an abort signal stops the request itself. Fetch sees the abort and
      its promise rejects with an abort error. In modern runtimes you do not
      even need a controller for deadlines: abort signal timeout builds a signal
      that aborts itself after the given milliseconds. Reach for that first, and
      build a controller by hand only when something other than time does the
      aborting.`,
  },
  {
    title: 'Your own work',
    heading: 'Cancelling your own async work',
    script: `A signal means nothing until code checks it. Between await points there
      is no natural checkpoint, so throwIfAborted makes one. Call it between
      steps of your own multi-step work. Check per iteration inside long loops.
      Give event-style sources an abort listener that closes them.

      Without those checkpoints the function runs to completion no matter what
      the caller wanted. Accepting a signal you never read is worse than not
      accepting one, because it lies about being cancellable.

      And one honest limit. A tight synchronous loop never yields, so nothing
      else gets to run, including anything that would notice the abort. Chunk
      the work with awaits between pieces, or move real computation into a
      worker that can be terminated outright.`,
  },
  {
    title: 'The stale search pattern',
    heading: 'Stale requests: the pattern worth memorising',
    script: `One controller per request, kept in a variable. On every keystroke,
      abort the previous controller and start a fresh one. The superseded
      request dies mid-flight instead of arriving late and overwriting newer
      results.

      The catch treats one specific error as success-shaped silence. If the
      error name is abort error, return quietly. That is not error handling; it
      is control flow, the mechanism working. Everything else propagates
      untouched, so genuine failures still surface. Matching narrowly is the
      discipline this pattern teaches.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked how you cancel an async operation in JavaScript, start with the
      constraint. Promises cannot be cancelled, so cancellation is cooperative
      via abort controller. Then wire it end to end out loud. Signal into
      fetch. ThrowIfAborted between steps of your own work. Abort error treated
      as control flow. Abort signal timeout and any for composition.

      Expect follow-ups on why racing a timer is not cancellation, on cancelling
      CPU-bound work, and on cleaning up listeners when a signal outlives the
      operation. Answering the first one correctly, before they ask, is usually
      the moment the interviewer moves on.`,
  },
]
