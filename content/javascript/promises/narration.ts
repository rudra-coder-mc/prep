import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Easy syntax, hard failure modes',
    heading: 'Why this matters',
    script: `Promises are the part of JavaScript most people use correctly by
      imitation, and incorrectly under pressure. The syntax is easy. The failure
      modes are not.

      A missing return silently drops a value. An await inside a loop turns one
      second into ten. And a catch that returns a default turns a real failure
      into a plausible looking success, which is the worst of the three, because
      nothing ever tells you.

      All of it comes back to two ideas. A promise settles once. And combining
      promises is a choice about what should happen when one of them fails.`,
  },
  {
    title: 'Settling, once',
    heading: 'Settling, once',
    script: `A promise is pending until it is either fulfilled with a value, or
      rejected with a reason. That move happens once, and it cannot be undone.
      Later calls to resolve or reject do nothing at all.

      Two useful things follow from that. A promise is safe to hand to several
      consumers, because they cannot interfere with each other. And a handler
      attached long after a promise settled still runs, immediately, rather than
      missing the event.

      One more thing follows, and it is the one people forget. A promise cannot
      be cancelled. There is no state to move it to. That is exactly why abort
      controller exists as a separate mechanism: the promise interface has no
      answer here, so cancellation had to be built beside it rather than into
      it.`,
  },
  {
    title: 'Choosing a combinator',
    heading: 'Choosing a combinator',
    script: `There are four, and choosing between them is a question about
      failure, not about speed.

      Promise all, when you need every result, and any failure makes the whole
      thing pointless. It rejects at the first failure.

      Promise all settled, when you want everything attempted and reported, and
      partial success is fine. It never rejects.

      Promise race, when the first to settle wins, failure included. That is
      what makes it the right tool for a timeout.

      And promise any, when the first to succeed wins, and it only rejects if
      all of them do. That is for redundant sources.

      One trap worth naming. Promise all rejecting does not stop the other work.
      Those promises keep running, and their results are simply thrown away.
      Their side effects still happen. If that matters, you need abort
      controller, not a combinator.`,
  },
  {
    title: 'Where the time goes',
    heading: 'Where the time goes',
    script: `The most common real performance bug in async code is an await
      inside a loop, over work that has no ordering requirement.

      Written that way, three requests that take a second each take three
      seconds, because each await blocks the next iteration from even starting.
      Mapping the same work to promises and awaiting them together takes one
      second, because all three start at once.

      Await in a loop is right in two situations. When each step genuinely
      depends on the result of the previous one. And when you are deliberately
      limiting concurrency, because firing ten thousand requests at once is its
      own kind of bug.

      Outside those two, it is a bottleneck you did not mean to write, and it is
      worth training your eye to spot it.`,
  },
  {
    title: 'The return that is easy to forget',
    heading: 'The `return` that is easy to forget',
    script: `Inside a then callback, if you start another asynchronous
      operation and forget to return it, two things go wrong at once.

      The value is lost, so the next then in the chain receives undefined. And a
      rejection from that inner promise escapes the chain entirely, which means
      your catch at the bottom never sees it.

      That single bug is the strongest practical argument for async and await.
      With await, the value has to go somewhere. You assign it to something, and
      the compiler and your eyes both notice if you do not. The chain version
      lets you drop it silently.

      The related trap is the catch that swallows. Catching an error and
      returning a default is fine when the default is genuinely correct. It is a
      disaster when it converts a failed request into an empty list that the
      rest of your program treats as a real answer.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked about promise all versus all settled, answer in terms of
      failure. All is all or nothing and rejects at the first failure. All
      settled never rejects and reports each outcome. Use all when a partial
      result is useless, and all settled when it is not.

      Expect follow ups on writing a timeout with race, on why all does not
      cancel the losers, and on implementing a promise from scratch. That last
      one sounds intimidating and is mostly bookkeeping: hold a state, hold a
      value, hold a list of callbacks, and make sure the state only ever moves
      once.

      If you are asked to spot the bug in a chain, look for a missing return
      first. It is the most common one, and it is the one that hides best.`,
  },
]
