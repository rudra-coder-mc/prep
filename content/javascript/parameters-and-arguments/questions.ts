import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'parameter-against-argument',
    type: 'concept',
    difficulty: 'easy',
    prompt:
      'What is the difference between a parameter and an argument, and what happens when the two counts do not match?',
    expectedAnswer: `Parameters are the names in the declaration. Arguments are the values at the call site. They are matched by position, and nothing checks that there are the same number of them.

What happens when they differ:
- Fewer arguments than parameters: the leftover parameters are undefined, and any defaults they declare are applied.
- More arguments than parameters: the extras are still evaluated and still land in the arguments object, they just have no name bound to them.

There is no arity error in JavaScript, which is why a callback written for one argument can be handed three without anything complaining.`,
    explanation: `The reason this is worth saying precisely is that it explains a whole class of bug rather than one fact. A function passed to map, forEach, sort or an event listener receives whatever that caller decides to send, and it is the callback's job to ignore what it did not ask for. parseInt is the famous casualty because it happens to accept a second parameter.`,
    hints: ['Which of the two is written once, and which one exists per call?'],
    tags: ['functions', 'parameters'],
  },
  {
    id: 'default-and-null',
    type: 'output',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `function greet(name = 'world') {
  return 'hello ' + name
}

console.log(greet())
console.log(greet(undefined))
console.log(greet(null))`,
    expectedOutput: `hello world
hello world
hello null`,
    explanation: `A default fires on undefined and on nothing else. Calling with no argument and calling with an explicit undefined are the same thing to the language, so both take the default.

null is a value somebody chose to pass, so it is kept and concatenated. This is the difference between "no answer" and "the answer is nothing", and defaults only cover the first.`,
    hints: ['Which single value triggers a default?'],
    tags: ['functions', 'defaults'],
  },
  {
    id: 'map-parse-int',
    type: 'debugging',
    difficulty: 'medium',
    prompt:
      'This is meant to turn the strings into numbers. It returns [1, NaN, NaN]. Explain why, and give the fix you would actually ship.',
    code: `const parsed = ['1', '2', '3'].map(parseInt)`,
    expectedAnswer: `map calls its callback with three arguments: the element, the index and the array. parseInt accepts two, the string and a radix. So the index is being passed as the radix.

- parseInt('1', 0): a radix of 0 is treated as unspecified, so this parses as decimal and gives 1.
- parseInt('2', 1): radix 1 is out of range, so this gives NaN.
- parseInt('3', 2): base 2 has no digit 3, so this gives NaN.

The fix is to control the arity at the call site rather than to remember what parseInt does:

  ['1', '2', '3'].map((n) => parseInt(n, 10))

Number would also work here, since it takes one argument, but parseInt with an explicit radix says what is meant.`,
    explanation: `The general lesson is more useful than the specific one. Passing a named function straight into an array method only works when that function ignores everything after the first argument, and you usually cannot tell by looking. Wrapping it in an arrow is a one-line way of saying "this callback takes one argument", and it never surprises anyone.`,
    hints: [
      'How many arguments does map hand its callback?',
      'What is the second parameter of parseInt for?',
    ],
    tags: ['functions', 'parameters', 'arrays'],
  },
  {
    id: 'parameter-scope',
    type: 'output',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const value = 'outer'

function show(input = value) {
  const value = 'inner'
  return input
}

console.log(show())`,
    expectedOutput: 'outer',
    explanation: `A function with a default gets two scopes rather than one. The parameter list is evaluated in its own scope, which sits inside the enclosing scope and outside the body, so the default resolves value to the module level binding.

The body's const value is declared in the body scope, which does not exist yet when the default runs. It shadows the outer binding for the rest of the function, but the parameter already holds what it resolved to.`,
    hints: ['When is the default evaluated, relative to the body?'],
    tags: ['functions', 'defaults', 'scope'],
  },
  {
    id: 'arity-limiter',
    type: 'coding',
    difficulty: 'medium',
    prompt:
      'Write takes(n, fn), which returns a function that passes at most the first n arguments through to fn, so a function can be handed to map without picking up the index.',
    expectedAnswer: `function takes(n, fn) {
  return function (...args) {
    return fn.apply(this, args.slice(0, n))
  }
}

const toNumber = takes(1, parseInt)
console.log(['1', '2', '3'].map(toNumber)) // [1, 2, 3]`,
    explanation: `Rest collects whatever the caller sent, slice throws away what fn did not ask for, and apply spreads the rest back out as separate arguments. Forwarding this keeps the wrapper usable as a method.

This is lodash's ary, and it exists for exactly the map(parseInt) problem. In everyday code an arrow function does the same job more plainly, which is worth saying in the interview rather than pretending the helper is always the better answer.`,
    hints: [
      'How do you accept an unknown number of arguments and then pass only some of them on?',
      'What is the difference between calling fn(args) and fn.apply(this, args)?',
    ],
    tags: ['functions', 'parameters', 'rest'],
  },
  {
    id: 'shared-default-object',
    type: 'scenario',
    difficulty: 'hard',
    prompt:
      'A helper declares a default of items = EMPTY, where EMPTY is a const empty array at module level, and pushes into items. It works in tests, then a caller reports seeing data that belongs to a different caller. What is happening, and how would you fix it?',
    expectedAnswer: `A default expression is evaluated per call, but this one evaluates to the same array every time, because EMPTY is one object created once at module level. Every caller that omits items is handed that same array, and the first push makes it permanently non-empty for everyone.

The fix is a default that constructs:

  function collect(items = []) { ... }

That creates a new array on each call that needs one, so callers cannot see each other.

The deeper fix is that a function should not mutate an argument it did not create. Copy first, or return a new array, and the sharing stops being able to bite regardless of how the default is written.`,
    explanation: `The trap is that "defaults are evaluated per call" is true and still not enough. It is the expression that is re-evaluated, not the value it produces. items = [] builds a new array each time; items = EMPTY looks up the same one each time. The same reasoning applies to a default of options = CONFIG, which is a shared object handed to everybody.`,
    hints: ['What exactly is re-evaluated on each call?'],
    tags: ['functions', 'defaults', 'references'],
  },
  {
    id: 'positional-or-options',
    type: 'interview',
    difficulty: 'medium',
    prompt:
      'When would you take an options object instead of positional parameters, and what do you give up by doing it?',
    expectedAnswer: `Take positional parameters when there are two or three, they are all required, and their order is obvious from the name of the function. slice(text, start, end) needs nothing else.

Move to an options object when any of these are true:
- More than about three parameters, where a call site becomes unreadable.
- Several optional ones, so callers stop having to pass undefined to reach the last.
- Boolean flags, since render(true, false) tells the reader nothing.
- The signature is expected to grow, because adding a key is not a breaking change and inserting a parameter is.

What it costs: the argument is now one object, so it can be mutated by the callee, it needs a default of = {} to survive being called with nothing, destructuring in the signature needs its own defaults, and fn.length no longer describes the function. You also lose the ordering that made a wrong argument obvious at a glance.`,
    explanation: `The answer interviewers are listening for is the trade, not a rule. The useful signal is "will this signature grow", because that is what makes the difference permanent: positional parameters are an ordering you can never change, and an options object is a set of names you can add to.`,
    hints: [],
    tags: ['functions', 'parameters', 'design'],
  },
  {
    id: 'arrow-arguments',
    type: 'output',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `function outer() {
  const inner = () => arguments[0]
  return inner('b')
}

console.log(outer('a'))`,
    expectedOutput: 'a',
    explanation: `An arrow function has no arguments object of its own. The name is resolved the way any other free variable is, by walking outward, so it finds outer's arguments object and reads the argument outer was called with.

Calling inner with 'b' does nothing to that, because inner never binds arguments. Turn inner into a regular function and it prints b instead.`,
    hints: ['Which of these two functions has an arguments object?'],
    tags: ['functions', 'arrow-functions', 'arguments'],
  },
  {
    id: 'function-length-mcq',
    type: 'mcq',
    difficulty: 'medium',
    prompt: 'What is the value of countArgs.length here?',
    code: `function countArgs(a, b = 2, c) {}`,
    options: ['1', '3', '2', '0'],
    correctOption: 0,
    explanation:
      'length counts the parameters before the first one with a default, and stops there. It does not resume after it, so c is not counted either, and a rest parameter is never counted. Express reads this number to decide whether a middleware is an error handler, and curry implementations read it to know how many arguments are still outstanding.',
    hints: [],
    tags: ['functions', 'parameters'],
  },
  {
    id: 'default-trigger-mcq',
    type: 'mcq',
    difficulty: 'easy',
    prompt: 'Which of these calls uses the default in function f(x = 10)?',
    options: ['f(null)', 'f(undefined)', 'f(0)', "f('')"],
    correctOption: 1,
    explanation:
      'Only undefined triggers a default, and an omitted argument is undefined, so f() and f(undefined) behave identically. null, 0 and the empty string are all falsy, which tempts people into expecting a default, but they are values a caller chose to send and the language keeps them.',
    hints: [],
    tags: ['functions', 'defaults'],
  },
  {
    id: 'rest-against-arguments-mcq',
    type: 'mcq',
    difficulty: 'medium',
    prompt: 'Which statement about rest parameters and the arguments object is true?',
    options: [
      'arguments is a real array, and a rest parameter is array-like',
      'A rest parameter is a real array, and it holds only the arguments no named parameter took',
      'They are two names for the same object, so changing one changes the other',
      'A rest parameter can appear anywhere in the list as long as it is the only one',
    ],
    correctOption: 1,
    explanation:
      'Rest gives you an ordinary array, inheriting from Array.prototype, containing the leftovers after the named parameters. arguments is array-like, has no array methods, holds every argument including the named ones, and does not exist in arrow functions. A rest parameter must be last, because by definition nothing can follow the leftovers.',
    hints: [],
    tags: ['functions', 'rest', 'arguments'],
  },
]
