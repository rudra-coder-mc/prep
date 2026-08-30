import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Two reasons to learn this, and they pull in opposite directions.

      The first is that implement curry is a standard interview question, and
      honestly a good one. Answering it needs closures, rest and spread,
      recursion, and the function length property, all at the same time. Get it
      right and you have proved four topics in one go.

      The second is that the thing you will actually use most days is the simpler
      half of it. Fixing one argument now and supplying the rest later. Every
      bind call, every factory that hands back a logger already set to a level,
      every click handler built for one row of a table. That is all the same
      technique.

      Knowing which of the two names describes which thing is most of the
      interview answer.`,
  },
  {
    title: 'Two different things',
    heading: 'Two different things',
    script: `These two words get used as if they mean the same thing, and they do
      not.

      Partial application fixes some of a function's arguments and gives you back
      a function that takes the rest. It happens once, in a single step. Take a
      function of three arguments, fix one, and you have a function of two.

      Currying is a change of shape. It rewrites a function of three arguments as
      three separate functions of one argument each, so instead of calling it
      with three things you call it three times. Every step in that chain takes
      exactly one argument.

      So partial application is about supplying arguments early. Currying is
      about the shape of the function.

      One more thing to know about. Most JavaScript libraries ship something they
      call curry that will accept arguments in any grouping, so two at a time
      then one works fine. That is a hybrid, and it is much closer to automatic
      partial application than to real currying. Saying so out loud in an
      interview is a good sign, because it means you learned the difference
      rather than one word for both.`,
  },
  {
    title: 'Currying by hand',
    heading: 'Currying by hand',
    script: `The hand-written version is nothing but nested functions.

      A function that takes the first argument and returns a function that takes
      the second, which returns a function that takes the third, which finally
      does the work. Each arrow in that chain is a closure, holding one argument
      and waiting.

      Follow it through and only the last call does anything. The earlier ones
      just build scopes. That is why the intermediate functions are useful: each
      one is a value you can keep and call as often as you like.

      And reusing one does not accumulate anything. If you hold on to the step
      that has the first argument and call it twice with different second
      arguments, both calls start again from that same first argument and neither
      knows about the other.`,
  },
  {
    title: 'A curry that counts',
    heading: 'A curry that counts',
    script: `The general version cannot use nested arrows, because it has no idea
      how many arguments the function takes. So it asks the function.

      The implementation is three lines of idea. Return a function that gathers
      arguments. If it now has at least as many as the function's length
      property, call through. Otherwise return another gatherer that remembers
      what it has and waits for the rest.

      The function length property is the whole mechanism. Collect until there
      are enough, then call.

      And every intermediate step holds its own copy of what has been collected
      so far, which is why two partials taken from the same point stay
      independent of each other. The implementation spreads the collected
      arguments into a new call rather than pushing into them. If it pushed, a
      reusable partial would quietly turn into a one-shot one.`,
  },
  {
    title: 'bind is partial application',
    heading: '`bind` is partial application',
    script: `The language already has partial application built in, and it is the
      method everyone thinks of as being about this.

      Bind takes a this value, and then any number of arguments to fix from the
      left. Fix a log level and you have a warn function. Bind that again to fix
      a scope and you have a warn function for one part of the system. Both of
      those are partial application, no library required.

      Three details are worth carrying into an interview. The bound function's
      length is the original minus however many arguments were fixed. Its name is
      the original with the word bound in front of it. And bind returns a brand
      new function object every single time you call it.

      That last one is the practical one. Binding inside a render, or inside a
      loop, creates a new identity on every pass. Nothing can match it against
      the previous one. It is the same event listener bug from the last topic,
      wearing a different hat.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked to implement curry, narrate the mechanism rather than typing in
      silence. Return a function that gathers arguments. If it has enough, call
      through. If not, return another gatherer that remembers what it has so far.

      Then volunteer the limitation before anybody asks for it, because that is
      what separates a memorised answer from an understood one.

      All of this rests on the function's length property, and that property
      stops counting at the first parameter with a default and at any rest
      parameter. So a variadic function cannot be curried this way at all, there
      is no argument count at which it is finished. And a function with a default
      in the middle of its list reports a length that will make curry fire early,
      calling the real function before all the arguments have arrived.

      The fix is to accept an arity as a second parameter, defaulting to the
      function's length. One extra parameter, and that entire class of problem goes
      away.`,
  },
  {
    title: 'Traps',
    heading: 'Traps',
    script: `Five things that go wrong here.

      The length property lies more often than people expect. Defaults and rest
      parameters stop the count.

      Variadic functions cannot be curried by arity at all, because there is no
      number of arguments at which they are complete.

      Currying drops this. The nested functions are called plainly, so a curried
      method loses its receiver unless you bind first or forward it deliberately.

      A call with no arguments is not progress. A naive implementation hands back
      another gatherer, and the chain can go on forever.

      And deep chains are miserable to debug. A stack trace through five
      anonymous gatherers tells you nothing about which call site was wrong. Two
      levels reads well. Five does not.`,
  },
]
