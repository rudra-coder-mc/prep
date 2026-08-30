import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'what-is-a-closure',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What is a closure?',
    options: [
      'A function that has been returned from another function',
      'A function together with the lexical environment it was defined in',
      'A copy of the enclosing scope, taken when the outer function returns',
      'The object the engine allocates to hold variables that outlive their function',
    ],
    correctOption: 1,
    answerInFull: `A closure is a function together with the lexical environment it was defined in. Every function keeps a reference to the scope around it, so it can still read and write those variables after the outer function has returned.

The points to say out loud:
- It captures the variable itself, not a copy of its value.
- It is created at function definition time, not at call time.
- The captured scope stays alive as long as the closure does, which is why closures keep memory reachable.

A weak answer stops at "a function that remembers its variables". The consequence is what makes it a real answer: the binding is shared, so if the outer variable changes, every closure over it sees the new value.`,
    explanation: `Returning the function is how a closure is almost always demonstrated, which is why the first option is tempting, but a function that never leaves the scope it was defined in is still a closure.

The third option is the same misreading in reverse. The scope survives, and nothing is copied. If it were a copy, closures over one variable would drift apart instead of staying in sync.

The last option names something real. The environment record is what the closure points at, not the pairing of function and environment.`,
    hints: ['Think about what a function needs to resolve a name that is not its own.'],
    tags: ['closure', 'scope'],
  },
  {
    id: 'what-a-closure-captures-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does a closure actually capture?',
    options: [
      'A copy of the value, taken when the function was defined',
      'A copy of the value, taken the first time the function runs',
      'The variable binding itself, so a later change to it is visible',
      'Only the variables it names, with everything else in the scope released',
    ],
    correctOption: 2,
    answerInFull: `The binding, not the value. A closure holds a reference to the scope it was defined in, and reads the variable out of that scope every time it runs.

This is the single fact that explains almost every closure interview question. If the outer variable is reassigned, every closure over it sees the new value, because they all point at the same binding rather than at snapshots of it. It is why var in a loop prints the same number three times, why two functions returned from the same factory stay in sync, and why a React effect can see a stale value.

Say the consequence, not just the mechanism: closures over one binding are coupled, and the scope stays alive as long as any of them does.`,
    explanation: `Both copy answers are the same misconception at two different moments, and either one would make closures useless for shared state: a counter and a reader returned from the same factory would immediately disagree.

The last option is the interesting one, because engines really do it. V8 will often drop variables a closure demonstrably never references. It is an optimisation and not a guarantee, and it stops applying when eval or a debugger statement is in scope, or when a sibling closure does use the variable. Relying on it is what turns a handler defined beside a large array into a leak.`,
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'when-closure-created-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'When is a closure created?',
    options: [
      'When the enclosing function returns',
      'When the function is defined',
      'When the function is first called',
      'Only if the inner function reads a variable from an outer scope',
    ],
    correctOption: 1,
    answerInFull: `At definition time. Creating a function is what attaches the reference to the surrounding scope, and it happens whether or not the function ever uses that scope, and whether or not it ever escapes.

The outer function returning is not the moment a closure comes into being, it is the moment the closure becomes the only thing keeping that scope alive. That distinction is worth making out loud, because it is what separates "closures are about returning functions" from an answer that holds up.`,
    explanation: `The return is when the effect becomes visible, so it reads like the moment of creation. First call is tempting for the opposite reason: names are resolved when the function runs, so that feels like when the link is made. The link is already there; running is only when it is followed.

The last option is the optimisation confused with the language. An engine may discard what a closure provably does not use, but the reference to the scope is unconditional.`,
    hints: [],
    tags: ['closure'],
  },
  {
    id: 'counter-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `function makeCounter() {
  let count = 0
  return function () {
    count += 1
    return count
  }
}

const a = makeCounter()
const b = makeCounter()

console.log(a(), a(), b())`,
    options: ['1 2 1', '1 2 3', '1 1 1', '0 1 0'],
    correctOption: 0,
    answerInFull: `1 2 1

