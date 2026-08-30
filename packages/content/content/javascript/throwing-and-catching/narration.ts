import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'The other way out of a function',
    heading: 'Why this matters',
    script: `Every function you write has two ways out. It can return, and it can
      fail. The return is the one people design. The failure is the one that
      decides whether the program is debuggable at three in the morning.

      Try, catch and finally is a small piece of syntax with a surprising number
      of exact rules, and interviews go straight at them, because most people
      learn the happy shape and never read the specification.

      What order do the blocks run in. What happens to the frames between the
      throw and the handler. What a return inside finally does to the value you
      thought you were returning. Each of those is a real bug somebody has
      shipped.`,
  },
  {
    title: 'A throw discards the frames it passes',
    heading: 'What throw does to the stack',
    script: `Throw takes any value and stops the current function on the spot. The
      engine then walks back down the call stack looking for a try block that
      has a catch.

      Every frame it passes is discarded. The rest of that function's body never
      runs, and it never returns anything to its caller. That is the difference
      between a throw and an error code: a returned failure has to be checked at
      every level, and a thrown one skips every level that has nothing to say
      about it.

      The exception is finally. Unwinding through a frame does run its finally
      blocks, which is what makes finally usable for releasing a lock or closing
      a connection.

      If no frame has a handler, the exception reaches the top. In a browser
      that fires the window error handler. In Node it fires the uncaught
      exception event and, with nothing listening, prints the stack and exits
      non-zero. Crashing is correct there. A program that has already gone wrong
      is not one you want continuing.

      One more rule from the same section. You can throw anything, and you
      should throw an Error, because only an Error captures where it was thrown.
      A thrown string arrives with no message, no name and no stack, and the log
      that was meant to tell you what happened says undefined.`,
  },
  {
    title: 'The rules, in a short list',
    heading: 'try, catch, finally',
    script: `Five rules, and every one of them gets asked about.

      A try needs at least one of the other two. Catch alone, finally alone, or
      both, in that order.

      Catch runs only if something was thrown, and only for a throw from inside
      the try block, including from anything it called.

      Finally runs either way. After the try if nothing failed, after the catch
      if something did, and on the way out if nothing caught it at all.

      Finally also runs on a return, a break and a continue. Any way of leaving
      the block, not only the exceptional one.

      And the catch binding is block scoped, and optional. A catch with no
      parentheses at all is legal when you do not need the value.

      The only things that skip a finally are the ones that stop the program:
      an explicit process exit, a hard crash, or a loop inside the try that
      never ends.`,
  },
  {
    title: 'What finally can and cannot change',
    heading: 'The return value finally replaces',
    script: `This is the trap, and it comes in two halves that look the same and
      are not.

      In the first, the try returns a variable and the finally reassigns that
      variable. The function returns the original value. The return expression
      was evaluated before the finally ran, and the result was held as the
      pending completion, so assigning to the variable afterwards reaches
      nothing.

      In the second, the try returns a string and the finally returns a
      different one. Now the finally wins.

      The rule underneath is that finally cannot edit a pending completion, only
      replace it with a completion of its own. Assigning to a variable is not a
      completion. A return, a throw, a break or a continue is, and it wins.

      That last part is why a return inside a finally is worth treating as a bug
      on sight. It silently swallows every exception passing through, and the
      failure turns into a normal looking value somewhere the reader has no
      reason to look.`,
  },
  {
    title: 'Catch what you expected, rethrow the rest',
    heading: 'Catching narrowly',
    script: `A catch catches everything, which is almost never what you meant. The
      useful shape is to handle the failure you expected and rethrow the rest.
      Check the type of the error, recover from the one case you have an answer
      for, and throw the error again otherwise.

      The wide version, catch and return null, turns a typo in your own handler
      into an empty result. The bug is now a missing value two layers away with
      nothing in the log, and the code that was supposed to make failures safe
      is what hid this one.

      Logging is not handling either. Log the error and return null, and the
      caller still cannot tell the difference between no data and broken data,
      and now there is a line in a log nobody reads.

      Catch it if you can do something about it. Let it go past if you cannot.`,
  },
  {
    title: 'Cleanup that does not overwrite the cause',
    heading: 'Cleanup that does not lie',
    script: `Finally earns its place on cleanup. A lock to release, a connection to
      close, a spinner to stop.

      The thing to be careful about is that the cleanup can fail too, and a
      throw from a finally replaces the exception already in flight, the same
      way a return does. A query that failed for a real reason gets reported as
      a release failure, and the cause is gone.

      So wrap the cleanup in its own try and catch, inside the finally. Record
      the cleanup failure as a warning and let the original error continue
      outward.

      That is worth recognising in production, because it makes every failure
      look identical. The connection died, so the query threw, and releasing a
      dead connection threw as well. You end up reading the second failure of
      every pair.

      Cleanup should be quiet. Do the work, record its own problems, never
      overwrite somebody else's.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked for the order of execution, say it as a sequence. The try body
      until it either finishes or throws. Then the catch, only if it threw. Then
      the finally, either way. Then the function leaves with whatever completion
      was pending, unless the finally supplied one of its own.

      Asked whether finally runs when the try returns, the answer is yes, and
      the interesting part is why it matters. The return value is evaluated
      first and held, then the finally runs, then the function returns. So a
      finally can replace the value by returning, and cannot change it by
      assigning to the variable it came from.

      Expect follow ups on what happens to the frames in between, on whether you
      can throw something that is not an Error, and on where in a request
      handler a catch actually belongs. On that last one, the answer worth
      giving is that a catch belongs where a decision can be made: a narrow one
      deep down for a failure you expected, one boundary at the edge for
      everything else, and nothing in between.`,
  },
]
