import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'curry-against-partial',
    type: 'concept',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What is the difference between currying and partial application?',
    answerInFull: `Partial application fixes some of a function's arguments and returns a function that takes the remaining ones. It happens in a single step, and the new function's arity is the old one minus however many were supplied.

Currying rewrites a function of n arguments as a chain of n functions, each taking exactly one argument, so f(a, b, c) becomes f(a)(b)(c). Every step in the chain has an arity of one.

So partial application is about supplying arguments early; currying is about the shape of the function. bind is partial application built into the language.

Worth adding: most JavaScript libraries ship a curry that also accepts several arguments at a time, so curried(1, 2)(3) works. That is a hybrid and is closer to automatic partial application than to strict currying.`,
    explanation: `Interviewers ask this because the two words are used interchangeably in blog posts and are not interchangeable. The candidate who names bind as partial application usually understands the distinction, because it shows they are thinking about what happens to the arity rather than about the syntax of the call.`,
    hints: ['How many arguments does each step accept in each case?'],
    tags: ['functions', 'currying'],
  },
  {
    id: 'nested-arrows-output',
    type: 'output',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `const add = (a) => (b) => a + b

const add5 = add(5)

console.log(add5(3))
console.log(add5(10))
console.log(add(1)(2))
console.log(typeof add(1))`,
    answerInFull: `8
15
3
function`,
    explanation: `add(5) runs the outer function and returns the inner one, which closes over a as 5. That returned function is an ordinary value, so it can be stored and called as many times as you like.

The two calls to add5 are independent. Nothing accumulates between them, because each call creates a fresh invocation of the inner function over the same captured a.

add(1) is the same thing without the variable, so its type is function, and only the second call produces a number.`,
    hints: ['What does the outer function return, and what has it not done yet?'],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'curry-default-parameter',
    type: 'debugging',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'This throws "curried(...) is not a function" on the second call. The curry implementation is the standard one. Explain what went wrong and how you would fix it.',
    code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args)
    return (...rest) => curried(...args, ...rest)
  }
}

const volume = (length, width = 1, height) => length * width * height
const curried = curry(volume)

console.log(curried(2)(3)(4))`,
    answerInFull: `curry decides it has enough arguments by comparing against fn.length, and fn.length stops counting at the first parameter with a default. volume declares three parameters but width has a default, so volume.length is 1, not 3.

So curried(2) already satisfies the check and calls volume(2) immediately. That returns 2 * 1 * undefined, which is NaN, and the next call in the chain tries to invoke NaN as a function.

Fixes, in order of preference:
- Remove the default and handle it inside the body, so the arity is honest.
- Pass the arity explicitly: curry(volume, 3), and compare against that instead of fn.length.
- Move the defaulted parameter to the end, which at least makes the reported length match the required arguments.

The general rule is that any curry driven by fn.length inherits every way that number can lie.`,
    explanation: `This is the follow-up to "implement curry", and it is the part that distinguishes a memorised implementation from an understood one. The same reasoning kills currying for variadic functions: there is no argument count at which Math.max is finished, so arity can never tell you when to call through.`,
    hints: ['What is volume.length here?', 'Which parameters does length stop counting at?'],
    tags: ['functions', 'currying', 'parameters'],
  },
  {
    id: 'implement-curry',
    type: 'coding',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'Implement curry(fn) so that curried(1)(2)(3), curried(1, 2)(3) and curried(1, 2, 3) all call fn with the same three arguments.',
    answerInFull: `function curry(fn, arity = fn.length) {
  return function curried(...args) {
    if (args.length >= arity) return fn.apply(this, args)

    // A call that supplies nothing is not progress, so refuse it rather than
    // handing back another gatherer forever.
    if (args.length === 0) throw new TypeError('curried function needs at least one argument')

    return curry(fn.bind(this, ...args), arity - args.length)
  }
}`,
    explanation: `The core is three lines: gather arguments, compare against the arity, and either call through or return something that remembers what has been gathered.

Four things make it a strong answer rather than a passable one.

Taking arity as a parameter defaulting to fn.length, so a variadic function or one with a default parameter can still be curried by being told its arity.

Forwarding this with apply, so a curried method still works.

Rejecting a zero-argument call, because otherwise curried() returns another gatherer and the chain can never end.

Being explicit that each partial is independent: reusing the same intermediate function twice must not let the two calls see each other's arguments.

The bind-based recursion above is one way to get that independence for free. The commonly written alternative closes over a copy of args, which is equally correct as long as it never mutates that array.`,
    hints: [
      'What decides that enough arguments have arrived?',
      'What should happen when the curried function is called with no arguments at all?',
      'Does a curried method still see the right this?',
    ],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'bind-output',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `function greet(greeting, name) {
  return greeting + ', ' + name
}

const hi = greet.bind(null, 'hi')

console.log(hi('ada'))
console.log(hi.length)
console.log(hi.name)
console.log(greet.bind(null) === greet.bind(null))`,
    answerInFull: `hi, ada
1
bound greet
false`,
    explanation: `bind is partial application with a this value attached. Fixing one of the two parameters leaves a function of one, so its length is 1, and the bound function's name is the original prefixed with "bound ".

