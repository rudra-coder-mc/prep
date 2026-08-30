import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'One thread, and a schedule',
    heading: 'Why this matters',
    script: `JavaScript runs your code on one thread. Everything you have ever
      heard about it being non blocking is a statement about how work is
      scheduled, not about work happening in parallel.

      Understanding the schedule is what lets you answer why a timeout of zero
      fires after a promise, why a spinner never appears before a long loop, and
      why just make it async sometimes fixes nothing at all.

      This is also the topic where confident sounding wrong answers are most
      common in interviews. Which makes a precise one unusually valuable.`,
  },
  {
    title: 'The model',
    heading: 'The model',
    script: `There is one call stack. While anything is on it, nothing else can
      run. No timers, no promise callbacks, no clicks, no rendering.

      When the stack empties, the loop does the same three things, forever.

      One. Take one macrotask and run it to completion. Two. Drain the whole
      microtask queue, including microtasks that were queued by other
      microtasks. Three. Render, if the browser thinks a frame is due.

      The asymmetry between steps one and two is where everything else comes
      from. One macrotask per turn. But microtasks until there are none left.
      Say that sentence back to yourself, because almost every question in this
      area is testing whether you know it.`,
  },
  {
    title: 'Which is which',
    heading: 'Which is which',
    script: `Macrotasks are what the loop picks up one at a time. Timeouts,
      intervals, input and output callbacks, and user interface events like
      clicks.

      Microtasks are what runs at the end of the current turn. Promise
      reactions, which means then, catch and finally. Queue microtask. And
      everything after an await.

      Here is the consequence that trips people up. A timeout of zero does not
      mean as soon as possible. It means on a future turn of the loop, no sooner
      than now. A promise callback queued much later in your code still runs
      first, because it goes on the microtask queue, which is drained before the
      loop ever picks up another macrotask.`,
  },
  {
    title: 'Where await splits a function',
    heading: 'Where `await` splits a function',
    script: `Await is the part people get wrong under pressure, and it has a
      simple rule.

      An async function runs synchronously up to its first await. Everything
      after that await is a microtask.

      So an async function is not deferred. Calling it runs its body right now,
      immediately, on the current stack, until it hits an await. Only at that
      point does it hand control back to the caller, and only the remainder of
      the body gets scheduled.

      That is why logging before the first await in an async function prints in
      source order with the surrounding code, and logging after it does not. If
      you can explain that split cleanly, you can order any of these puzzles.`,
  },
  {
    title: 'Rendering is in the loop, not above it',
    heading: 'Rendering is in the loop, not above it',
    script: `A change to the page does not paint. It marks the page as needing
      work, and the browser does that work when it next gets the thread, between
      macrotasks.

      Which is why the classic spinner code never shows a spinner. You set the
      spinner visible, then immediately do two seconds of synchronous work. The
      browser never gets the thread in between, so the first thing it paints is
      the state after the work finished.

      There are two fixes and they are not the same. Yielding to the loop, with
      a timeout, lets a frame happen, but the two seconds of work still freeze
      everything once it starts. Moving the work to a worker is the real answer,
      because the work is genuinely off the thread.

      Draining a very long microtask chain has the same problem, incidentally.
      Microtasks run before rendering, so a microtask that queues another
      microtask forever starves the frame just as effectively as a long loop.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `You will be given a snippet with a log, a timeout, a promise then,
      and possibly an async function, and asked for the output order. Do not
      pattern match. Walk it.

      Say what runs synchronously, in source order, until the stack is empty.
      Then drain the microtasks, in the order they were queued, remembering that
      draining can add more. Then take one macrotask, and repeat.

      Expect follow ups on the difference between a timeout of zero and queue
      microtask, on whether a promise executor function runs synchronously, and
      it does, and on what happens if a microtask throws. Answer those by
      walking the same three steps every time. The method is worth more than any
      individual answer.`,
  },
]
