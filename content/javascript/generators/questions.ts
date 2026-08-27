import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-calling-does',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What happens when you call a generator function, function* gen() { ... }, as gen()?',
    options: [
      'The body runs to the first yield and the yielded value is returned',
      'The body runs to completion and an array of every yielded value is returned',
      'None of the body runs. A generator object is returned, and the body starts on the first next()',
      'The body runs on a separate thread and yields are delivered as they happen',
    ],
    correctOption: 2,
    answerInFull: `Nothing in the body runs. The call returns a generator object, which is an iterator: it has next(), and Symbol.iterator returning itself, so it works in for...of and spread.

The first next() runs the body from the top to the first yield. Each later next() resumes from the yield it stopped at. Locals, the loop position, everything survives between calls.

The practical consequence: a console.log at the top of a generator does not print when the function is called. It prints when iteration starts, which surprises people debugging one for the first time.`,
    explanation: `Running to the first yield is what the first next() does, and people fold it into the call. The call and the first step are separate, which is what lets a generator be created now and consumed later.

An array of every value is what [...gen()] produces. The function itself builds no array, and it can be infinite precisely because it does not.

There are no threads. A generator runs on the caller's stack, during next(), and pauses by returning from next().`,
    hints: ['When does the first line of the body execute?'],
    tags: ['generators'],
  },
  {
    id: 'next-argument-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function* g() {
  const a = yield 1
  const b = yield a + 10
  return b + 100
}
const it = g()
console.log(it.next(5).value)
console.log(it.next(6).value)
console.log(it.next(7).value)`,
    options: ['1 16 107', '1 15 105', '6 16 107', '1 16 undefined'],
    correctOption: 0,
    answerInFull: `1 16 107

The first next(5) starts the body. No yield is paused yet, so 5 goes nowhere. The body runs to yield 1 and the step's value is 1.

next(6) resumes at that yield, and 6 becomes the value of the yield expression, so a is 6. The body runs to yield a + 10, which is 16.

next(7) resumes there with b as 7, and the body returns b + 100. A return ends the generator with { value: 107, done: true }, and reading .value by hand sees 107.`,
    explanation: `1 15 105 is what you get if you think the first next's argument lands on the first yield, shifting everything by one: a would be 5, b would be 6. The first argument is discarded.

6 16 107 has the first next() returning its own argument. It returns what the generator yielded, which is 1.

undefined for the last line would be right if the body had no return. It does, and a hand-driven next() sees the returned value on the done step. for...of would have ignored it.`,
    hints: [
      'Where does the argument to the first next() go?',
      'What does next() return when the body returns?',
    ],
    tags: ['generators', 'two-way'],
  },
  {
    id: 'yield-star-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `function* inner() {
  console.log('inner start')
  yield 'a'
  return 'inner done'
}

function* outer() {
  console.log('outer start')
  const result = yield* inner()
  console.log('result', result)
  yield 'b'
}

for (const v of outer()) {
  console.log('value', v)
}`,
    items: [
      'outer start',
      'inner start',
      'value a',
      'value inner done',
      'result inner done',
      'value b',
      'result undefined',
    ],
    correctOrder: [0, 1, 2, 4, 5],
    answerInFull: `outer start
inner start
value a
result inner done
value b

