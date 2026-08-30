import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'The gap where leaks live',
    heading: 'Why this matters',
    script: `You never free anything, so it is easy to believe memory is not your
      problem. It is, and it arrives in the least convenient form: a process that
      is fine for an hour, slow after a day and dead after a week, on a machine
      you cannot attach a debugger to.

      The whole subject rests on one sentence. The collector frees what your
      program cannot reach, not what your program has finished with.

      Every leak in JavaScript is the gap between those two, and every fix is
      finding the reference you forgot you were still holding.`,
  },
  {
    title: 'Reachable, not used',
    heading: 'Reachable, not used',
    script: `Collection starts from a set of roots. The global object, every
      binding on the current call stack, and whatever the host holds, which in a
      browser includes the document tree. Anything reachable by following
      references from a root survives. Everything else is garbage, whether or not
      your code would ever have looked at it again.

      Take two objects that point at each other, a parent and a child, and let
      the variable that held the parent be reassigned. A count of references to
      each of them is still one, not zero. But neither is on any path from a
      root, so both are collected together. A cycle is not a leak.

      That is why does JavaScript use reference counting is a real interview
      question. Counting cannot free a cycle, because every object in one is
      referenced by another object in it. Tracing from the roots has no such
      problem, and tracing is what every current engine does.

      There is a historical exception behind the folklore. Old Internet Explorer
      kept DOM objects on a reference counted heap and JavaScript objects on a
      traced heap, and a reference between the two formed a cycle neither
      collector could free. Breaking those by hand was a genuine fix, twenty
      years ago. It is not one now.`,
  },
  {
    title: 'Generations, sawteeth, and no control',
    heading: 'How the collector actually runs',
    script: `Two facts about the runtime shape all the advice.

      First, most objects die young, so the heap is split by generation. New
      objects go into a small young space, collected often and quickly by copying
      out the few survivors and discarding the rest wholesale. Anything that
      survives a couple of those is promoted into the old space, which is
      collected rarely, by marking everything reachable and sweeping the rest.
      V8 calls the two collectors the scavenger and mark-compact, and does most
      of the marking on other threads to keep the pause short.

      Second, you cannot ask for a collection. There is no way to trigger one
      from ordinary code, no way to know when it will happen, and no way to
      observe that it has. That is deliberate. A program whose behaviour depended
      on collection timing would behave differently on every engine.

      The consequence is what a memory graph looks like. Allocation pushes usage
      up, each collection drops it, and healthy memory is a sawtooth around a
      flat baseline. A leak is a sawtooth whose bottoms keep rising. The peak
      means nothing on its own. The floor after a collection is the number to
      watch.

      And setting a variable to null does not free anything. It removes one
      reference, which matters only if that reference is the one keeping the
      object reachable. Inside a function about to return, it does nothing. In a
      long-lived module level array, it is the entire fix.`,
  },
  {
    title: 'The four shapes',
    heading: 'The shapes of a leak',
    script: `Four shapes cover nearly everything you will meet.

      One. A collection that only grows. A module level Map used as a cache, a
      memo table keyed by request, an array of recent events. Nothing is ever
      removed, so the process holds every key it has ever seen. This is the
      commonest leak in server code, and it is invisible in development because
      the process restarts every time you save a file.

      Two. Timers and listeners that outlive what they were for. setInterval
      holds its callback forever, and the callback holds everything it closed
      over. A listener on something long-lived, like window or a shared emitter,
      is held until you remove it, and removing it needs the same function
      reference you added. Two identical looking arrow functions are two
      different values, so the removal silently does nothing. Name the handler,
      or register it with an abort signal and abort once.

      Three. Detached DOM kept alive from JavaScript. A node removed from the
      document is garbage only if nothing in your code still points at it. A
      cached list of rows, a Map keyed by element, or one reference to a single
      cell is enough, and that last one is worse than it sounds, because a node
      holds its parent. Keeping one cell keeps the whole detached table.

      Four. A closure holding more than it needs. Closures created in the same
      scope share one environment record, and that record holds every variable
      any of them mentions. So a small function that logs a number can keep a
      fifty megabyte buffer alive, because some other closure in the same scope
      referred to the buffer, even one that is never called. The fix is to give
      the long-lived function a scope of its own.`,
  },
  {
    title: 'A cache is a leak with a bound',
    heading: 'Telling a leak from a cache',
    script: `A cache is a leak you decided to have. What separates them is a
      bound, and there are three worth knowing.

      By size. Keep the last N entries and evict the least recently used. That is
      the default answer and the one to give in an interview. A Map makes it easy,
      because it iterates in insertion order, so the oldest key is the first one
      the iterator hands you.

      By time. Evict on age. Right when the risk is data going stale rather than
      data getting big.

      By the lifetime of a key. Hold the key weakly, so the entry disappears when
      the thing it describes does. That is the next topic, and it is the only
      bound that needs no policy at all.

      To confirm a suspected leak, the technique that works is repetition and
      comparison. Do the suspect thing several times. Take a heap snapshot,
      repeat the interaction, take another, and compare: you are looking for
      objects allocated between the two that are still alive in the second. Then
      read the retainer path, the chain of references from a root down to the
      object, and the answer is somewhere on it.

      The one thing not to do is reason about it from the code alone. Retainer
      paths are routinely surprising, and every hour spent guessing which line it
      is would have been a snapshot.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what a memory leak is in a garbage collected language, say: an
      object that is still reachable and no longer needed. The collector is doing
      its job correctly, and the program is holding a reference it forgot about.
      Then name the four shapes, because that is what turns a definition into an
      answer.

      Asked whether JavaScript uses reference counting, say no, and give the
      reason: counting cannot free a cycle. Engines trace from roots, so two
      objects referring only to each other are collected together.

      Asked how you would find a leak in production, say you watch the floor of
      the sawtooth rather than the peak, then reproduce it locally as a repeated
      interaction, compare two heap snapshots, and read the retainer path.

      Expect a follow up on whether you can force a collection, which is no, and
      one on what setting a variable to null actually does, which is remove one
      reference and nothing else.`,
  },
]
