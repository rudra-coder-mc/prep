import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Almost every interface you touch in JavaScript takes a function. Map,
      filter and sort. Add event listener. Set timeout. Dot then. Express
      middleware. React hooks.

      Learning this language means learning to hand a step of work to somebody
      else and let them decide when to run it.

      The interview version is always the same request. Implement map. Or write
      once, or debounce, or a retry wrapper. None of those questions are really
      about the helper being asked for. They are asking whether you can look at
      two pieces of code that differ in exactly one step, and pull that step out
      into a parameter.`,
  },
  {
    title: 'A function is a value',
    heading: 'A function is a value',
    script: `There is no special category of function that is allowed to be passed
      around. Functions are objects. Assign one to a variable, put one in an
      array, hang one off a property, pass one into a call, return one from a
      call. They even carry properties of their own, like name and length.

      So the definition is small. A higher order function is any function that
      takes a function as an argument, or returns one, or both. That is all of
      it, and it means you have been writing them since your first event
      listener.

      One fact to hold on to, because it comes back later. Two functions that
      look identical are still two different objects. Write the same empty arrow
      function twice and compare them, and they are not equal. Nothing in the
      language treats two functions as the same because they have the same
      source. That is why removing an event listener fails when you hand it a
      fresh arrow function, and why a dependency array full of inline callbacks
      never settles down.`,
  },
  {
    title: 'Taking a function',
    heading: 'Taking a function',
    script: `When you pass a callback, you give up three things. When it runs.
      What arguments it gets. And what this is. The caller decides all three, and
      it decides for its own reasons, not yours.

      You do keep one thing, and it is the useful one: the call stack. Your
      callback runs on top of the function that invoked it. So an error thrown
      inside the callback travels back out through the higher order function, and
      a try block wrapped around a forEach really does catch it.

      And because the callback is a function rather than a loop body, returning
      from it returns from the callback and nothing further. The loop carries on
      with the next element. Return behaves like continue, and there is no break
      at all.`,
  },
  {
    title: 'Reduce, one call at a time',
    heading: 'Taking a function',
    script: `Writing one of these yourself is the fastest way to see there is no
      magic in it, and reduce is the one worth writing, because its first
      argument is whatever the last call returned.

      Given no initial value, reduce takes the first element as the accumulator
      and starts from the second. That has a consequence people trip over: an
      array of one element returns that element without calling your function at
      all, and an empty array with no initial value throws.

      Given an initial value, none of that special casing happens, which is a
      good reason to pass one.

      One detail to get right if you are asked to implement it. Deciding whether
      an initial value was passed by testing it against undefined is wrong,
      because undefined is a perfectly good initial value. The real reduce counts
      its arguments instead. That is the parameters topic showing up again, and
      it is the difference between a helper that works and one that works for
      everybody.`,
  },
  {
    title: 'Returning a function',
    heading: 'Returning a function',
    script: `The other half of the pattern is a function that builds a function.
      The one you get back closes over the configuration it was built with, so it
      arrives already specialised.

      Think of a retry wrapper. It takes a function and a number of attempts, and
      returns a new function with the same signature that calls the original and
      tries again when it fails.

      The point is what each half does not know. Retry knows nothing about the
      work. The work knows nothing about retrying. That separation is the whole
      reason to write it this way, and it is what lets wrappers stack. A retried,
      logged, rate limited version of a function is three wrappers around it and
      not a single edit to the original.

      You will meet this shape under different names. Express calls them
      middleware. React calls them higher order components. Other languages call
      them decorators. All the same thing: a function that takes a function and
      hands back a modified one.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked why higher order functions matter, the weak answer is that they
      make code reusable. That is true of every abstraction ever invented, so it
      tells the interviewer nothing.

      The answer that lands names the mechanism. They let the varying part of an
      algorithm be an argument. Once the step is a parameter, one implementation
      covers every case that differs only by that step, and the wrapper and the
      work stop knowing about each other.

      Then be ready for the follow up, because it is almost always a request to
      implement one. Map, filter and reduce by hand cover most of it. Say out
      loud that the callback receives the element, the index and the array, not
      just the element. That is the detail candidates leave out, and it is the
      one that connects straight to the parseInt problem.`,
  },
  {
    title: 'Traps',
    heading: 'Traps',
    script: `Five to look out for.

      Returning from a forEach callback skips one element rather than stopping.
      If you need to stop early, use for of, or some, or find.

      ForEach ignores whatever the callback returns, and that includes a promise.
      An async callback starts the work and forEach walks straight on, so the
      loop finishes long before the work does. Either await inside a for of loop,
      or map to promises and await them all.

      Passing a method by name loses its receiver. Items dot map of object dot
      format calls format with no this attached.

      The callback gets more arguments than you asked for. That is the parseInt
      problem, and it applies to any named function you pass straight through.

      And a function built fresh on every call has a new identity every time.
      Anything that compares functions, removing an event listener, a cache key,
      a dependency array, sees something different each time and behaves as
      though nothing was ever registered.`,
  },
]