The loop calls next() on outer, which runs to yield*. That starts inner, which logs and yields 'a', and yield* passes 'a' out as outer's own value. The next next() resumes inner, which returns 'inner done'. That return value does not reach the loop: yield* swallows it and makes it the value of the yield* expression, so result is 'inner done'. outer then yields 'b', and the loop ends when outer finishes.`,
    explanation: `"value inner done" is the main distractor. A return from a generator produces a done: true step, which for...of discards. Here it is not even that: yield* consumed inner's completion and handed the value to outer as an expression result.

"result undefined" is what you get if you think yield* evaluates to undefined like a statement. It evaluates to the delegated generator's return value, which is the one place that value is useful.`,
    hints: ['What does yield* evaluate to?', 'Does for...of ever see a return value?'],
    tags: ['generators', 'delegation'],
  },
  {
    id: 'reused-generator-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A function takes a generator object and logs every value, then another function receives the same object and gets nothing. Why, and what is the fix?',
    code: `function* ids() {
  yield 1
  yield 2
}
const gen = ids()
logAll(gen) // 1, 2
sum(gen) // 0`,
    options: [
      'The generator was garbage collected between the calls. Hold a reference to it',
      'A generator object is a one-shot iterator. The first loop ran it to done, and the second found it already finished. Call ids() again for a fresh one, or pass the generator function rather than its result',
      'logAll used for...of, which calls return() and closes the generator. Drive it with next() by hand in logAll so it stays open',
      'yield only produces each value once per process. Use return instead of yield for values that are needed twice',
    ],
    correctOption: 1,
    answerInFull: `A generator object is an iterator, and an iterator is a position in a sequence. logAll walked it to the end. When sum asks it for its iterator, Symbol.iterator returns the same object, already done, and the first next() says so.

Two fixes. Either create a fresh generator per consumer: logAll(ids()); sum(ids()). Or, when a function needs to iterate something more than once, ask for an iterable that hands out fresh iterators, such as a Range-style object with a generator method, rather than a generator object.

The principle is the same as for map.keys() or any iterator: spread the collection, not a stored iterator.`,
    explanation: `Nothing is collected while gen holds it. Garbage collection does not reset iterators in any case.

return() is called only on early exit, and logAll read to the end. Even if return() had been called, a fresh generator is still the fix; driving next() by hand changes nothing about the generator being finished.

yield produces a value every time the body reaches it, on every generator object. The limit is per object, not per process.`,
    hints: ['What does a generator object represent: a sequence, or a position in one?'],
    tags: ['generators', 'iteration'],
  },
  {
    id: 'take-generator-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write take(iterable, n) as a generator that yields the first n values of any iterable and stops, so that take(naturals(), 3) on an infinite generator terminates and releases the source. Which is correct?',
    options: [
      'function* take(iterable, n) {\n  let i = 0\n  for (const value of iterable) {\n    if (i++ >= n) return\n    yield value\n  }\n}',
      'function* take(iterable, n) {\n  return [...iterable].slice(0, n)\n}',
      'function* take(iterable, n) {\n  let i = 0\n  for (const value of iterable) {\n    if (i < n) yield value\n    i++\n  }\n}',
      'function* take(iterable, n) {\n  const it = iterable[Symbol.iterator]()\n  for (let i = 0; i < n; i++) yield it.next()\n}',
    ],
    correctOption: 0,
    answerInFull: `function* take(iterable, n) {
  let i = 0
  for (const value of iterable) {
    if (i++ >= n) return
    yield value
  }
}

for...of pulls one value at a time, so the source is only ever asked for one more than it yields. When the count is reached, the return exits the loop early, and for...of calls return() on the source's iterator, which is what lets an infinite generator with a finally block clean up.

The off-by-one to check: with n = 0, the first value is pulled and then discarded. A version that checks before the loop, if (n <= 0) return, avoids pulling anything. Say that if the interviewer is counting calls.`,
    explanation: `Spreading an infinite iterable never finishes. [...iterable] has to reach done before slice can run, and naturals() has no done.

The version that keeps looping after i reaches n is correct in what it yields and never stops reading. On an infinite source, the consumer gets n values and then the for...of inside take spins forever on the next next().

Yielding it.next() yields the { value, done } objects rather than the values, and it never checks done, so on a short source it yields { value: undefined, done: true } repeatedly. It also never calls return() on the source.`,
    hints: ['How does the loop inside take end, and what does ending it early do to the source?'],
    tags: ['generators', 'lazy'],
  },
  {
    id: 'lazy-pipeline-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'senior',
    prompt:
      'A report reads a 10 GB log file, keeps lines containing "ERROR", parses each, and shows the first 20. The current code loads the file into an array of lines, filters, maps, then slices. Memory blows up. How do generators fix it, and what changes about when work happens?',
    options: [
      'Replace the array methods with generator versions of filter and map over a line-by-line source, then take(20). Each line is read, tested and parsed only when the consumer asks for the next result, so the file is read until the twentieth match and then released',
      'Wrap the array in a generator so that the filter and map run in a background thread',
      'Use generators to read the file in chunks, but keep the array pipeline, since map and filter need a complete array to work',
      'Generators do not help with memory; use a smaller log file or stream it to a database first',
    ],
    correctOption: 0,
    answerInFull: `The array pipeline does all of its work eagerly: every line in memory, then every line tested, then every match parsed, and only then are 20 kept. Three full passes and the whole file resident.

With a generator source that yields one line at a time, and generator versions of filter and map that each yield as they go, nothing is held except the current line. take(20) asks the pipeline for one value, that request pulls one line through filter and map, and after the twentieth match take returns, which calls return() up the chain and closes the file.

What changes is when work happens: it happens on demand, in the order the consumer asks, and stops the moment the consumer stops. The file is read up to the twentieth error and no further. Lines after that are never read, never tested, never parsed.

The same shape with async generators, for await, is how you do it when the line source is a real stream, which is the next group.`,
    explanation: `No threads. A generator runs on the caller's stack during next(). The win is laziness, not parallelism.

Array map and filter require an array and produce one. Reading in chunks while keeping them still holds every line of every chunk at once, which is the original problem in pieces.

Generators are exactly the tool for this, because an iterator holds one position rather than the whole sequence.`,
    hints: [
      'In the array version, how much work has been done before the first result is available?',
    ],
    tags: ['generators', 'lazy', 'memory'],
  },
  {
    id: 'async-await-relationship-interview',
    type: 'interview',
    form: 'open',
    tier: 'staff',
    prompt:
      'Explain how async/await could be built out of generators and promises. Sketch the runner and say what each generator method is used for.',
    answerInFull: `An async function is a generator that yields promises, plus a runner that drives it.

The runner takes the generator object and calls next(). It gets back a step. If done, it resolves the outer promise with the step's value, which is the return value of the async function. Otherwise the value is a promise, and the runner attaches then to it. When that promise fulfils, the runner calls next(result), so the fulfilled value becomes the value of the paused yield, which is what await evaluates to. When it rejects, the runner calls throw(error), so the rejection is thrown at the paused yield and an ordinary try/catch in the body can catch it.

In code:

  function run(genFn) {
    return new Promise((resolve, reject) => {
      const gen = genFn()
      const step = (method, arg) => {
        let result
        try {
          result = gen[method](arg)
        } catch (e) {
          return reject(e)
        }
        if (result.done) return resolve(result.value)
        Promise.resolve(result.value).then(
          (v) => step('next', v),
          (e) => step('throw', e),
        )
      }
      step('next')
    })
  }

So: yield is await, next(value) is resumption with the fulfilled value, throw(error) is resumption with the rejection, and the generator's return is the async function's resolved value. The Promise.resolve around the yielded value is what lets you await a plain value.

That is also why await splits a function where it does: each yield returns from next(), and the rest of the body runs later, from a then callback, which is a microtask. The first await is synchronous up to the yield, exactly like the first next() runs to the first yield.`,
    explanation: `The answer an interviewer wants is the mapping, stated cleanly: yield for await, next for fulfilment, throw for rejection, return for the resolved value. The sketch of the runner is what proves you are not reciting it. Mentioning that the resumption happens from a then callback, and so on the microtask queue, connects it to the event loop and is where strong candidates go.`,
    hints: [],
    tags: ['generators', 'async'],
  },
  {
    id: 'finally-on-break-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'What does this print?',
    code: `function* lines() {
  try {
    yield 'a'
    yield 'b'
    yield 'c'
  } finally {
    console.log('closed')
  }
}

for (const line of lines()) {
  console.log(line)
  if (line === 'b') break
}
console.log('after')`,
    options: ['a b closed after', 'a b after', 'a b c closed after', 'a b after closed'],
    correctOption: 0,
    answerInFull: `a
b
closed
after

The loop yields 'a' and 'b'. On break, for...of calls return() on the generator. return() resumes the generator as if a return statement were at the paused yield, and leaving the try block that way runs the finally, so 'closed' prints before the loop statement is finished. Then 'after'.

This is how a generator holding a file or a cursor gets to release it regardless of how the consumer leaves: open before the first yield, close in finally, and both normal completion and early exit run it.`,
    explanation: `Leaving 'closed' out is the belief that break just abandons the generator. for...of honours the protocol's return() and generators implement it.

Printing 'c' would need the loop to carry on past the break.

'closed' after 'after' would mean return() ran asynchronously. It runs synchronously, inside the break, before the loop statement completes.`,
    hints: [
      'What does for...of call on break?',
      'What does calling return() do to a generator paused inside a try?',
    ],
    tags: ['generators', 'resources'],
  },
  {
    id: 'yield-in-callback-choice',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'This generator is a syntax error. Why, and what is the fix?',
    code: `function* values(items) {
  items.forEach((item) => {
    yield item
  })
}`,
    options: [
      'forEach callbacks cannot contain yield because forEach is synchronous. Use map instead',
      'yield is only valid directly inside a generator body, and the arrow function is a separate, non-generator function. Use for (const item of items) yield item, or yield* items',
      'The arrow function needs to be marked with a star: items.forEach(*(item) => { yield item })',
      'yield must be the last statement in a block. Move it after forEach',
    ],
    correctOption: 1,
    answerInFull: `yield belongs to the function it is lexically inside, and here that is the arrow function, not values. An arrow function is never a generator, so yield is a syntax error in it.

The fix is a loop, which is a statement in the generator's own body:

  function* values(items) {
    for (const item of items) yield item
  }

or, for this exact case, yield* items, which delegates to the array's iterator.

The same rule is why await cannot appear in a forEach callback: it belongs to the nearest enclosing function, and that callback is not async. Both keywords split the function they are in, and a callback is a different function.`,
    explanation: `map has the same problem. The issue is which function yield is inside, not which array method is used.

Arrow functions cannot be generators at all. There is no star syntax for them.

yield can appear anywhere a statement or expression can, inside the generator body. Its position in the block is not the problem.`,
    hints: ['Which function is the yield lexically inside?'],
    tags: ['generators', 'syntax'],
  },
  {
    id: 'return-value-for-of-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function* g() {
  yield 1
  yield 2
  return 3
}
console.log([...g()])
const it = g()
it.next()
it.next()
console.log(it.next())`,
    options: [
      '[ 1, 2 ] then { value: 3, done: true }',
      '[ 1, 2, 3 ] then { value: 3, done: true }',
      '[ 1, 2 ] then { value: undefined, done: true }',
      '[ 1, 2, 3 ] then { value: undefined, done: true }',
    ],
    correctOption: 0,
    answerInFull: `[ 1, 2 ] then { value: 3, done: true }

Spread, like for...of, reads until a step says done and discards that step's value. The return produces that step, so 3 never makes it into the array.

Driving next() by hand, the third call is the one that runs the return, and it sees the returned value alongside done: true. Only a fourth call would give undefined.

The return value is for hand-driven consumers and for yield*, where it becomes the value of the yield* expression. Built-in consumers never see it.`,
    explanation: `Including 3 in the spread treats return like a final yield. Its step is done: true, and every consumer stops there without keeping the value.

undefined on the third next() is what the fourth would give. The third is the one that executes the return.`,
    hints: ['Which step carries the returned value, and does spread keep that step?'],
    tags: ['generators', 'protocols'],
  },
]