Each call to makeCounter creates a new execution context with its own count binding, so a and b close over different variables. a increments its own count twice, reaching 2, while b starts fresh at 1.

The version of this worth trying by hand is moving let count = 0 above makeCounter. Then there is one variable rather than one per call, both functions close over it, and the answer becomes 1 2 3. That single change is the whole concept.`,
    explanation: `1 2 3 is what a shared count gives, and it is the answer if you think of makeCounter as configuring one counter rather than building a new one each call.

1 1 1 is the copy misconception: if each returned function held its own snapshot of count, every call would start from zero again.

0 1 0 comes from reading count += 1 followed by return count as a post-increment, returning the value from before the increment.`,
    hints: ['How many times is makeCounter called, and what does each call create?'],
    tags: ['closure'],
  },
  {
    id: 'shared-scope',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function make() {
  let value = 0
  return {
    increment: () => ++value,
    read: () => value,
  }
}

const m = make()
m.increment()
m.increment()
const { read } = m
console.log(read())`,
    options: ['0', 'undefined', 'TypeError: Cannot read properties of undefined', '2'],
    correctOption: 3,
    answerInFull: `2

Both functions close over the same value binding, so increment and read stay in sync. Destructuring read off the object changes nothing, because a closure captures its scope rather than its this.

That is the practical difference between closure based privacy and methods that depend on this. Written as a class with a #value field and a read() method, pulling read off the instance would detach it, and calling it would throw. The closure version is safe to pass around as a bare function, which is most of why factories are still worth writing.`,
    explanation: `The TypeError is what the this based version of this code really does throw once read is destructured, which is why it is the option to think about rather than dismiss. The question is whether you spotted that nothing here reads this at all.

0 is the copy misconception again: separate snapshots would leave read at its starting value. undefined is what you get if you believe pulling a function off an object separates it from what it can see.`,
    hints: ['Does pulling read out of the object change what it can see?'],
    tags: ['closure', 'objects'],
  },
  {
    id: 'loop-capture-fix-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const fns = []
for (let i = 0; i < 3; i++) {
  fns.push(() => i)
}
console.log(fns.map((f) => f()))`,
    options: ['[3, 3, 3]', '[0, 0, 0]', '[0, 1, 2]', '[1, 2, 3]'],
    correctOption: 2,
    answerInFull: `[0, 1, 2]

let gives each iteration its own binding of i, so each arrow function closes over a different variable. Three iterations, three bindings, three values.

The reason matters more than the result. It is not that let is block scoped in the abstract: the specification creates a new binding for each iteration of the loop and copies the previous value into it before the increment runs. That is a loop feature, not a block feature. A single let declared above the loop brings the shared binding problem straight back.`,
    explanation: `[3, 3, 3] is what var prints here, and it is the trained answer: a loop full of closures is the setup everyone has been drilled on. Reading which keyword the loop actually uses is half of this question.

[0, 0, 0] is the copy misconception, capturing each value at the moment the arrow was created and never seeing the increment.

[1, 2, 3] comes from reading the arrow as returning i after the increment that ends its iteration, rather than the binding that iteration owns.`,
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'loop-timer-order',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `for (let i = 0; i < 2; i++) {
  setTimeout(() => console.log('timer ' + i), 0)
  console.log('loop ' + i)
}
console.log('done')`,
    items: ['loop 0', 'timer 0', 'done', 'timer 2', 'loop 1', 'timer 1'],
    correctOrder: [0, 4, 2, 1, 5],
    answerInFull: `loop 0, loop 1, done, timer 0, timer 1

Two separate things decide this. Scheduling a timer is not running it, so the whole loop and the line after it print before any callback does, however short the delay is.

Then the callbacks run, and each one prints its own number. let creates a fresh binding of i per iteration, so the first arrow closes over an i that is 0 and the second over an i that is 1, and neither is affected by the loop having finished.

Swap let for var and the second half of the output changes to timer 2 twice, because then there is one i, the loop leaves it at 2, and both callbacks read that same binding long after.`,
    explanation: `"timer 2" is in the pool because it is the line this program prints, twice, the moment the loop is written with var. That is the only thing the keyword changes here, and it is worth being able to say which lines move and which do not.

Nothing about the delay is involved. A zero millisecond timer is not "as soon as possible", it is "not before the current work finishes", so raising or lowering it would reorder the two timer lines against each other and nothing else.`,
    hints: ['Does scheduling a callback run it?'],
    tags: ['closure', 'scope', 'event-loop'],
  },
  {
    id: 'var-in-loop',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This is meant to print 0, 1, 2. It prints 3, 3, 3. Which change fixes it, for the right reason?',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}`,
    options: [
      'Give each timer a delay of i milliseconds, so the callbacks fire in the order they were made',
      'Declare i with const instead of var, so it cannot be reassigned',
      'Move the arrow function above the loop and reference i from there',
      'Swap var for let, which gives each iteration its own binding of i',
    ],
    correctOption: 3,
    answerInFull: `Swap var for let.

var is function scoped, so there is exactly one i shared by all three callbacks. The loop finishes before any timeout runs, leaving i at 3, and all three closures read that same binding. let creates a fresh binding for each iteration and copies the previous value into it, so there are three variables and each closure gets its own.

  for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0)

The other fix, and the one to reach for if you are asked to do it without let, is to capture the value in a scope of your own:

  for (var i = 0; i < 3; i++) {
    ;((captured) => setTimeout(() => console.log(captured), 0))(i)
  }

The useful part of the answer is the distinction between capturing a variable and capturing a value. Closures always capture the variable, so the fix is always to arrange for there to be more than one.`,
    explanation: `The delay option treats this as a timing bug. It is not: the three callbacks read the same variable whenever they run, so spreading them out prints 3, 3, 3 more slowly.

const looks equivalent to let, since both are block scoped, and here the loop never reaches a second iteration. A for header that reassigns its loop variable throws a TypeError on the first increment, after one timer has already been scheduled.

Hoisting the arrow above the loop changes nothing, and it is worth knowing why: a closure captures where it is defined, and outside the loop there is still exactly one i to capture.`,
    hints: [
      'How many i variables exist in total?',
      'When does the loop finish relative to the timeouts?',
    ],
    tags: ['closure', 'scope', 'event-loop'],
  },
  {
    id: 'private-state',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You are writing once(fn). It returns a wrapper that calls fn at most one time and returns that first result on every later call. fn is allowed to return undefined. Which design does that?',
    options: [
      'Call fn only while the stored result is still undefined, and return that result afterwards',
      'Set fn to null after the first call, and return early once it is null',
      'Keep a boolean saying whether fn has run, and hold the result in a second variable',
      'Hang the result off the returned wrapper as a property, and check whether that property is set',
    ],
    correctOption: 2,
    answerInFull: `Two pieces of private state, a flag and a result:

  function once(fn) {
    let called = false
    let result

    return function (...args) {
      if (!called) {
        called = true
        result = fn.apply(this, args)
      }
      return result
    }
  }

The separate flag is the whole point. Using the stored result as the flag conflates "no result yet" with "the result is undefined", and the prompt says fn is allowed to return undefined, so that wrapper would call it again on every call.

Forwarding this with apply is what makes the wrapper safe to use as a method, and forwarding args is what makes the first call behave like a call to fn.

Both variables live in a scope no caller can name. That is privacy by construction rather than by convention.`,
    explanation: `Nulling fn is the answer that reads the specification as "call at most once" and stops there. It does call fn once, and every later call returns undefined instead of the first result.

Hanging the result off the wrapper works and gives the state away. Anything holding the wrapper can read it, overwrite it or delete it, which is exactly what the closure exists to prevent. If you offer it in an interview, say that trade out loud rather than being told.`,
    hints: [
      'What state does the wrapper need to remember between calls?',
      'What if fn returns undefined?',
    ],
    tags: ['closure', 'functions'],
  },
  {
    id: 'memory-retention',
    type: 'scenario',
    form: 'choice',
    tier: 'staff',
    prompt:
      'A page slowly grows in memory. Event handlers are attached from inside a function that also builds a large array, and the handlers never touch that array. Which explanation fits?',
    options: [
      'The array is safe, because engines drop variables a closure demonstrably never references',
      'Each attached handler keeps its whole enclosing scope reachable, and the array is in that scope',
      'Every handler holds its own copy of the array, so the growth is one array per handler',
      'The handlers are the leak rather than the array: attaching more than you remove is what grows the heap',
    ],
    correctOption: 1,
    answerInFull: `A closure keeps its entire enclosing scope reachable, not only the variables it happens to use. The handler and the array share a scope, so the array cannot be collected while the handler is still attached.

What to check and do:
- Whether handlers are removed when their elements are removed.
- Whether the large data is actually needed by the handler, or just happens to share a scope with it.
- Move the handler out of that scope, or null out the large reference once it is no longer needed.

Sharing a scope is what couples their lifetimes, and it is the sentence to say in the interview. The fix is to stop sharing the scope rather than to remember harder.`,
    explanation: `The first option is the one to argue with rather than dismiss, because engines really do this. V8 will often drop variables a closure never references. It is an optimisation, it stops applying around eval and debugger, and it stops applying when several closures share one scope and any of them does use the big variable. You cannot design against a leak by hoping for it.

The copy answer would produce a much faster leak than the one described, and copies would break the shared state closures are used for.

Unremoved handlers are a real leak and are worth checking anyway, but a handful of small functions does not account for growth on this scale. What they are holding does.`,
    hints: ['What keeps the array reachable?'],
    tags: ['closure', 'performance'],
  },
  {
    id: 'module-pattern',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'How do closures give you private state, and how does that compare with private class fields?',
    answerInFull: `A closure makes state private by construction: the variable lives in a scope nobody outside can name, so there is no syntax that reaches it. This is the module pattern: return an object of functions that all close over the same variables.

Compared with #private class fields:
- Closures allocate their state per instance created by the factory, and each function is a new object, so many instances cost more memory than prototype methods.
- Class private fields are enforced by the language, give better debugging and introspection, and share methods via the prototype.
- Closures survive being pulled apart. Destructure a function off a factory's object and it still works, where a method reading a private field through this would throw.
- Closures are still the answer when you want a single instance or a function rather than an object.

The honest short version is that private fields are the better default in modern code, and closures remain the natural fit for factories, function wrappers such as once or throttle, and anything that returns a function rather than an object.`,
    hints: [],
    tags: ['closure', 'objects'],
  },
  {
    id: 'closure-sees-later-value-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `let message = 'first'
const show = () => console.log(message)

message = 'second'
show()

message = 'third'
show()`,
    options: [
      'first, then first',
      'second, then second',
      'second, then third',
      'first, then second',
    ],
    correctOption: 2,
    answerInFull: `second
third

show does not hold a copy of message. It holds the variable, and it reads it at the moment it runs, so each call sees whatever the last assignment left there.

This is the loop puzzle with the loop taken out. Three callbacks over one var i all print 3 for exactly this reason: they read the binding when they run, and by then the loop has finished writing to it.

The sentence to carry: a closure is a live view of a scope, not a snapshot of it. If you want a snapshot, you have to create a binding to hold it, which is what a parameter, or a per-iteration let, does.`,
    explanation: `first, then first is the snapshot model, capturing the value at the moment the arrow was written. If that were true, closures could not hold shared state at all, and a counter and a reader from the same factory would disagree from the first call.

second, then second is the snapshot taken at the first call instead. That is what caching the read would do, and nothing here caches anything.

first, then second is that same snapshot one assignment behind: each call reporting what message held before the line immediately above it. It is the reading you get if an assignment is taken to apply from the call after next rather than straight away.`,
    hints: ['Does show hold the value of message, or the variable?'],
    tags: ['closure', 'scope'],
  },
  {
    id: 'scope-outlives-the-call-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `function setup() {
  const config = { retries: 3 }
  return () => config.retries
}

const getRetries = setup()
console.log(getRetries())`,
    options: [
      'undefined, because config was local to setup and setup has already returned',
      'ReferenceError: config is not defined',
      '3',
      'It prints 3 the first time and undefined on every call after that, because the captured scope is released once it has been read',
    ],
    correctOption: 2,
    answerInFull: `3. setup has returned and its scope is still there.

A local variable is normally unreachable once its function returns, and the engine is free to release it. What changes that is a function defined inside it surviving the return: the arrow holds a reference to the scope it was defined in, so for as long as getRetries exists, config does too.

That is the mechanism under every factory, every module pattern and every callback that "remembers" something. It is also the cost, and the two are the same fact: the scope stays alive as long as the closure does, which is why a small handler defined beside a large array keeps that array in memory.

Nothing here depends on the function being returned. A function passed to addEventListener, pushed onto an array or stored on an object keeps its scope alive the same way.`,
    explanation: `undefined is the stack frame model, where a function's locals vanish the moment it returns. That is true of a frame nothing captured, and this one was captured before the return.

The ReferenceError is the same belief stated harder. Names in the arrow resolve against the scope chain it captured, and that chain still has config in it. A ReferenceError needs a name no scope on the chain has.

The last option is an invented rule, and it is worth naming because it would make closures useless for anything called twice. A scope is released when nothing references it any more, which is what garbage collection means, and getRetries is a reference.`,
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'let-outside-the-loop-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Every handler this returns gives the last row id. The loop uses let, which is meant to be the fix for exactly this. What is wrong?',
    code: `function makeHandlers(rows) {
  const handlers = []
  let row

  for (row of rows) {
    handlers.push(() => row.id)
  }

  return handlers
}`,
    options: [
      'The arrows are all created from one line, so they share a single closure. Declaring a named function inside the loop body would give each handler its own',
      'for...of assigns rather than declares, so row is only bound once the loop has finished. Reading it inside the body gives the last value even while the loop is running',
      'row is declared above the loop, so there is one binding and every handler closes over it. The per-iteration binding is something the for header creates when it declares the variable, so move the declaration into the header: for (const row of rows)',
      'let is block scoped and the loop body is a block, so each handler already has its own row. The bug is in the caller, which is passing the same object several times',
    ],
    correctOption: 2,
    answerInFull: `let is not the fix. A binding per iteration is, and only a declaration in the for header creates one.

Here row is declared once, above the loop, and the header assigns to that single binding on each pass. All the handlers close over the same variable, and by the time any of them runs it is holding the last row.

  for (const row of rows) {
    handlers.push(() => row.id)
  }

Moving the declaration into the header gives each iteration its own row. const works because nothing reassigns it after the header has.

The rule worth carrying out of every version of this bug: the fix is always to arrange for there to be more than one variable. Which keyword you write is only how you ask for that.`,
    explanation: `Sharing a line is not sharing a scope. Each pass through the loop creates a new function object from that line, and a named function declared in the body would be a new one per pass too. What the handlers share is not the function, it is the variable.

The for...of option opens with something true, that the header assigns here rather than declaring, and then invents the rest. row holds each value in turn while the body runs, which is why the loop works at all. The values are right during the loop and wrong afterwards, and every handler runs afterwards.

The last option is the move to watch for in yourself: blaming the input. The loop body is a block, and a block is not where a per-iteration binding comes from. Run the same rows through the fixed version and the handlers give three different ids.`,
    hints: [
      'How many row variables does this function create?',
      'Which part of the loop makes a binding per iteration?',
    ],
    tags: ['closure', 'scope'],
  },
]
