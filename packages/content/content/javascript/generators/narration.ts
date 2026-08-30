import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `A generator is a function that can pause. Call it and nothing runs;
      you get an iterator back. Call next on that and the body runs to its
      first yield, hands out a value, and stops, keeping every local variable
      alive until the next call. That is the whole feature, and it is what
      lets you write an iterator as a loop instead of as a state machine.

      Interviewers ask about generators for two reasons. Implementing an
      iterable is a standard task, and the generator version is the one a
      senior engineer writes. And async await is a generator driven by a
      promise loop, so someone who understands yield understands where an
      await splits a function and why.`,
  },
  {
    title: 'Pausing and resuming',
    heading: 'Pausing and resuming',
    script: `Function with a star declares one. Yield pauses and sends a value
      out. The function's frame, its locals, its position in a loop, all of
      it stays in memory between calls, which is the thing a plain function
      cannot do.

      Follow the walkthrough. Calling the generator function runs none of
      its body; it returns a generator object. The first next runs from the
      top to the first yield and hands out one. The second next resumes just
      after that yield, goes round the loop, and hands out two. The loop is
      infinite and that is fine, because it only runs one step per call.

      The generator object has next, and it also has Symbol dot iterator
      returning itself, so it is an iterator and an iterable at once. That is
      why a generator drops straight into for of, spread and destructuring.
      And like every iterator it is one shot: a second loop over the same
      generator object finds it already finished. Call the function again
      for a fresh one.

      The range from the previous topic becomes a generator method with a
      star before its name and a single for loop that yields each number.
      Every call starts the loop over, so the state lives in the call by
      construction.`,
  },
  {
    title: 'Finishing',
    heading: 'Finishing',
    script: `A generator finishes when its body returns. The final next then
      gives the returned value with done set to true, and every next after
      that gives undefined and done.

      The return value is easy to misread. For of, spread and destructuring
      all stop the moment done is true and discard that step's value. So a
      return at the end of a generator is invisible to every built in
      consumer. It is only seen by code that calls next by hand, or by yield
      star, where it becomes the value of the delegation expression.`,
  },
  {
    title: 'Sending values in',
    heading: 'Sending values in',
    script: `Next takes an argument, and that argument becomes the value of the
      yield expression the generator is paused on. This turns a generator
      from a sequence into a conversation.

      Watch the second walkthrough carefully. The first next starts the body
      from the top. Nothing is paused at a yield yet, so its argument has
      nowhere to go and is dropped. The body runs to the first yield and
      stops. The second next resumes at that yield, and its argument becomes
      the value of the yield expression, so the variable on the left gets
      it. That off by one is the interview question: the first next primes
      the generator, and every value after that lands on the yield that was
      waiting for it.

      Two more methods complete the conversation. Throw resumes the
      generator by throwing at the paused yield, which the body can catch
      with an ordinary try catch. Return resumes as if a return statement
      had been written at the paused yield, which runs any finally blocks on
      the way out. That is what for of calls on a break, and it is how a
      generator gets to close a file it opened before its first yield.`,
  },
  {
    title: 'Delegating with yield star',
    heading: 'Delegating with `yield*`',
    script: `Yield star hands control to another iterable until it is exhausted,
      yielding each of its values as the outer generator's own. It is how
      generators compose. An in order tree traversal is four lines: delegate
      to the left subtree, yield the node's value, delegate to the right.
      Without it you would need an explicit stack.

      Yield star also forwards next with a value, throw and return through
      to the inner generator, so the conversation works across the
      delegation. And it evaluates to the inner generator's return value,
      which is the one place that value is useful.

      It works on any iterable, not only generators. Yield without the star
      yields the whole array as a single value.`,
  },
  {
    title: 'Where this goes',
    heading: 'Where this goes',
    script: `Generators are lazy. A pipeline of generator functions, take of
      filter of map of a source, pulls one value at a time and does only the
      work the consumer asked for. A source that is infinite, or expensive,
      or a stream, costs nothing until something reads it, and take three
      reads three.

      And async await is this machinery with one extra part. An async
      function is a generator that yields promises, driven by a loop that
      waits for each promise to settle and then calls next with the result.
      Every await is a yield. The pause, the kept alive locals, the
      resumption with a value, the throw into the paused point when a
      promise rejects. The event loop topic showed where each of those
      happens, and this is the mechanism underneath it.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what a generator is, say a function that returns an iterator
      over its own execution. Yield pauses and sends a value out, next
      resumes and can send one in, and locals survive the pause. Then write
      the range in three lines and say it is an iterable because every call
      starts the loop fresh.

      Asked why the first next discards its argument, say that nothing is
      paused at a yield yet. The argument is the value of the yield the
      generator is suspended on, and on the first call there is none.

      Asked how generators relate to async await, say async functions are
      generators driven by promises. Each await is a yield of a promise; the
      runner waits for it and resumes the function with the result, or
      throws the rejection into it.`,
  },
]