The last line is the one that matters in practice. bind returns a brand new function object on every call, so two binds of the same function with the same arguments are never equal. Binding inside a loop, a render, or an event registration therefore creates a fresh identity each time, which is why the matching removeEventListener never finds anything.`,
    hints: ['What does bind do to the arity, and what does it return each time?'],
    tags: ['functions', 'bind', 'references'],
  },
  {
    id: 'handler-per-row',
    type: 'scenario',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'A table of a few thousand rows builds a click handler per row with handleClick.bind(null, row.id). Memory grows and every re-render churns listeners. How would you approach it?',
    answerInFull: `Every bind allocates a new function object holding the bound arguments, so a few thousand rows means a few thousand functions, and every re-render allocates a fresh set with new identities. Nothing can match the old ones, so listeners are removed and re-added, or never removed at all.

The approach in order:

- Use one listener on the table and read the id from the event target, usually from a data attribute. Event delegation replaces N functions with 1, and it keeps working as rows are added and removed.
- If a handler per row is genuinely needed, create it once per row and keep it, rather than rebuilding it on each pass.
- Check whether the id needs to be baked into the function at all. Most of the time it can be read from the DOM or from the element the event fired on.

Measure before restructuring. A few thousand small closures is not automatically a problem, and the churn is usually the real cost rather than the allocation.`,
    explanation: `The point of the question is that partial application is not free. It creates an object, and doing it per item per render multiplies that by two dimensions. Delegation is the standard answer because it removes the per-item function entirely rather than making it cheaper, and it is a good demonstration of solving the problem one level up instead of optimising the wrong thing.`,
    hints: ['How many function objects does one render create here?'],
    tags: ['functions', 'bind', 'performance'],
  },
  {
    id: 'when-to-curry',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt: 'When is currying actually worth using in a JavaScript codebase?',
    answerInFull: `The honest answer is that full currying is rarely the right tool in JavaScript, and partial application often is.

Where it pays:
- A configuration argument that every call site repeats. A logger fixed to a level and a scope, a fetch wrapper fixed to a base URL.
- Building small specialised functions for a pipeline, where each step takes one value.
- Codebases already written in that style, where consistency is worth more than any individual call site.

Where it does not:
- Anything variadic, or with optional parameters, because the arity is not knowable.
- Deep chains, where the stack trace names five anonymous functions and none of them is the call site that was wrong.
- Cases where an arrow function is shorter and clearer. (x) => format(x, 10) is not a worse answer than a curried format.

JavaScript is not a language where currying is the default, because functions here are variadic by nature and arity is a suggestion. It is a technique to reach for deliberately rather than a style to adopt everywhere.`,
    explanation: `Interviewers ask this to find out whether you know the trade or only the trick. Saying plainly that you would usually write an arrow function instead reads as confidence rather than ignorance, provided you can also implement curry when asked. Knowing a technique and choosing not to use it is the distinction they are testing.`,
    hints: [],
    tags: ['functions', 'currying', 'design'],
  },
  {
    id: 'partials-are-independent',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn(...args)
      : (...rest) => curried(...args, ...rest)
  }
}

const join = curry((a, b, c) => [a, b, c].join('-'))
const start = join('x')

console.log(start('y', 'z'))
console.log(start('1', '2'))`,
    answerInFull: `x-y-z
x-1-2`,
    explanation: `start is a function closing over args, which holds exactly ['x']. Calling it does not modify that array, it spreads it into a new call, so every use of start begins again from the same one argument.

This is what makes a partial reusable rather than single-use. If the implementation had pushed into args instead of spreading it, the second line would print x-y-z-1-2 and the function would be a trap. Spreading rather than mutating is the detail that makes it safe.`,
    hints: ['Does calling start change anything that start is holding?'],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'which-is-partial-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these is partial application rather than currying?',
    options: [
      'const g = (a) => (b) => (c) => f(a, b, c)',
      'const g = f.bind(null, 1)',
      'const g = curry(f)',
      'const g = (...args) => f(...args)',
    ],
    correctOption: 1,
    answerInFull:
      'bind fixes some arguments in one step and returns a function taking the rest, which is the definition of partial application. The nested arrows and curry both produce a chain of single-argument steps, and the last option fixes nothing at all: it is a pass-through wrapper with the same arity as f.',
    hints: [],
    tags: ['functions', 'currying', 'bind'],
  },
  {
    id: 'bound-length-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Given function f(a, b, c) {}, what is f.bind(null, 1, 2).length?',
    options: ['3', '2', '0', '1'],
    correctOption: 3,
    answerInFull:
      'A bound function reports the original arity minus the number of arguments that were fixed, so three minus two is one. It never goes below zero, so binding more arguments than the function declares still reports 0. This is what lets a curry implementation keep working across a bind, since the arity it reads goes down as arguments are supplied.',
    hints: [],
    tags: ['functions', 'bind', 'parameters'],
  },
  {
    id: 'curry-arity-source-mcq',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'How does a typical curry implementation know it has collected enough arguments?',
    options: [
      'It compares how many it has collected against fn.length',
      'It calls fn and retries if the result is undefined',
      'It counts the parameters by parsing fn.toString()',
      'It waits for a call with no arguments to signal the end',
    ],
    correctOption: 0,
    answerInFull:
      'fn.length is the whole mechanism, which is also the whole limitation: it stops counting at the first default or rest parameter, so a variadic or partly optional function reports a number that makes curry fire early. That is why serious implementations accept an explicit arity as a second parameter. Parsing toString does exist in the wild and breaks on minified code, and calling to see what happens would run side effects.',
    hints: [],
    tags: ['functions', 'currying', 'parameters'],
  },
]
