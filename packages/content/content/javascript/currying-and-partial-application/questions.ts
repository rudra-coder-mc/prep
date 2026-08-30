import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'curry-against-partial',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What is the difference between currying and partial application?',
    options: [
      'Currying fixes some of the arguments now and takes the rest later, and partial application is the one that splits a function into single-argument steps',
      'Partial application fixes some arguments and returns a function taking the rest; currying rewrites a function of n arguments as n functions of one argument',
      'Partial application is the hand-written version, and currying is the same thing done for you by a helper such as bind',
      'They are two names for one technique, and which word is used depends on whether a library did it for you',
    ],
    correctOption: 1,
    answerInFull: `Partial application fixes some of a function's arguments and returns a function that takes the remaining ones. It happens in a single step, and the new function's arity is the old one minus however many were supplied.

Currying rewrites a function of n arguments as a chain of n functions, each taking exactly one argument, so f(a, b, c) becomes f(a)(b)(c). Every step in the chain has an arity of one.

So partial application is about supplying arguments early; currying is about the shape of the function. bind is partial application built into the language.

Worth adding: most JavaScript libraries ship a curry that also accepts several arguments at a time, so curried(1, 2)(3) works. That is a hybrid and is closer to automatic partial application than to strict currying.`,
    explanation: `The first option is the two definitions swapped, which is the most common way to get this wrong and most of the reason it is asked. Arity is the tell. Partial application lowers it by however many arguments you supplied, currying pins every step at one.

bind is partial application and it is built into the language, so filing it under currying is the same confusion wearing the language's own name. A library helper called curry is usually the hybrid, which is closer to partial application again.

The last option is the position most blog posts take by accident. The two words survive because the resulting functions have different shapes, and the candidate who names bind usually understands that, since it shows they are thinking about what happens to the arity rather than about the syntax of the call.`,
    hints: ['How many arguments does each step accept in each case?'],
    tags: ['functions', 'currying'],
  },
  {
    id: 'nested-arrows-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const add = (a) => (b) => a + b

const add5 = add(5)

console.log(add5(3), add5(10), add(1)(2), typeof add(1))`,
    options: [
      '8 18 3 function',
      'TypeError: add5 is not a function',
      '8 15 3 function',
      '8 15 3 number',
    ],
    correctOption: 2,
    answerInFull: `8 15 3 function

add(5) runs the outer function and returns the inner one, which closes over a as 5. That returned function is an ordinary value, so it can be stored, passed around and called as many times as you like.

The two calls to add5 are independent. Nothing accumulates between them, because each call is a fresh invocation of the inner function over the same captured a. That is what makes a partial reusable rather than single use.

add(1)(2) is the same thing without the variable, and typeof add(1) is function because only the last call in a chain reaches the body. In a chain of n arrows, the first n minus one calls do nothing but build scopes.`,
    explanation: `8 18 3 function is the accumulating answer. It reads add5 as something holding a running total rather than as a function over a fixed a, and if that were true no partial could be reused.

The TypeError is what you would predict from reading (a) => (b) => a + b as one function of two parameters. Then add(5) would already be 5 + undefined, which is NaN, and calling NaN would throw. Checking which arrow the body belongs to is half of this question.

8 15 3 number is the same misreading one step later: it takes add(1) as having done the addition already. Nothing is added until the argument the body is waiting for arrives.`,
    hints: ['What does the outer function return, and what has it not done yet?'],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'curry-default-parameter',
    type: 'debugging',
    form: 'choice',
    tier: 'staff',
    prompt:
      'This throws "curried(...) is not a function" on the second call, and the curry implementation is the standard one. Which change fixes it, for the right reason?',
    code: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn(...args)
    return (...rest) => curried(...args, ...rest)
  }
}

const volume = (length, width = 1, height) => length * width * height
const curried = curry(volume)

console.log(curried(2)(3)(4))`,
    options: [
      'Pass the arity in, as curry(volume, 3), because volume.length stops counting at width and reports 1',
      'Give height a default as well, so that every parameter after the first is optional and the arity is consistent',
      'Call curried(2, 3, 4) in one go, since the chain is what breaks',
      'Return curried itself from the recursive step instead of an arrow, since the arrow drops the arguments collected so far',
    ],
    correctOption: 0,
    answerInFull: `Tell curry the arity: curry(volume, 3).

curry decides it has enough arguments by comparing against fn.length, and fn.length stops counting at the first parameter with a default. volume declares three parameters but width has one, so volume.length is 1, not 3.

So curried(2) already satisfies the check and calls volume(2) immediately. That returns 2 * 1 * undefined, which is NaN, and the next call in the chain tries to invoke NaN as a function.

  function curry(fn, arity = fn.length) {
    return function curried(...args) {
      if (args.length >= arity) return fn(...args)
      return (...rest) => curried(...args, ...rest)
    }
  }

  curry(volume, 3)(2)(3)(4) // 24

Two other fixes are worth naming, in this order: remove the default and handle it inside the body, so the arity is honest, or move the defaulted parameter to the end, which at least makes the reported length match the arguments that are really required.

The general rule is the sentence to say out loud. Any curry driven by fn.length inherits every way that number can lie, and defaults, rest parameters and variadic functions are all ways it lies.`,
    explanation: `Defaulting height as well sounds like it makes the arity consistent and does nothing: length still stops at the first default, volume.length is still 1, and curried(2) still calls through on one argument. The error moves rather than goes.

Calling curried(2, 3, 4) really does work, because three arguments clear a threshold of one and volume gets all three. It fixes this call site and leaves the curry broken for every other one, which is the difference between a workaround and a fix.

The arrow in the recursive step is not the bug, it is the mechanism. It closes over args and spreads them into the next call, and replacing it with curried itself is what would drop them.

The same reasoning kills currying for variadic functions: there is no argument count at which Math.max is finished, so arity can never tell you when to call through.`,
    hints: ['What is volume.length here?', 'Which parameter does length stop counting at?'],
    tags: ['functions', 'currying', 'parameters'],
  },
  {
    id: 'implement-curry',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are writing curry(fn) so that curried(1)(2)(3), curried(1, 2)(3) and curried(1, 2, 3) all call fn with the same three arguments, and so a partial can be reused. Which design does that?',
    options: [
      'Push the arguments of every call into one array held by the curried function, and call fn once that array is long enough',
      'Build a chain of exactly fn.length functions, each closing over one argument',
      'Count how many times the curried function has been called, and call fn on the fn.length-th call',
      'Gather the arguments of a call, call fn when there are at least fn.length of them, and otherwise return a function that continues from what has been gathered',
    ],
    correctOption: 3,
    answerInFull: `Gather and compare, and never write to what has been gathered:

  function curry(fn, arity = fn.length) {
    return function curried(...args) {
      if (args.length >= arity) return fn.apply(this, args)

      // A call that supplies nothing is not progress, so refuse it rather than
      // handing back another gatherer forever.
      if (args.length === 0) throw new TypeError('curried function needs at least one argument')

      return curry(fn.bind(this, ...args), arity - args.length)
    }
  }

The core is three lines: gather arguments, compare against the arity, and either call through or return something that remembers what has been gathered. Four things make it a strong answer rather than a passable one.

Taking the arity as a parameter defaulting to fn.length, so a variadic function or one with a default parameter can still be curried by being told what to wait for.

Forwarding this with apply, so a curried method keeps its receiver.

Rejecting a zero-argument call, because otherwise curried() returns another gatherer and the chain can never end.

Keeping each partial independent: reusing one intermediate function twice must not let the two calls see each other's arguments. The bind-based recursion above gets that for free. The commonly written alternative closes over args and spreads it into the next call, which is equally correct as long as it never mutates that array.`,
    explanation: `One shared array is the version most people write first, and it passes all three calls in the prompt on the first run. Reuse is what breaks it. Take a partial, call it twice, and the second call sees the arguments the first one pushed. A partial that works once is not a partial.

A chain of fn.length single-argument functions is strict currying, and it is the answer to a narrower question. It cannot accept curried(1, 2), because each step takes exactly one argument and ignores the rest.

Counting calls fails from the other end. curried(1, 2)(3) reaches fn on its second call with all three arguments, while curried(1)(2)(3) needs three calls to get there. Arguments are what has to be counted, and calls are only what is easy to count.`,
    hints: [
      'What decides that enough arguments have arrived?',
      'What happens if the same partial is called twice?',
      'Does a curried method still see the right this?',
    ],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'bind-output',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function greet(greeting, name) {
  return greeting + ', ' + name
}

const hi = greet.bind(null, 'hi')

console.log(hi('ada'))
console.log(hi.length)
console.log(hi.name)
console.log(greet.bind(null) === greet.bind(null))`,
    items: ['2', 'bound greet', 'hi, ada', 'true', '1', 'greet', 'false'],
    correctOrder: [2, 4, 1, 6],
    answerInFull: `hi, ada
1
bound greet
false

bind is partial application with a this value attached. Fixing the first of two parameters leaves a function of one, so hi('ada') supplies the rest and greet runs normally.

That is also why hi.length is 1: a bound function reports the original arity minus however many arguments were fixed. Its name is the original prefixed with "bound ", which is the only part of its identity that says a bind happened at all.

The last line is the one that matters in practice. bind returns a brand new function object on every call, so two binds of the same function with the same arguments are never equal. Binding inside a loop, a render or an event registration therefore creates a fresh identity each time, which is why the matching removeEventListener never finds anything.`,
    explanation: `2 is in the pool because it is greet.length, the answer if you read bind as attaching a this value and nothing else. Watching the arity drop is how you know arguments were fixed.

greet is there for the name. Nothing renames the original, and the bound copy reports "bound greet".

true is the interesting one, because the two bound functions really do behave identically. They are still two objects, so === is false, and anything comparing handlers by identity treats them as unrelated.`,
    hints: ['What does bind do to the arity, and what does it return each time?'],
    tags: ['functions', 'bind', 'references'],
  },
  {
    id: 'handler-per-row',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A table of a few thousand rows builds a click handler per row with handleClick.bind(null, row.id). Memory grows and every re-render churns listeners. Which change addresses the cause?',
    options: [
      'Cache each bound handler in a Map keyed by the row id, so a row binds once and keeps its identity across renders',
      'Put one listener on the table and read the id from the element the event came from',
      'Swap bind for an arrow function closing over row.id, since an arrow does not allocate a new function object',
      'Keep the bind and remove every listener before each pass, since the churn is the leak rather than the count',
    ],
    correctOption: 1,
    answerInFull: `One listener on the table, with the id read from the row the event came from, usually out of a data attribute.

Every bind allocates a new function object holding the bound arguments, so a few thousand rows means a few thousand functions, and every re-render allocates a fresh set with new identities. Nothing can match the old ones, so listeners are removed and re-added, or never removed at all.

Delegation replaces N functions with one, and it keeps working as rows are added and removed, because the listener sits on an ancestor that outlives them. It also answers the question underneath the bug: most of the time the id does not need to be baked into a function at all.

The rest of the approach:
- If a handler per row is genuinely needed, create it once per row and keep it, rather than rebuilding it on each pass.
- Measure before restructuring. A few thousand small closures is not automatically a problem, and the churn is usually the real cost rather than the allocation.

The sentence worth saying is that partial application is not free. It creates an object, and doing it per item per render multiplies that by two dimensions. Delegation removes the per-item function rather than making it cheaper, which is solving the problem one level up.`,
    explanation: `The Map is the tempting answer because it is a real improvement: identities become stable and the churn stops. It still holds a few thousand functions, and it now holds them for the life of the page, so it has to be invalidated as rows come and go or it becomes the leak itself.

An arrow allocates exactly what bind allocates, one function object per row per pass. Arrows are cheaper to write, not cheaper to make.

Removing every listener before each pass is bookkeeping wrapped around the count instead of a reduction of it, and it fails silently. Miss one removal and the growth is back, with nothing to say where it came from.`,
    hints: ['How many function objects does one render create here?'],
    tags: ['functions', 'bind', 'performance'],
  },
  {
    id: 'when-to-curry',
    type: 'interview',
    form: 'open',
    tier: 'senior',
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
    form: 'choice',
    tier: 'swe-2',
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

console.log(start('y', 'z'), start('1', '2'))`,
    options: ['x-y-z x-y-z', 'x-y-z x-1-2', 'y-z-x 1-2-x', 'TypeError: start is not a function'],
    correctOption: 1,
    answerInFull: `x-y-z x-1-2

start is a function closing over args, which holds exactly ['x']. Calling it does not modify that array, it spreads it into a new call, so every use of start begins again from the same one argument.

This is what makes a partial reusable rather than single use. If the implementation had pushed into args instead of spreading it, the second call would carry whatever the first one added, and the two results would disagree in a way that is almost invisible from the call site.

Spreading rather than mutating is the detail that makes it safe, and it is worth volunteering when you are asked to implement curry: partials are independent because nothing shared is ever written to.`,
    explanation: `x-y-z twice is what an implementation that accumulates into one array prints, since only the first three of the five collected arguments reach a, b and c. It is the answer if you picture start as holding a growing list rather than a fixed one.

y-z-x reads curried(...args, ...rest) with the two spreads the other way round. Which one comes first is what decides that arguments are fixed from the left, which is the only direction bind and most curry implementations support.

The TypeError is the single-use reading, where a partial is consumed by its first call. Nothing consumes it. start is an ordinary function value and stays one for as long as you keep it.`,
    hints: ['Does calling start change anything that start is holding?'],
    tags: ['functions', 'currying', 'closures'],
  },
  {
    id: 'which-is-partial-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these is partial application rather than currying?',
    options: [
      'const g = (a) => (b) => (c) => f(a, b, c)',
      'const g = f.bind(null, 1)',
      'const g = curry(f)',
      'const g = (...args) => f(...args)',
    ],
    correctOption: 1,
    answerInFull: `f.bind(null, 1).

bind fixes some arguments in one step and returns a function taking the rest, which is the definition of partial application. It is the version built into the language, and naming it is usually the quickest way to show which word means which.

Arity is the test to apply. f.bind(null, 1) has one fewer parameter than f and can still be called with everything else at once. A curried f has to be called one argument at a time, however many there are.

Worth adding: bind fixes the this value as well, and that is the part of it people remember. What it does to the arguments is the partial application, and the two are independent, since binding null fixes an argument and nothing meaningful about this.`,
    explanation: `The nested arrows are currying written by hand, and they are what most people picture on hearing either word, so they read as the safe answer. Every step there takes exactly one argument, which is precisely what partial application does not do.

curry(f) is the same shape produced by a helper. A library one probably also accepts curried(1, 2)(3), which makes it a hybrid and closer to automatic partial application, but it is still not one step.

The last option fixes nothing at all. It is a pass-through wrapper with the same arity as f, and it is in the list because forwarding arguments looks like doing something with them.`,
    hints: [],
    tags: ['functions', 'currying', 'bind'],
  },
  {
    id: 'bound-length-choice',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'Given function f(a, b, c) {}, what is f.bind(null, 1, 2).length?',
    options: ['3', '2', '0', '1'],
    correctOption: 3,
    answerInFull: `1.

A bound function reports the original arity minus the number of arguments that were fixed, so three minus two is one. It never goes below zero, so binding more arguments than the function declares still reports 0.

This is what lets a curry implementation keep working across a bind: the arity it reads goes down as arguments are supplied, which is why a curry can be built out of repeated binds rather than out of a stored array.

It is also a reminder of what length is. It describes the parameter list, not what the function needs, and defaults, rest parameters and bind all change what it reports.`,
    explanation: `3 is the answer if you read bind as being about this and nothing else, which is how it is introduced almost everywhere.

2 counts the arguments that were fixed rather than the ones still to come. Both numbers are sitting in the expression, so the question is which of them length is about.

0 is real behaviour at the wrong time. It is what f.bind(null, 1, 2, 3, 4).length reports, because the count is clamped at zero rather than allowed to go negative.`,
    hints: [],
    tags: ['functions', 'bind', 'parameters'],
  },
  {
    id: 'curry-arity-source-choice',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'How does a typical curry implementation know it has collected enough arguments?',
    options: [
      'It counts the parameters by parsing fn.toString()',
      'It waits for a call with no arguments to signal the end',
      'It compares how many it has collected against fn.length',
      'It calls fn and retries if the result is undefined',
    ],
    correctOption: 2,
    answerInFull: `It compares the number of arguments collected so far against fn.length.

That is the whole mechanism, and it is also the whole limitation. fn.length stops counting at the first parameter with a default and does not count a rest parameter at all, so a variadic or partly optional function reports a number that makes curry fire early.

Which is why any implementation worth using takes the arity as a second parameter defaulting to fn.length. curry(fn, 3) is the escape hatch for every function whose parameter list does not describe what it needs.`,
    explanation: `Parsing fn.toString() does exist in the wild, and it is how placeholder-supporting libraries used to find parameter names. It breaks on minified code, on native functions and on destructured parameters.

Calling fn to see what comes back would run its side effects, possibly several times, which is not something a wrapper is allowed to do.

Waiting for a zero-argument call is a real design and a different one: it is how a variadic curry has to end, since arity can tell it nothing. An arity-driven curry should refuse that call instead, because otherwise curried() hands back another gatherer forever.`,
    hints: [],
    tags: ['functions', 'currying', 'parameters'],
  },
]
