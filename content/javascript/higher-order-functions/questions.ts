import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-a-higher-order-function',
    type: 'concept',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What is a higher order function, and what does the pattern actually buy you?',
    answerInFull: `A higher order function is one that takes a function as an argument, returns a function, or both. It is possible because functions in JavaScript are ordinary values: they can be stored, passed and returned like any object.

What it buys is that the varying step of an algorithm becomes a parameter. Two pieces of code that differ only in one step collapse into one implementation plus a callback, and the wrapper and the work no longer have to know anything about each other.

Examples worth naming: map, filter and reduce take one; once, memoize and debounce return one; Express middleware and React higher order components are the returning kind at a larger scale.`,
    explanation: `The answer that stops at "it makes code reusable" is true of every abstraction and says nothing. Naming the mechanism, that a step becomes an argument, is what shows you know why this particular technique works, and it leads straight into the follow-up question of implementing one.`,
    hints: ['What kind of value is a function in JavaScript?'],
    tags: ['functions', 'callbacks'],
  },
  {
    id: 'foreach-return-value',
    type: 'output',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What does this print?',
    code: `const nums = [1, 2, 3, 4]

const doubled = nums.forEach((n) => n * 2)
console.log(doubled)

const kept = []
nums.forEach((n) => {
  if (n % 2 === 0) return
  kept.push(n)
})
console.log(kept)`,
    answerInFull: `undefined
[ 1, 3 ]`,
    explanation: `forEach exists for its side effects and always returns undefined. Whatever the callback returns is thrown away, which is why the first log is undefined rather than an array of doubles. map is the one that collects return values.

The return inside the second callback ends that one call and nothing more. forEach carries straight on with the next element, so it behaves like continue rather than break. There is no way to stop a forEach early.`,
    hints: ['What does forEach do with the value its callback returns?'],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'async-foreach',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'This logs "all saved" immediately and the saves finish long afterwards. Explain why, and give two fixes that behave differently from each other.',
    code: `async function saveAll(items) {
  items.forEach(async (item) => {
    await save(item)
  })
  console.log('all saved')
}`,
    answerInFull: `The async callback returns a promise as soon as it hits the first await. forEach ignores whatever its callback returns, so it starts the next one straight away, finishes the loop, and saveAll reaches the log with every save still in flight. Nothing is awaited because there is nothing holding the promises.

Fix one, sequential:

  for (const item of items) {
    await save(item)
  }

Fix two, concurrent:

  await Promise.all(items.map((item) => save(item)))

They are not interchangeable. The first saves one at a time and stops at the first failure. The second starts everything at once and rejects on the first failure while the rest keep running. Which one is right depends on whether the saves can run in parallel and what should happen when one fails.`,
    explanation: `The root cause is a property of forEach rather than of async: forEach has no way to consume a return value, so it can never wait for one. Any higher order function that discards its callback's result has the same problem. map does not, which is why the Promise.all fix works by switching to map first.`,
    hints: [
      'What does an async function return the moment it awaits?',
      'What does forEach do with that value?',
    ],
    tags: ['functions', 'callbacks', 'async'],
  },
  {
    id: 'implement-reduce',
    type: 'coding',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'Implement reduce(array, fn, initial) without using Array.prototype.reduce, matching the real one on the details that matter.',
    answerInFull: `function reduce(array, fn, ...rest) {
  const hasInitial = rest.length > 0
  let acc = hasInitial ? rest[0] : array[0]
  let index = hasInitial ? 0 : 1

  if (!hasInitial && array.length === 0) {
    throw new TypeError('Reduce of empty array with no initial value')
  }

  for (; index < array.length; index++) {
    acc = fn(acc, array[index], index, array)
  }

  return acc
}`,
    explanation: `Three details separate a real answer from a sketch.

The callback takes four arguments, accumulator, value, index and array, not two.

Whether an initial value was passed has to be decided by counting arguments rather than by testing for undefined, because undefined is a legitimate initial value. A rest parameter is the cleanest way to count.

Without an initial value the first element becomes the accumulator and the callback is never called with it, so a single element array returns that element with zero calls. An empty array with no initial value is a TypeError, which is the case people forget until it happens in production.`,
    hints: [
      'How do you tell "no initial value" apart from "an initial value of undefined"?',
      'How many arguments does the real callback receive?',
      'What should an empty array with no initial value do?',
    ],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'function-identity',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `function makeHandler() {
  return () => console.log('click')
}

const first = makeHandler()
const second = makeHandler()

console.log(first === second)
console.log(String(first) === String(second))`,
    answerInFull: `false
true`,
    explanation: `Every evaluation of a function expression creates a new function object, so two calls to makeHandler produce two objects that happen to have identical source. Comparing them with === compares identity, which is false.

Converting them to strings compares their source text, which is the same, so that is true. Nothing in the language treats two functions as equal because they look alike, and that is exactly why removeEventListener needs the same object you added rather than an equivalent one.`,
    hints: ['How many function objects does calling makeHandler twice create?'],
    tags: ['functions', 'references'],
  },
  {
    id: 'listener-never-removed',
    type: 'scenario',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'A widget adds a scroll listener when it opens and removes it when it closes. Listeners keep accumulating and scrolling gets slower every time it is reopened. The add and remove calls both look correct. What would you check?',
    answerInFull: `Almost certainly the handler is being created inline in both places, so the function passed to removeEventListener is a different object from the one that was added:

  window.addEventListener('scroll', () => this.onScroll())
  window.removeEventListener('scroll', () => this.onScroll())

removeEventListener matches by identity, together with the type and the capture flag. Two arrow functions with the same body are two objects, so the remove silently matches nothing and the old listener stays attached.

The fix is to hold on to the one function:

  const handler = () => this.onScroll()
  window.addEventListener('scroll', handler)
  // later
  window.removeEventListener('scroll', handler)

An AbortController signal passed to addEventListener is the modern alternative, and it removes the whole class of bug because there is nothing to match.

Two other things worth checking: that the capture flag matches on both calls, and that a bound method is not being re-bound at each call site, since bind also returns a new function every time.`,
    explanation: `The reason this bug survives review is that both lines read correctly in isolation. Nothing warns you, because removeEventListener with an unmatched handler is not an error, it is a no-op. The general rule to carry away is that any API which registers a function and later unregisters it is comparing identity, so the function has to be stored somewhere.`,
    hints: ['How does removeEventListener decide which listener to remove?'],
    tags: ['functions', 'callbacks', 'references'],
  },
  {
    id: 'when-callbacks-hurt',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt: 'When do higher order functions make code worse rather than better?',
    answerInFull: `Four situations where the abstraction costs more than it saves:

- One caller. Pulling a step into a callback so that a single call site can pass it is indirection with nothing on the other side. Wait for the second case.
- Stack traces and debugging. Three layers of wrapper mean an error surfaces inside machinery the reader did not write, and the frame that matters is buried.
- Hot loops. A callback per element is a call per element, and an inlined loop is measurably faster when the array is large and the body is small. Measure before caring.
- Chains that build intermediate arrays. filter then map then reduce walks the data three times and allocates twice. Usually fine, occasionally the thing to fix.

There is also a readability limit. Point free style, where the arguments are never named, reads well for one or two steps and becomes a puzzle beyond that. A plain arrow with named parameters is not a worse answer.`,
    explanation: `Interviewers ask this to find out whether the pattern is a tool or a habit. The candidate who cannot name a downside usually applies it everywhere. Naming the single-caller case in particular shows the judgement they are looking for, because that is the mistake that actually shows up in code review.`,
    hints: [],
    tags: ['functions', 'design'],
  },
  {
    id: 'reduce-single-element',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `let calls = 0

const total = [7].reduce((a, b) => {
  calls += 1
  return a + b
})

console.log(total, calls)`,
    answerInFull: '7 0',
    explanation: `With no initial value, reduce takes the first element as the accumulator and starts iterating from the second. A single element array has no second element, so the loop body never runs and the callback is never called once.

The array is returned through unchanged, so total is 7 and calls is 0. The same rule is why an empty array with no initial value throws a TypeError rather than returning undefined: there is no first element to start from.

Passing an initial value of 0 would make both of those cases ordinary, and the count here would be 1.`,
    hints: ['What becomes the accumulator when no initial value is given?'],
    tags: ['functions', 'callbacks', 'arrays'],
  },
  {
    id: 'which-is-higher-order-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'Which of these is not a higher order function?',
    options: ['setTimeout', 'Array.prototype.map', 'Number.parseInt', 'Function.prototype.bind'],
    correctOption: 2,
    answerInFull:
      'parseInt takes a string and a number and returns a number. No function goes in or comes out, so it is an ordinary function. setTimeout and map take one, and bind returns one. The definition is only about whether a function is an argument or the result, not about how clever the function is.',
    hints: [],
    tags: ['functions', 'callbacks'],
  },
  {
    id: 'filter-boolean-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this evaluate to?',
    code: `['0', '', 'false', 0, null, []].filter(Boolean)`,
    options: ["['0', 'false', []]", "['0', 'false']", '[]', "['0', '', 'false', []]"],
    correctOption: 0,
    answerInFull:
      'filter(Boolean) keeps everything truthy. The strings "0" and "false" are non-empty strings, so they are truthy despite what they say, and an empty array is an object, so it is truthy too. The empty string, the number 0 and null are the falsy ones and are dropped. This is a neat idiom and a good illustration of passing an existing function as a callback, since Boolean happens to take exactly one argument and so is safe here.',
    hints: [],
    tags: ['functions', 'callbacks', 'coercion'],
  },
  {
    id: 'stop-a-foreach-mcq',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'How do you stop iterating early inside a forEach?',
    options: [
      'return false from the callback',
      'break inside the callback',
      'You cannot; use for...of, some, or find instead',
      'return from the callback',
    ],
    correctOption: 2,
    answerInFull:
      'forEach offers no way out. break is a syntax error, since the callback is a function rather than a loop body, and returning only ends that one call, so it behaves like continue. some and every stop as soon as the callback settles the answer, find stops at the first match, and for...of supports break directly.',
    hints: [],
    tags: ['functions', 'callbacks', 'arrays'],
  },
]
