import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Managing the waiting, not the work',
    heading: 'Why this matters',
    script: `The promises topic explained what the four combinators do. This one is
      about picking one for a real requirement, and about knowing what your
      choice does to the work you did not wait for.

      Because every mistake here is a variation of one idea. People treat a
      combinator as if it manages the work. It only manages the waiting. When
      promise all rejects, the other requests keep running. When race picks a
      winner, the losers keep running. Keeping that straight is most of the
      topic.`,
  },
  {
    title: 'Choosing by failure mode',
    heading: 'Choosing by failure mode',
    script: `Choose a combinator by asking what one failure should mean.

      Promise all, when every result matters and any failure makes the whole
      thing pointless. It rejects with the first reason it saw, and it gives you
      results in input order no matter when each one finished.

      Promise all settled, when you want everything attempted and each outcome
      reported. It never rejects. A dashboard that should render two working
      widgets even though the third failed is all settled territory.

      Promise race, when the first settlement wins, failure included. That is
      what a timeout is.

      And promise any, when the first success wins and only total failure
      matters. It rejects with an aggregate error whose errors array holds every
      individual reason. If you find yourself logging just the message of that
      error, you are throwing away the detail.`,
  },
  {
    title: 'Fan-out with partial success',
    heading: 'Fan-out with partial success',
    script: `Here is the pattern worth practising until it is automatic. Load three
      things for a dashboard. One fails. The page should show the other two and
      report the failure, not render nothing.

      All settled over the three requests gives you an array of outcome objects,
      each tagged fulfilled or rejected. Filter on the status, map the fulfilled
      ones to their values, and hand the rejected reasons to whatever surfaces
      errors. Nothing swallowed, nothing lost.

      The equally valid alternative is attaching a catch returning a default to
      each promise before combining them. Pick per call site. Use all settled
      when the caller wants to see outcomes, per-promise defaults when each
      failure has an obvious fallback.`,
  },
  {
    title: 'Timeouts, retries and caps',
    heading: 'Fallbacks and first wins',
    script: `A timeout is a race between the work and a timer that rejects. Two
      details make it production quality. Clear the timer in finally, so an
      early settle does not leave a pending timer keeping a node process alive.
      And remember the race stops your waiting, not the request itself. For
      that you need abort controller, which has its own topic.

      Retries are written around a promise, never by one. A loop that awaits
      the task in a try, sleeps with a growing delay in the catch, and rethrows
      on the final attempt. The backoff matters as much as the retry. Hammering
      an overloaded server at full rate makes its outage worse.

      And when an API allows three concurrent requests, batch: slice the ids
      into groups of three and await promise all per group in a loop. That
      await inside a loop is not the accidental bottleneck bug. Here the
      serialisation is the requirement.`,
  },
  {
    title: 'What happens to the losers',
    heading: 'What happens to the losers',
    script: `Say it once more because it is the interview follow-up. Nothing in the
      promise API stops work. A combinator decides who gets to matter, not who
      gets to run. Abandoned promises still finish, their side effects still
      happen, and their unhandled rejections can still surface after you
      believed the failure was dealt with.

      If abandoned work must actually stop, cancellation has to be built beside
      the promises, and that is abort controller.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked to load several resources concurrently but survive individual
      failures, answer all settled, then split fulfilled from rejected. Expect
      the follow-up: why not promise all with per-item catches? Both work. Say
      what each communicates and pick one out loud.

      Other follow-ups worth being ready for: writing a timeout with race and
      clearing the timer, the aggregate error any rejects with, and capping
      concurrency by batching all inside a loop.

      One trap to close on. An async callback in a map returns nothing unless
      told to. Mapping with async and forgetting the return gives you an array
      of undefined wrapped in fulfilled promises, and everything downstream
      reads as though it worked.`,
  },
]
