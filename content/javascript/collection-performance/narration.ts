import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Fast on your fixture',
    heading: 'Why this matters',
    script: `Nothing here is exotic. It is find, includes, shift and spread, the
      operations you already use every day. The only new idea is what each one
      does to the elements it does not need to touch.

      That matters because slow code is never slow on the data you wrote it
      with. A lookup inside a loop is instant over the ten rows in your fixture
      and takes four seconds over the ten thousand rows in production, and
      nothing in the diff tells you which one it will be.

      Interviews ask about this in one particular shape. Here is a working
      function, make it fast. The answer is almost always to stop scanning.`,
  },
  {
    title: 'The short list of costs',
    heading: 'The costs worth memorising',
    script: `There is a short list and it covers nearly every decision you will
      make.

      Constant, whatever the size. Reading and writing an object property. Map
      get, set, has and delete. Set has and add. Reading an array by index. Push
      and pop, amortised, which means the array occasionally moves into a larger
      block and averaged over many pushes that is still constant.

      Linear, one pass over everything. indexOf, includes, find, filter, map,
      some, every, reduce and join. Spreading into a new collection. And the
      surprising three: shift, unshift and splice, which move every element
      after the change to a new index.

      Then sort, at n log n comparisons, where each comparison calls your
      comparator.

      The Map guarantee is worth being precise about, because interviewers pick
      at it. The specification does not say hash table. It says a Map has to be
      implemented so that access times are, on average, sublinear in the number
      of entries. That is a promise about growth, and not a promise about any
      particular number of nanoseconds.`,
  },
  {
    title: 'The scan inside the loop',
    heading: 'The loop inside a loop',
    script: `This is the one that matters. Two collections, and a scan of the
      second inside a walk over the first.

      Say you have ten thousand order lines and ten thousand orders, and for each
      line you call find over the orders to get its customer. Find walks from the
      start until it matches, which on average is half the orders, and for a line
      whose order is missing it is all of them. That happens once per line, so
      the two sizes multiply. Around fifty million comparisons.

      Now do it the other way. Make a Map from order id to order, in one pass.
      Ten thousand sets. Then each line is one get, constant however many orders
      there are. Ten thousand more. Fifty million becomes twenty thousand.

      The difference is not just the number. Double the data and the first
      version quadruples while the second doubles.

      The move has one name and several disguises: find inside map, includes
      inside filter, some inside a for loop, a filter over the same array inside
      its own forEach. Every one of them is a scan per element, and every one is
      fixed the same way. Build the index once, outside the loop, then look up.`,
  },
  {
    title: 'The copies nobody wrote',
    heading: 'The copies you did not write',
    script: `Spread makes a new collection every time it runs. Inside a reduce,
      that means a new one per element, each holding a copy of everything
      gathered before it.

      The first callback copies nothing. The second copies one element, the third
      copies two, and on it goes. That sum is n squared over two, so a reduce
      that looks linear is quadratic. A thousand items is half a million copies,
      and every intermediate collection is garbage immediately, which is why this
      shows up in a profile as allocation and garbage collection rather than as
      your own code.

      The array form is spread acc, then item. The object form is spread acc,
      then a computed key, and that one is more common, because it is how people
      turn a list into a lookup.

      The fix is not to give up on immutability. It is to mutate the accumulator
      you just created, which nothing outside the reduce has ever seen. Assign
      into it and return it. Or skip the reduce: Object dot fromEntries over a
      map, or a Map, or a plain for-of loop with a push.

      A local mutation inside a function that returns a fresh value is not shared
      state, and pretending otherwise costs you a factor of n.

      One piece of old advice that no longer belongs on this list is building
      strings with plus-equals in a loop. Engines represent a concatenation as a
      rope rather than copying both sides, so that one is fine. Arrays and
      objects have no equivalent, which is exactly why they still bite.`,
  },
  {
    title: 'Both ends of an array are not the same',
    heading: 'The operations that move everything',
    script: `Shift takes the first element out, and every remaining element moves
      down one index. That is fine once, and quadratic in a loop, which is
      exactly what a queue built on shift is.

      Draining a hundred thousand jobs with shift moves about five billion
      elements. Walking the same array with an index and advancing it moves
      nothing at all. For a long-lived queue you eventually want to drop the
      consumed prefix, but for draining a batch, the pointer is the whole fix.

      Unshift and splice have the same problem for the same reason. Splice is
      worth watching for inside a loop, because it costs twice: the move itself,
      and the way it changes the indexes of everything the loop has not reached
      yet. That is the bug where removing an item makes the loop skip the next
      one.

      Two more array shapes cost something invisible. Delete on an array index
      does not shorten the array, it leaves a hole, and an array with holes loses
      the fast representation the engine was using for it. And setting length to
      zero rather than assigning a new empty array only matters when something
      else holds a reference to the same array.`,
  },
  {
    title: 'When the constant wins',
    heading: 'When the constant beats the curve',
    script: `Growth is not the same thing as speed, and everything so far has been
      about growth.

      Building a Set allocates, hashes every element, and only then makes has
      constant. For six elements checked once, includes on the array is faster,
      and the Set is a slower way to look tidy. The crossover is small, usually
      in the low tens, and it moves with the element type and the engine, which
      is the honest version of that answer.

      The rule that survives contact with real code: care about growth when the
      size comes from data you do not control, and care about the constant when
      the size is fixed and small. A list of the seven days of the week is not a
      scaling problem. A list of orders is.

      And when it does matter, measure rather than argue. Performance dot now
      around the real operation with the real data size is worth more than any
      opinion about which method is faster. Be suspicious of a micro-benchmark
      that runs the same pure expression a million times: mostly it measures
      whether the engine noticed it could skip the work.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked why something is fine in staging and takes six seconds in
      production, answer in order. First look for a scan inside a loop, because
      that is the cost that multiplies. Then for repeated work that could be
      hoisted out. Then for copying in an accumulator. All three are invisible on
      a small fixture and none of them need a profiler to spot.

      Asked when you would use a Set over an array, say: when the same collection
      is tested for membership more than a handful of times. One pass to build
      it, then constant lookups instead of a scan each time. And say the other
      half unprompted, that for one test on a short array it is not worth the
      allocation.

      Asked the complexity of filtering an array by indexOf equals index, the
      classic deduplication one-liner, the answer is quadratic. indexOf is a scan
      and it runs once per element. Spreading a new Set is linear and says what
      it means.

      Expect a follow up on why shift costs more than pop, and one on what Map
      actually guarantees.`,
  },
]
