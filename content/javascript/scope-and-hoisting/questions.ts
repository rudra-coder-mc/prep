import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-hoisting-means',
    type: 'concept',
    form: 'open',
    difficulty: 'easy',
    prompt: 'What does hoisting actually do, and how do var, let and function declarations differ?',
    answerInFull: `Nothing moves. Before any code in a scope runs, the engine registers every declaration in that scope. What differs is the value each one has between being registered and being reached.

- var is registered and initialised to undefined, so reading it early gives undefined.
- A function declaration is registered complete, so it can be called above its own definition.
- let, const and class are registered without a value. Reading one before its declaration throws a ReferenceError, and that gap is the temporal dead zone.

Assignments are never hoisted. Only the declaration is processed early.`,
    explanation: `The common phrasing, "declarations are moved to the top", predicts the var case correctly and everything else wrongly, which is why people are surprised by the TDZ. Registration rather than movement explains all four kinds with one rule.

It also explains why the TDZ exists. Undefined for a variable you have not reached yet is a bug that surfaces later somewhere else, while a ReferenceError names the variable and the line.`,
    hints: ['What does the engine know about a scope before it runs the first statement?'],
    tags: ['hoisting', 'declarations'],
  },
  {
    id: 'typeof-before-declaration-output',
    type: 'output',
    form: 'open',
    difficulty: 'medium',
    prompt: 'What does this print?',
    code: `function report() {
  console.log(typeof count)
  console.log(typeof format)
  var count = 1
  function format() {}
}

report()`,
    answerInFull: `undefined
function`,
    explanation: `Both declarations are registered before the first line runs, but they are worth different things at that point. var count exists and holds undefined, so typeof reports 'undefined'. The function declaration is registered complete, so it is already callable.

Adding a third line with a let above its declaration would not print anything. It would throw, because typeof does not protect a read inside the temporal dead zone.`,
    hints: ['Are all three kinds of declaration registered with the same value?'],
    tags: ['hoisting'],
  },
  {
    id: 'shadowed-var-output',
    type: 'output',
    form: 'open',
    difficulty: 'hard',
    prompt: 'What does this print?',
    code: `var total = 10

function show() {
  console.log(total)
  var total = 20
}

show()`,
    answerInFull: 'undefined',
    explanation: `The var inside show declares a function-scoped total for the whole function body, initialised to undefined before the first line. The log resolves total in the nearest scope that has it, which is show's own, so the outer 10 is never reached.

Deleting the inner declaration prints 10. Changing it to let throws a ReferenceError instead, which is the more useful failure. It says the variable is being read too early rather than quietly handing over undefined.`,
    hints: ['Which scope does the name total resolve to inside show?'],
    tags: ['hoisting', 'scope'],
  },
  {
    id: 'tdz-reference-error',
    type: 'debugging',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'This throws "ReferenceError: Cannot access \'fallback\' before initialization" whenever the list is empty. Explain why, and give two fixes.',
    code: `function render(items) {
  if (items.length === 0) return fallback

  const fallback = '<p>Nothing yet</p>'
  return items.map((item) => \`<li>\${item}</li>\`).join('')
}`,
    answerInFull: `const fallback is registered for the whole function body but has no value until its line runs. The early return reads it inside that gap, the temporal dead zone, so it throws rather than giving undefined.

Fix one: move the declaration above the guard, so it is initialised before anything can read it.

Fix two: do not use the binding at all in the early return, and return the literal directly.

The second is better here, because a constant used in one branch does not need to exist for the whole function.`,
    explanation: `Worth noticing that the error only happens on the empty path, so a test suite that only covers the populated case never sees it. That is the general shape of TDZ bugs: they hide in the branch that runs least.

If fallback had been declared with var, this would have returned undefined instead and rendered nothing, with no error to point at the cause.`,
    hints: ['When does a const actually get its value?'],
    tags: ['hoisting', 'declarations'],
  },
  {
    id: 'module-pattern-scope',
    type: 'coding',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'Using a block and a const, expose only increment and read from a counter, keeping its state unreachable from the surrounding scope. Then say why doing the same with var at the top level would not be equivalent.',
    answerInFull: `let increment
let read

{
  let count = 0
  increment = () => ++count
  read = () => count
}

With var count at the top level instead, the state is not private at all. Any code in the file can read or reassign it, and at the top level of a script it also becomes a property on globalThis, so other scripts can reach it too. var ignores the block entirely, so wrapping it in braces changes nothing.`,
    explanation: `This is the block-scoped version of the module pattern, and the interesting part is that privacy here comes from the scope, not from any privacy feature. Nothing outside the block can name count, so nothing outside can touch it.

An IIFE achieves the same thing and was the only way to do it before let and const, which is why so much older code is wrapped in one.`,
    hints: [
      'Which declarations respect a bare block, and which ignore it?',
      'How do the two functions escape the block while the state does not?',
    ],
    tags: ['scope', 'declarations'],
  },
  {
    id: 'const-is-not-frozen',
    type: 'scenario',
    form: 'open',
    difficulty: 'medium',
    prompt:
      'A colleague says the shared config object cannot change because it is declared with const. Values in it are changing at runtime anyway. What do you tell them, and what would you actually do?',
    answerInFull: `const prevents reassigning the binding, not mutating the value. config = {...} throws; config.retries = 5 does not, and that is what is happening.

What I would do:
- Object.freeze the config, remembering it is shallow, so nested objects need freezing too if they matter.
- In strict code a write to a frozen object throws, which turns a silent bug into a loud one. In non-strict code it fails silently, which is worse than either.
- Better still, do not export a mutable shared object. Export a function that returns the value, or a copy, so there is nothing to mutate.`,
    explanation: `The distinction is binding versus value, and it is the same distinction that makes closures capture variables rather than snapshots. const is a statement about the name, and freezing is a statement about the object.

A deep freeze is easy to write recursively but is rarely the right answer at scale; not sharing a mutable object in the first place removes the problem instead of guarding it.`,
    hints: ['What exactly does const stop you doing?'],
    tags: ['declarations', 'objects'],
  },
  {
    id: 'var-let-const-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'easy',
    prompt: 'Explain the difference between var, let and const as you would in an interview.',
    answerInFull: `Three differences, in order of how often they matter:

- Scope. var is function scoped and ignores blocks. let and const are block scoped, so a declaration inside an if or a loop body does not escape it.
- Early access. var reads as undefined before its line. let and const throw a ReferenceError, because they sit in the temporal dead zone until their declaration runs.
- Reassignment. const cannot be reassigned, though the value it points at can still be mutated.

Two more if there is room: var allows redeclaring the same name in the same scope, and at the top level of a script var creates a property on globalThis while let and const do not.`,
    explanation: `The ordering is the answer as much as the content. Leading with scope shows you know which difference actually changes program behaviour most often, and holding the globalThis detail back as a follow-up reads as depth rather than as a list recited from a blog post.

The practical default worth stating at the end: const everywhere, let when the binding genuinely changes, var never in new code.`,
    hints: [],
    tags: ['declarations'],
  },
  {
    id: 'tdz-typeof-mcq',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What happens when this runs?',
    code: `console.log(typeof value)
let value = 1`,
    options: [
      "It prints 'undefined', because typeof never throws",
      "It prints 'number', because the declaration is hoisted with its value",
      'It throws a ReferenceError',
      'It throws a SyntaxError before anything runs',
    ],
    correctOption: 2,
    answerInFull:
      "A ReferenceError at runtime. let is registered without a value, and every read before its declaration throws, including typeof. The idea that typeof is always safe comes from undeclared names, where it does return 'undefined'. This name is declared, just not yet initialised.",
    hints: [],
    tags: ['hoisting'],
  },
  {
    id: 'function-expression-hoisting-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'Which of these can be called on the line above where it is written?',
    options: [
      'const f = function () {}',
      'function f() {}',
      'const f = () => {}',
      'let f = function f() {}',
    ],
    correctOption: 1,
    answerInFull:
      'Only the function declaration. It is registered complete before the scope runs. The other three are assignments to a variable: the binding is registered early, but the function is not created until the assignment runs, so calling it above throws. For the const and let forms that is a ReferenceError.',
    hints: [],
    tags: ['hoisting', 'functions'],
  },
  {
    id: 'global-property-mcq',
    type: 'concept',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A script at the top level declares var a = 1 and let b = 2. What is true of globalThis afterwards?',
    options: [
      'Both globalThis.a and globalThis.b are defined',
      'globalThis.a is 1 and globalThis.b is undefined',
      'Neither is defined; both live in a separate scope',
      'globalThis.b is 2 and globalThis.a is undefined',
    ],
    correctOption: 1,
    answerInFull:
      'var at the top level of a script creates a property on the global object; let and const create bindings in a separate global scope that the object cannot see. Neither appears in a module. An ES module has its own top-level scope, and Node wraps a CommonJS one in a function, which is why testing this in a file rather than a console shows nothing.',
    hints: [],
    tags: ['scope', 'declarations'],
  },
]
