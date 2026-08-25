import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Bridging push and pull',
    heading: 'Why this matters',
    script: `Async iteration is the bridge between two worlds. Events, streams and
      queues push values at you whenever they arrive. Loops want to pull one
      value at a time, on their own schedule. For await of, and async
      generators, are the machinery that lets a pull-shaped loop consume
      push-shaped sources.

      Interviews use this topic to test whether someone understands the iterator
      protocol well enough to see it twice, once with promises underneath. It
      also hides the most misunderstood await in the language, the one inside
      the loop.`,
  },
  {
    title: 'The protocol, one promise deeper',
    heading: 'for await...of',
    script: `The protocol is the sync iterator protocol one promise deeper. An async
      iterable is found through symbol dot asyncIterator, and its next method
      returns a promise of an object holding value and done. For await of is
      the consumer syntax. Each pass asks for next, awaits it, runs the body,
      repeats until done.

      Two details worth having ready. Async generators produce these objects
      automatically, which makes them the usual way to build one. And promises
      you yield are awaited transparently. The loop never sees a wrapper, so a
      producer can yield a cache hit and a fetch interchangeably.

      The classic bug is reaching for plain for of. On an async iterable it
      throws immediately, because there is no symbol iterator. Over a mere array
      of promises it quietly hands you pending promise objects as values. Same
      confusion, no exception to wake you.`,
  },
  {
    title: 'Producers that wait to be asked',
    heading: 'Async generators',
    script: `An async generator is a generator whose yields can await. The property
      that matters most: code between two yields runs when the consumer asks
      for the next value, not when the generator was created. Nothing happens
      until pulled.

      That laziness is the payoff shape. Pagination written once in the
      producer, consumed with a three line loop, fetching page two only because
      the consumer survived page one.

      It is also what makes generators converters from push to pull. Events
      shove values into a queue, the generator holds them, and next drains the
      queue at the consumer's pace. Breaking out of the loop calls return on
      the iterator, which unwinds into the producer's finally block. Cleanup
      lives with the producer, delivered by the protocol.`,
  },
  {
    title: 'What stays sequential',
    heading: 'What stays sequential',
    script: `For await processes one item at a time. Pull a value, run the whole
      body to completion, then pull the next. A hundred urls fetched inside the
      loop take a hundred seconds, one request in flight at a time.

      That sequentiality is right when order matters or memory argues against
      loading everything. For independent work it is a bottleneck, and the fix
      separates acquisition from processing. Fetch in bounded batches with
      promise all, then iterate the settled results.

      Choose per problem. Async iteration answers consume a stream one at a
      time. It does not answer process independent work fast.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked for the difference between an iterator and an async iterator:
      same protocol, next returning value and done, but found via symbol dot
      asyncIterator and each next returns a promise. Yielded promises are
      awaited automatically.

      Expect follow-ups in three directions. Turning an event emitter into an
      async iterable, which is the queue plus resolver converter with cleanup
      in finally. What break does to the generator, which is calling return,
      running finally, closing handles. And where the loop is secretly
      sequential, which is everywhere, by design.

      If you are asked whether two rapid next calls run concurrently, they do
      not. They queue. Generators coordinate. They never parallelise.`,
  },
]
