import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Boundaries, not bugs',
    heading: 'Why this matters',
    script: `Try and catch is synchronous by reach. It catches what throws while it
      is on the stack. Await puts the rejection back on your stack, and that is
      the whole trick behind async error handling.

      Everything else is a story about boundaries. Places where control crosses
      a gap, and a throw lands where nobody is catching any more. The bugs this
      produces are quiet ones. The error happened. It just never reached anyone
      who could have done something about it.`,
  },
  {
    title: 'try/catch works again',
    heading: 'try/catch works again — if you await',
    script: `Awaiting a rejected promise throws its reason at the await. That means
      ordinary try and catch around your awaits behaves exactly the way it does
      for synchronous code, which is the best thing async await ever did for
      error handling.

      The rule with teeth is the other side of it. A promise you do not await
      is not covered. The try block finishes in microseconds. The promise
      rejects later, from outside the block, into whatever context happens to
      be around. Usually nothing.`,
  },
  {
    title: 'Where errors cross over',
    heading: 'Errors that cross a boundary',
    script: `Four shapes cover nearly every lost error.

      A promise created but not awaited. A throw inside a callback the platform
      schedules later, like a timer or an event handler, where your stack is
      long gone. Fire and forget, where the promise is discarded with no catch.
      And the mid-chain catch that returns a default, turning failure into a
      success-shaped value that downstream can never question.

      The fix has the same shape every time. Give the asynchronous work a
      destination for its failure. Await it, attach a catch at creation, or use
      the source's own error channel. You cannot catch across a scheduling
      boundary. You can only convert the failure into something with somewhere
      to go.`,
  },
  {
    title: 'finally',
    heading: 'finally',
    script: `Finally runs on both paths and swallows nothing by default. A value
      returned from a promise's finally callback is ignored, and the original
      outcome passes through unchanged.

      Two exceptions worth knowing precisely. If finally throws, that error
      replaces the outcome. And in plain functions, unlike promises, a return
      inside a finally block really does override the function's result,
      silently discarding whatever try was returning.

      So use finally for cleanup. Timers, spinners, cursors. Never as the place
      where the result gets decided.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked where an error can get lost in asynchronous code, name the
      boundaries rather than reciting fixes. Un-awaited promises first, they
      are the most common by a distance. Then timer and event callbacks, then
      fire and forget, then mid-chain recovery, then the broad try that catches
      everything but explains nothing.

      Expect follow-ups on how a throw travels down a chain of thens, why try
      cannot reach into a setTimeout, and what unhandled rejection events are
      and when they fire.

      Close with the hygiene points unprompted and you sound senior. Throw real
      error objects so stacks survive. Keep a global unhandled rejection
      listener as a detector, never as a strategy. And check your logger does
      not stringify errors into empty objects, because most teams have that bug
      live in production right now.`,
  },
]
