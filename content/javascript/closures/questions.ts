import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-is-a-closure',
    type: 'concept',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What is a closure, and when is one created?',
    answerInFull: `A closure is a function together with the lexical environment it was defined in. Whenever a function is created it keeps a reference to the scope around it, so it can still read and write those variables after the outer function has returned.

The points to say out loud:
- It captures the variable itself, not a copy of its value.
- It is created at function definition time, not at call time.
- The captured scope stays alive as long as the closure does, which is why closures keep memory reachable.`,
    explanation: `People often describe a closure as "a function that remembers its variables", which is right but incomplete. The important consequence is that the binding is shared. If the outer variable changes, every closure over it sees the new value. That single fact explains most closure interview questions, including the classic setTimeout-in-a-loop puzzle.`,
    hints: ['Think about what a function needs to resolve a name that is not its own.'],
    tags: ['closure', 'scope'],
  },
  {
    id: 'counter-output',
    type: 'output',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What does this print, and why?',
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
    answerInFull: '1 2 1',
    explanation: `Each call to makeCounter creates a new execution context with its own count binding, so a and b close over different variables. a increments its own count twice, reaching 2, while b starts fresh at 1.

If they had shared a count, the answer would be 1 2 3, which is what you get if count is declared outside makeCounter.`,
    hints: ['How many times is makeCounter called, and what does each call create?'],
    tags: ['closure'],
  },
  {
    id: 'var-in-loop',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'This is meant to print 0, 1, 2. It prints 3, 3, 3. Explain why, and give two different fixes.',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}`,
    answerInFull: `var is function-scoped, so there is exactly one i shared by all three callbacks. The loop finishes before any timeout runs, leaving i at 3, and all three closures read that same binding.

Fix one: use let, which creates a fresh binding per iteration.

  for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0)

Fix two: capture the value in a new scope explicitly.

  for (var i = 0; i < 3; i++) {
    ;((captured) => setTimeout(() => console.log(captured), 0))(i)
  }`,
    explanation: `This is the single most common closure question in interviews, and the useful part of the answer is the distinction between capturing a variable and capturing a value. Closures always capture the variable. let works not because it is "block scoped" in the abstract, but because the specification creates a new binding for each iteration and copies the previous value into it.`,
    hints: [
      'How many i variables exist in total?',
      'When does the loop finish relative to the timeouts?',
    ],
    tags: ['closure', 'scope', 'event-loop'],
  },
  {
    id: 'private-state',
    type: 'coding',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'Write a function once(fn) that returns a wrapped function which calls fn at most one time and returns the first result on every later call.',
    answerInFull: `function once(fn) {
  let called = false
  let result

  return function (...args) {
    if (!called) {
      called = true
      result = fn.apply(this, args)
    }
    return result
  }
}`,
    explanation: `The closure holds two pieces of private state, called and result, that no caller can reach or corrupt. Using a separate called flag rather than checking whether result is undefined matters, because fn is allowed to return undefined legitimately.

Forwarding this with apply is what makes the wrapper safe to use as a method.`,
    hints: [
      'What state does the wrapper need to remember between calls?',
      'What if fn returns undefined?',
    ],
    tags: ['closure', 'functions'],
  },
  {
    id: 'loop-capture-fix-output',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `const fns = []
for (let i = 0; i < 3; i++) {
  fns.push(() => i)
}
console.log(fns.map((f) => f()))`,
    answerInFull: '[0, 1, 2]',
    explanation: `let gives each iteration its own binding of i, so each arrow function closes over a different variable. Replacing let with var would print [3, 3, 3], because all three would close over the one shared binding.`,
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'memory-retention',
    type: 'scenario',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'A colleague reports that a page slowly grows in memory. They are attaching event handlers created inside a function that also builds a large array. What would you look at?',
    answerInFull: `A closure keeps its entire enclosing scope reachable, not just the variables it happens to use. If the handler is defined in the same scope as the large array, that array cannot be collected while the handler is still attached.

Things to check and do:
- Whether handlers are removed when their elements are removed.
- Whether the large data is actually needed by the handler, or just happens to share a scope with it.
- Move the handler out of that scope, or null out the large reference once it is no longer needed.`,
    explanation: `Engines do optimise this. V8 will often drop variables a closure demonstrably never references. But you cannot rely on it, particularly when eval or a debugger statement is present, or when several closures share one scope and one of them does use the big variable. Sharing a scope is what couples their lifetimes.`,
    hints: ['What keeps the array reachable?'],
    tags: ['closure', 'performance'],
  },
  {
    id: 'module-pattern',
    type: 'interview',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'How do closures give you private state, and how does that compare with private class fields?',
    answerInFull: `A closure makes state private by construction: the variable lives in a scope nobody outside can name, so there is no syntax that reaches it. This is the module pattern: return an object of functions that all close over the same variables.

Compared with #private class fields:
- Closures allocate their state per instance created by the factory, and each function is a new object, so many instances cost more memory than prototype methods.
- Class private fields are enforced by the language, give better debugging and introspection, and share methods via the prototype.
- Closures are still the answer when you want a single instance or a function rather than an object.`,
    explanation: `The honest short version is that private fields are the better default in modern code, and closures remain the natural fit for factories, function wrappers such as once or throttle, and anything that returns a function rather than an object.`,
    hints: [],
    tags: ['closure', 'objects'],
  },
  {
    id: 'shared-scope',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
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
    answerInFull: '2',
    explanation: `Both functions close over the same value binding, so increment and read stay in sync. Destructuring read off the object does not break anything, because a closure captures its scope rather than its this. That is the practical difference between closure-based privacy and methods that depend on this. The latter would break here.`,
    hints: ['Does pulling read out of the object change what it can see?'],
    tags: ['closure', 'objects'],
  },
  {
    id: 'what-a-closure-captures-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does a closure actually capture?',
    options: [
      'The variable binding itself, so a later change to it is visible',
      'A copy of the value, taken when the function was defined',
      'A copy of the value, taken the first time the function runs',
      'A deep clone of every variable in the enclosing scope',
    ],
    correctOption: 0,
    answerInFull:
      'The binding, not the value. This is the single fact that explains almost every closure interview question: if the outer variable is reassigned, every closure over it sees the new value, because they all point at the same binding rather than at snapshots of it.',
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'var-loop-output-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0)
}`,
    options: ['3 3 3', '0 1 2', '0 0 0', 'Nothing, it throws a ReferenceError'],
    correctOption: 0,
    answerInFull:
      'var is function scoped, so all three callbacks close over one shared i. The loop finishes before any timeout runs, leaving i at 3. Swapping var for let creates a fresh binding per iteration and prints 0 1 2.',
    hints: [],
    tags: ['closure', 'scope'],
  },
  {
    id: 'when-closure-created-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'When is a closure created?',
    options: [
      'When the function is defined',
      'When the function is first called',
      'When the enclosing function returns',
      'Only when the inner function reads an outer variable',
    ],
    correctOption: 0,
    answerInFull:
      'At definition time. Every function keeps a reference to the scope it was created in, whether or not it ever uses it. The scope surviving after the outer function returns is a consequence of that reference, not the moment the closure comes into being.',
    hints: [],
    tags: ['closure'],
  },
]
