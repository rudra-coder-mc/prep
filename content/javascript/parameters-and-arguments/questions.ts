import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'parameter-against-argument',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'A function declares three parameters and is called with four arguments. What happens?',
    options: [
      'A TypeError, since the call does not match the signature',
      'The fourth argument is evaluated and bound to no name, and the call runs normally',
      'The fourth argument is never evaluated, since there is no parameter to receive it',
      'The fourth argument is collected into the last parameter, which becomes an array',
    ],
    correctOption: 1,
    answerInFull: `Parameters are the names in the declaration. Arguments are the values at the call site. They are matched by position, and nothing checks that there are the same number of them.

What happens when they differ:
- Fewer arguments than parameters: the leftover parameters are undefined, and any defaults they declare are applied.
- More arguments than parameters: the extras are still evaluated and still land in the arguments object, they just have no name bound to them.

There is no arity error in JavaScript, which is why a callback written for one argument can be handed three without anything complaining.`,
    explanation: `A TypeError is what a language with arity checking would do, and its absence is the whole topic. Nothing compares the two counts, at the call or anywhere else.

Not evaluating the extra argument is the more interesting wrong answer, because it would be reasonable: why compute a value nobody can name? Arguments are all evaluated, left to right, before control enters the function, so f(a, b, log('here')) prints even when f declares two parameters.

Collecting the extras is what a rest parameter does, and only when one is declared. Without ...rest they land in the arguments object and nowhere else.

This is worth being precise about because it explains a class of bug rather than one fact. A function passed to map, forEach, sort or an event listener receives whatever that caller decides to send, and it is the callback's job to ignore what it did not ask for.`,
    hints: ['Which of the two is written once, and which one exists per call?'],
    tags: ['functions', 'parameters'],
  },
  {
    id: 'default-evaluation-order',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function trace(label) {
  console.log('evaluating ' + label)
  return label
}

function build(a = trace('a'), b = trace('b')) {
  console.log('body: ' + a + ' ' + b)
}

build(trace('argument'))
console.log('done')`,
    items: [
      'evaluating a',
      'evaluating argument',
      'body: a b',
      'evaluating b',
      'body: argument b',
      'done',
    ],
    correctOrder: [1, 3, 4, 5],
    answerInFull: `evaluating argument, evaluating b, body: argument b, done

Three rules, in the order they apply.

Arguments are evaluated before the call, left to right, so trace('argument') runs first and its return value is what arrives at the function.

Then the parameter list is evaluated, also left to right, and a default runs only for a parameter whose argument is undefined. a has one, so its default never runs and "evaluating a" is never printed. b has none, so trace('b') runs at that moment, which is call time rather than definition time.

Only then does the body run, with a holding 'argument' and b holding 'b'.

The sentence to take away: a default is an expression evaluated per call, and it is skipped entirely when an argument was supplied.`,
    explanation: `"evaluating a" is the line for anyone who reads a default as always being evaluated, with the argument overwriting it afterwards. That would make a default that fetches, logs or throws run on every call, which is exactly the behaviour defaults are useful for not having.

"body: a b" is the same misreading taken to its conclusion, where the default wins over the argument. Nothing overwrites a supplied argument.

Nothing here prints at definition time. Moving the two functions above or below each other changes nothing, because a default is stored as an expression and evaluated when the call needs it.`,
    hints: ['Which of the two defaults has an argument opposite it?'],
    tags: ['functions', 'defaults', 'parameters'],
  },
  {
    id: 'map-parse-int',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'This is meant to turn the strings into numbers. It returns [1, NaN, NaN]. Why?',
    code: `const parsed = ['1', '2', '3'].map(parseInt)`,
    options: [
      'parseInt stops at the first character it cannot read, and only the first string is clean',
      'map passes the index as parseInt second argument, which parseInt reads as the radix',
      'parseInt needs a radix and returns NaN without one, except when the string is a single digit',
      'map passes the array as a third argument, and parseInt refuses a call with three arguments',
    ],
    correctOption: 1,
    answerInFull: `map calls its callback with three arguments: the element, the index and the array. parseInt accepts two, the string and a radix. So the index is being passed as the radix.

- parseInt('1', 0): a radix of 0 is treated as unspecified, so this parses as decimal and gives 1.
- parseInt('2', 1): radix 1 is out of range, so this gives NaN.
- parseInt('3', 2): base 2 has no digit 3, so this gives NaN.

The fix is to control the arity at the call site rather than to remember what parseInt does:

  ['1', '2', '3'].map((n) => parseInt(n, 10))

Number would also work here, since it takes one argument, but parseInt with an explicit radix says what is meant.

The general lesson is more useful than the specific one. Passing a named function straight into an array method only works when that function ignores everything after the first argument, and you usually cannot tell by looking.`,
    explanation: `parseInt really does stop at the first character it cannot read, which is why parseInt('12px') is 12. That fact is true, it is famous, and it explains nothing here: all three strings are single clean digits.

Needing a radix is a rule people half remember from a linter, which warns about the missing radix precisely because leaving it out is unpredictable. Left out entirely, parseInt guesses decimal and works.

The third argument is a real thing that is genuinely ignored. Nothing in JavaScript refuses a call for having too many arguments, which is the fact this whole topic rests on.`,
    hints: [
      'How many arguments does map hand its callback?',
      'What is the second parameter of parseInt for?',
    ],
    tags: ['functions', 'parameters', 'arrays'],
  },
  {
    id: 'parameter-scope',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const value = 'outer'

function show(input = value) {
  const value = 'inner'
  return input
}

console.log(show())`,
    options: [
      'inner',
      'undefined',
      'ReferenceError: Cannot access "value" before initialization',
      'outer',
    ],
    correctOption: 3,
    answerInFull: `outer

A function with a default gets two scopes rather than one. The parameter list is evaluated in its own scope, which sits inside the enclosing scope and outside the body, so the default resolves value to the module level binding.

The body's const value is declared in the body scope, which does not exist yet when the default runs. It shadows the outer binding for the rest of the function, but the parameter already holds what it resolved to.

The rule in one line: a default can see the parameters before it and everything outside the function, and nothing the body declares.`,
    explanation: `inner is the answer if the parameter list and the body are one scope, which is what they look like on the page and what they genuinely are in a function with no defaults. Declaring a default is what splits them.

undefined is that same reading with hoisting applied: the body's binding exists but is not assigned yet. const does not behave that way, and neither does var here, since the default is not in the body's scope at all.

The ReferenceError is the right answer to the neighbouring question. A default that reads a parameter declared after it does throw, because parameters are initialised left to right and the later one is still in its temporal dead zone.`,
    hints: ['When is the default evaluated, relative to the body?'],
    tags: ['functions', 'defaults', 'scope'],
  },
  {
    id: 'arity-limiter',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'You want takes(n, fn): a wrapper passing at most the first n arguments through to fn, so a function can go into map without picking up the index. Which one does that?',
    options: [
      'return (...args) => fn.apply(this, args.slice(0, n))',
      'return function (...args) { return fn.apply(this, args.slice(0, n)) }',
      'return function (...args) { return fn(args.slice(0, n)) }',
      'return function (a, b, c) { return fn(...[a, b, c].slice(0, n)) }',
    ],
    correctOption: 1,
    answerInFull: `  function takes(n, fn) {
    return function (...args) {
      return fn.apply(this, args.slice(0, n))
    }
  }

  const toNumber = takes(1, parseInt)
  console.log(['1', '2', '3'].map(toNumber)) // [1, 2, 3]

Rest collects whatever the caller sent, slice throws away what fn did not ask for, and apply spreads what is left back out as separate arguments. Forwarding this keeps the wrapper usable as a method.

This is lodash's ary, and it exists for exactly the map(parseInt) problem. In everyday code an arrow function does the same job more plainly, which is worth saying in an interview rather than pretending the helper is always the better answer.`,
    explanation: `The arrow version is the one to look at twice. It slices correctly and forwards the wrong this: an arrow has no this of its own, so it captures whatever surrounded takes, and the receiver the caller used is lost. Take a wrapped method off an object and it breaks.

fn(args.slice(0, n)) passes the array itself as a single argument, so parseInt receives ['1'] rather than '1'. This is the difference apply exists for, and writing fn(...args.slice(0, n)) is the modern way to say it.

The last one works for up to three arguments and silently drops the fourth. It also reports a length of 3 to anything that reads it, which is the sort of detail this topic exists to make you check.`,
    hints: [
      'How do you accept an unknown number of arguments and then pass only some of them on?',
      'What is the difference between calling fn(args) and fn.apply(this, args)?',
    ],
    tags: ['functions', 'parameters', 'rest'],
  },
  {
    id: 'shared-default-object',
    type: 'scenario',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A helper declares a default of items = EMPTY, where EMPTY is a const empty array at module level, and pushes into items. It works in tests, then a caller reports seeing data that belongs to a different caller. What is happening?',
    options: [
      'A default is evaluated once, when the function is defined, so every call after the first reuses that array',
      'const makes EMPTY immutable, so the push is silently ignored and the caller is seeing the previous argument',
      'A default expression is evaluated on every call, and this one resolves to the same module level array every time',
      'The array is copied into the parameter, so the sharing has to be coming from somewhere else in the helper',
    ],
    correctOption: 2,
    answerInFull: `A default expression is evaluated per call, but this one evaluates to the same array every time, because EMPTY is one object created once at module level. Every caller that omits items is handed that same array, and the first push makes it permanently non-empty for everyone.

The fix is a default that constructs:

  function collect(items = []) { ... }

That creates a new array on each call that needs one, so callers cannot see each other.

The deeper fix is that a function should not mutate an argument it did not create. Copy first, or return a new array, and the sharing stops being able to bite regardless of how the default is written.`,
    explanation: `Evaluating the default once at definition time is the near miss, and it is worth taking seriously because it predicts exactly the same symptom. It is still wrong, and the difference is the whole point: items = [] is also evaluated on every call, and it produces a new array each time. If defaults were evaluated once, that idiom would be just as broken as this one.

const stops the binding being reassigned and says nothing about the array's contents. push mutates the array the binding points at, which const has no opinion about.

Nothing is copied. A parameter holding an object holds a reference to the same object, which is the fact that makes a mutating callee dangerous at all.

The same reasoning applies to a default of options = CONFIG, which hands every caller the one shared object.`,
    hints: ['What exactly is re-evaluated on each call?'],
    tags: ['functions', 'defaults', 'references'],
  },
  {
    id: 'positional-or-options',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'When would you take an options object instead of positional parameters, and what do you give up by doing it?',
    answerInFull: `Take positional parameters when there are two or three, they are all required, and their order is obvious from the name of the function. slice(text, start, end) needs nothing else.

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
    form: 'choice',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `function outer() {
  const inner = () => arguments[0]
  return inner('b')
}

console.log(outer('a'))`,
    options: ['b', 'a', 'undefined', 'ReferenceError: arguments is not defined'],
    correctOption: 1,
    answerInFull: `a

An arrow function has no arguments object of its own. The name is resolved the way any other free variable is, by walking outward, so it finds outer's arguments object and reads the argument outer was called with.

Calling inner with 'b' does nothing to that, because inner never binds arguments at all. Turn inner into a regular function and it prints b instead.

This is the same rule that governs this, super and new.target in an arrow: none of them are bound, so all of them come from the enclosing function.`,
    explanation: `b is the answer if an arrow is read as an ordinary function with shorter syntax. The difference is not syntax: an arrow binds fewer things, and arguments is one of them.

undefined is the reading where the arrow has an arguments object of its own that nobody filled. There is no empty one to find.

The ReferenceError is what really happens for an arrow written at the top level of a module, where walking outward reaches no function at all. It is the right answer one line of context away from this one.`,
    hints: ['Which of these two functions has an arguments object?'],
    tags: ['functions', 'arrow-functions', 'arguments'],
  },
  {
    id: 'function-length-choice',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What is the value of countArgs.length here?',
    code: `function countArgs(a, b = 2, c) {}`,
    options: ['3', '1', '2', '0'],
    correctOption: 1,
    answerInFull: `1

length counts the parameters before the first one with a default and stops there. It does not resume afterwards, so c is not counted either, and a rest parameter is never counted.

It describes the declaration rather than anything about a call. Three things read it in practice: Express decides a middleware is an error handler when it declares four parameters, curry implementations use it to know how many arguments are still outstanding, and a bound function reports the original minus whatever bind fixed.

The consequence worth stating is that adding a parameter changes a number other code may be reading, which is how an ordinary middleware silently becomes an error handler.`,
    explanation: `3 is the parameter list as written, which is the answer if length is read as "how many parameters does this declare". It reports how many are required before anything optional appears.

2 is the most careful wrong answer: count a, skip the defaulted b, count c. The count stops at the first default rather than skipping over it.

0 is what a function whose very first parameter has a default reports, so it is the right answer to a question one character away from this one.`,
    hints: [],
    tags: ['functions', 'parameters'],
  },
  {
    id: 'default-trigger-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these calls uses the default in function f(x = 10)?',
    options: ['f(null)', 'f(undefined)', 'f(0)', "f('')"],
    correctOption: 1,
    answerInFull: `f(undefined).

Only undefined triggers a default, and an omitted argument is undefined, so f() and f(undefined) are the same call as far as the language is concerned.

null, 0 and the empty string are all falsy, which is what makes them tempting, but falsy is not the test. They are values a caller chose to send, and the language keeps them.

The distinction worth stating is between "no answer" and "the answer is nothing". A default covers the first only. If you want null to mean "use the default" as well, that is a decision you write in the body, and ?? is the operator for it, since || would swallow 0 and the empty string too.`,
    explanation: `f(null) is the one people pick, because null reads as absence. It is a value, it was passed on purpose, and defaults have nothing to say about it. It is also why a JSON payload with an explicit null defeats every default in the function that receives it.

f(0) and f('') are the falsy trap in its usual form. If a default fired on anything falsy, no function could accept 0 or an empty string as a legitimate argument.`,
    hints: [],
    tags: ['functions', 'defaults'],
  },
  {
    id: 'rest-against-arguments-choice',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Which statement about rest parameters and the arguments object is true?',
    options: [
      'arguments is a real array, and a rest parameter is array-like',
      'A rest parameter is a real array, and it holds only the arguments no named parameter took',
      'They are two names for the same object, so changing one changes the other',
      'A rest parameter can appear anywhere in the list as long as it is the only one',
    ],
    correctOption: 1,
    answerInFull: `A rest parameter is a real array holding only the arguments no named parameter took.

Rest gives you an ordinary array, inheriting from Array.prototype, so map, join and everything else work on it. It has to be last, because by definition nothing can follow the leftovers, and there can be only one.

arguments is array-like: it has length and indices and none of the array methods, it holds every argument including the ones a named parameter took, and it does not exist in an arrow function.

Prefer rest in anything written now. arguments still matters for reading older code and for one fact interviewers like: in sloppy mode arguments[0] and the first parameter are the same storage, so assigning to one changes the other. Strict mode, modules, and any function that uses defaults or rest all switch that aliasing off.`,
    explanation: `The first option is the two swapped, and it is the answer if the only thing you remember is that one of them is not a real array.

Calling them two names for one object is the sloppy mode aliasing, remembered wider than it is. That link is between a named parameter and its slot in arguments, not between the rest array and the object, and it is off in every modern file.

Rest anywhere in the list is tempting because the same three dots really can appear in the middle at a call site: f(...xs, last) is legal, and so is [...xs, last]. A declaration is the opposite case, since anything written after the leftovers would have nothing to bind to.`,
    hints: [],
    tags: ['functions', 'rest', 'arguments'],
  },
]
