import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Nothing in JavaScript checks that a call matches the function it
      lands in. Declare four parameters and pass two, and it runs. Pass six, and
      it runs.

      Every bug at the boundary between two pieces of code lives in that gap. A
      value that arrived undefined and quietly took a default. A callback
      written for one argument that was handed three. An options object that the
      function decided to modify on its way past.

      Interviewers like this topic because one line settles it. Take the strings
      one, two and three, and map them through parseInt. You do not get one, two
      and three back. Explaining why means explaining exactly how a call is
      wired, and that is what this topic is.`,
  },
  {
    title: 'Parameters against arguments',
    heading: 'Parameters against arguments',
    script: `Two words that get used interchangeably, and are not the same thing.

      Parameters are the names in the declaration. You write them once. Arguments
      are the values at the call site, and there is a fresh set of them every
      time the function runs.

      They meet by position, and the language is perfectly happy when the two
      lists are different lengths. A parameter with no argument opposite it holds
      undefined. An argument with no parameter opposite it is still evaluated,
      still handed to the function, and has no name bound to it.

      There is no arity error in JavaScript. Not a warning, not a runtime check,
      nothing. Which is why a function you wrote to take one thing breaks the day
      an array method starts handing it three, and nothing tells you.`,
  },
  {
    title: 'Defaults are expressions',
    heading: 'Defaults are expressions',
    script: `A default is not a constant sitting in the signature. It is an
      expression, and it is evaluated at call time, and only when the argument
      for it is undefined.

      Two things follow from that. The first is that null does not trigger a
      default. Null is a value somebody chose to pass, so it is kept. Defaults
      cover the case of no answer, not the case where the answer is nothing.

      The second is about what gets re-evaluated. A default that builds an empty
      array builds a new one on every call, which is what makes it safe. A
      default that names a shared constant looks up the same object on every
      call, and hands every caller the same one. That distinction is a real bug
      in real code.

      One more piece. A later parameter can read an earlier one, because the
      list is evaluated left to right. And the parameter list is its own scope,
      sitting between the world outside and the function body. So a default can
      see the parameters before it, and it can see everything outside the
      function, but it cannot see anything the body declares.`,
  },
  {
    title: 'Rest, spread and arguments',
    heading: 'Rest, spread and `arguments`',
    script: `Three dots, two directions.

      In a declaration, three dots before the last parameter make it a rest
      parameter, and it collects everything left over into a real array. It has
      to be last, because leftovers are by definition the end of the list, and
      there can only be one.

      At a call site, the same three dots do the opposite. They take an array
      apart into separate arguments. Same syntax, mirror image, and which one you
      are looking at depends entirely on whether you are reading a declaration or
      a call.

      Then there is the arguments object, which predates both of those. Every
      function that is not an arrow function gets one for free. It holds every
      argument the call passed, including the ones that already have parameter
      names. But it is array-like, not an array. It has a length and it has
      indices, and it has none of the array methods, so mapping over it or
      joining it fails.

      Prefer rest in anything you write today. Keep two facts about arguments for
      the interview, though. An arrow function does not have one of its own, so
      the name inside an arrow resolves to the enclosing function's. And in
      sloppy mode the arguments object and the named parameters share storage, so
      assigning to one changes the other. Strict mode switches that off, and so
      does any function that uses defaults or rest.`,
  },
  {
    title: 'What length counts',
    heading: 'What `length` counts',
    script: `Every function has a length property, and it does not mean what most
      people guess.

      It is the number of parameters before the first one that has a default,
      and before any rest parameter. It stops at the first default and does not
      resume. So a function of three parameters where the second has a default
      reports a length of one.

      This sounds like trivia until you meet code that reads it. Express decides
      whether a piece of middleware is an error handler by counting its
      parameters. Curry implementations use it to know how many arguments they
      are still waiting for. Anything that inspects a function you handed it is
      reading this number, which means adding a parameter can change behaviour
      somewhere you were not looking.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `The question is almost always the parseInt one, and the answer has
      two halves.

      The first half is the mechanism. Map calls its callback with three
      arguments, not one: the element, the index, and the array. ParseInt accepts
      two, the string and a radix. So the index is arriving as the radix. Index
      zero means unspecified, so that one parses as decimal and works. Index one
      is not a valid radix at all, so that gives not-a-number. And the string
      three in base two has no valid digits, so that gives not-a-number as well.

      The second half is the part that shows judgement, and it is the half people
      leave out. The fix is not to memorise what parseInt does. The fix is that
      any function you pass as a callback should be one whose arity you control.
      Wrap it in an arrow that takes one argument and passes the radix
      explicitly. It says what it means, and nothing can surprise it later.`,
  },
  {
    title: 'Traps',
    heading: 'Traps',
    script: `Five that catch people, in rough order of how often.

      Only undefined triggers a default. Null, zero, the empty string and
      not-a-number are all falsy, and all kept.

      A destructured parameter with no default throws. If the signature pulls an
      id out of an object and the function is called with nothing, you are
      reading a property of undefined. Give the whole parameter a default of an
      empty object.

      Arrow functions have no arguments object. Inside one, the name resolves
      outward to the enclosing function, or is a reference error at the top
      level.

      A default that constructs is per call. A default that names something is
      shared. Empty brackets give every caller a new array; a shared constant
      gives every caller the same one.

      And adding a parameter changes the function's length, so anything reading
      that number changes with it. That is how a piece of Express middleware
      silently becomes an error handler.`,
  },
]
