import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'what-hoisting-means',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does hoisting actually do?',
    options: [
      'Before any code in a scope runs, the engine registers every declaration in it. A var starts as undefined, a function declaration is complete, and let and const have no value until their line runs',
      'The engine moves every declaration, with its value, to the top of its scope before running it',
      'It applies to var and function declarations only. let and const are not hoisted, which is why reading one early throws',
      'The engine reorders the statements in a scope so that declarations run before the code that uses them',
    ],
    correctOption: 0,
    answerInFull: `Nothing moves. Before any code in a scope runs, the engine registers every declaration in that scope. What differs is the value each one has between being registered and being reached.

- var is registered and initialised to undefined, so reading it early gives undefined.
- A function declaration is registered complete, so it can be called above its own definition.
- let, const and class are registered without a value. Reading one before its declaration throws a ReferenceError, and that gap is the temporal dead zone.

Assignments are never hoisted. Only the declaration is processed early.`,
    explanation: `"Moved to the top with its value" is the phrasing most people learned, and it predicts the var case correctly and everything else wrongly. If the value moved too, var count = 1 would read as 1 early instead of undefined.

"let and const are not hoisted" is the usual explanation of the temporal dead zone, and it is the wrong one. If they were not registered, an outer variable of the same name would be visible until the declaration line; in fact the inner name shadows it for the whole block and throws, which is only possible if the engine knows about it from the start.

Reordering statements would be observable, and it is not. The registration rather than movement model is the one that explains all four kinds with one rule, and it also explains why the TDZ exists: undefined for a variable you have not reached yet is a bug that surfaces later somewhere else, while a ReferenceError names the variable and the line.`,
    hints: ['What does the engine know about a scope before it runs the first statement?'],
    tags: ['hoisting', 'declarations'],
  },
  {
    id: 'typeof-before-declaration-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `function report() {
  console.log(typeof count)
  console.log(typeof format)
  var count = 1
  function format() {}
}

report()`,
    options: [
      'undefined, then undefined',
      'number, then function',
      'undefined, then function',
      'It throws a ReferenceError on the first line',
    ],
    correctOption: 2,
    answerInFull: `undefined
function

Both declarations are registered before the first line runs, but they are worth different things at that point. var count exists and holds undefined, so typeof reports 'undefined'. The function declaration is registered complete, so it is already callable.

Adding a third line with a let above its declaration would not print anything. It would throw, because typeof does not protect a read inside the temporal dead zone.`,
    explanation: `undefined twice is the reader who has learned that hoisting means "the name exists but the value does not" and applies it to both kinds. That is exactly right for var and exactly wrong for a function declaration, which is the one kind that is hoisted complete.

number, then function is hoisting with the value, the textbook picture of declarations moved to the top. The declaration is processed early; the assignment of 1 is not.

The ReferenceError is the temporal dead zone applied to var, which never has one. Reading a var early is the quiet failure, not the loud one.`,
    hints: ['Are the two kinds of declaration registered with the same value?'],
    tags: ['hoisting'],
  },
  {
    id: 'function-then-var-order',
    type: 'output',
    form: 'ordering',
    tier: 'staff',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `console.log(greet())

function greet() {
  return 'early'
}

var greet = function () {
  return 'late'
}

console.log(greet())
console.log(typeof helper)
var helper = 1`,
    items: ['late', 'TypeError: greet is not a function', 'early', 'number', 'undefined'],
    correctOrder: [2, 0, 4],
    answerInFull: `early, late, undefined

Two declarations of greet are registered before the first line runs: the function declaration and the var. When a var and a function declaration share a name, the function wins the registration, so greet starts out callable and the first log prints early.

The var line is a declaration and an assignment. The declaration was processed early and changed nothing; the assignment runs in place, at the line where it is written, and replaces the function. The second log prints late.

helper is registered as undefined and is still undefined when typeof reads it, because its assignment has not run yet.`,
    explanation: `The TypeError is the reader who thinks var greet resets the name to undefined at registration, so the first call fails. Registration never overwrites a function declaration with undefined; the two hoist together and the function is the value the name starts with.

number is the other half of the same misreading, in the other direction: helper hoisted with its value. Only the declaration is processed early. The 1 arrives when its line does.

Note that the one misreading this pool cannot hold is early printed twice, which is what you get if you believe the assignment to a function-declared name is ignored. It is not. The declaration is ignored; the assignment runs.`,
    hints: [
      'Which of the two greet declarations is the name worth at the moment the first line runs?',
      'Which half of a var line is hoisted, the declaration or the assignment?',
    ],
    tags: ['hoisting', 'declarations', 'functions'],
  },
  {
    id: 'shadowed-var-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `var total = 10

function show() {
  console.log(total)
  var total = 20
}

show()`,
    options: ['10', 'It throws a ReferenceError', 'undefined', '20'],
    correctOption: 2,
    answerInFull: `undefined

The var inside show declares a function-scoped total for the whole function body, initialised to undefined before the first line. The log resolves total in the nearest scope that has it, which is show's own, so the outer 10 is never reached.

Deleting the inner declaration prints 10. Changing it to let throws a ReferenceError instead, which is the more useful failure. It says the variable is being read too early rather than quietly handing over undefined.`,
    explanation: `10 is the reader who resolves the name at the moment of the log and sees only the outer variable, because the inner declaration is "further down". Scope is decided for the whole function before it runs, not line by line, so the inner total shadows the outer one from the first statement.

20 is hoisting with the value. The declaration is hoisted; the assignment waits for its line.

The ReferenceError is the right answer to the let version of this question and the wrong one here. It is the tempting option for someone who has learned the temporal dead zone well and has started applying it to var, which never has one.`,
    hints: ['Which scope does the name total resolve to inside show?'],
    tags: ['hoisting', 'scope'],
  },
  {
    id: 'tdz-reference-error',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This throws "ReferenceError: Cannot access \'fallback\' before initialization" whenever the list is empty. Why?',
    code: `function render(items) {
  if (items.length === 0) return fallback

  const fallback = '<p>Nothing yet</p>'
  return items.map((item) => \`<li>\${item}</li>\`).join('')
}`,
    options: [
      'The declaration sits below the return, so the name does not exist yet when the guard runs. Declaring it with var would throw the same error',
      'const fallback is registered for the whole function body but has no value until its line runs. The early return reads it inside that gap',
      'The if statement has its own block scope, and a const declared outside a block cannot be reached from inside it',
      'The arrow function on the last line closes over fallback, and a closed-over const cannot be read until the function that created it has returned',
    ],
    correctOption: 1,
    answerInFull: `const fallback is registered for the whole function body but has no value until its line runs. The early return reads it inside that gap, the temporal dead zone, so it throws rather than giving undefined.

Fix one: move the declaration above the guard, so it is initialised before anything can read it.

Fix two: do not use the binding at all in the early return, and return the literal directly.

The second is better here, because a constant used in one branch does not need to exist for the whole function.

Worth noticing that the error only happens on the empty path, so a test suite that only covers the populated case never sees it. That is the general shape of TDZ bugs: they hide in the branch that runs least.`,
    explanation: `"The name does not exist yet" is the reading-order model, and the error message contradicts it. An undeclared name throws "fallback is not defined"; "cannot access before initialization" means the engine knows the name and is refusing to hand over its value. And var would not throw at all: this function would return undefined on the empty path and render nothing, with no error to point at the cause.

The block scope option has the rule backwards. Blocks see the scope around them; it is the scope around a block that cannot see in.

The closure option is invented. Closures read a variable whenever they run, and the arrow on the last line never runs on the empty path anyway, because the function has already returned.`,
    hints: ['When does a const actually get its value?'],
    tags: ['hoisting', 'declarations'],
  },
  {
    id: 'module-pattern-scope',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'You want a counter whose state cannot be read or reassigned by any code in the surrounding scope, exposing only increment and read. Which of these does it?',
    options: [
      'let increment, read\n{\n  var count = 0\n  increment = () => ++count\n  read = () => count\n}',
      'const count = 0\nconst increment = () => count + 1\nconst read = () => count',
      'const counter = { count: 0 }\nconst increment = () => ++counter.count\nconst read = () => counter.count',
      'let increment, read\n{\n  let count = 0\n  increment = () => ++count\n  read = () => count\n}',
    ],
    correctOption: 3,
    answerInFull: `let increment
let read

{
  let count = 0
  increment = () => ++count
  read = () => count
}

Nothing outside the block can name count, so nothing outside can touch it. The two functions escape the block because they are assigned to bindings declared outside it, and they keep access to count because they close over it.

This is the block-scoped version of the module pattern, and the interesting part is that privacy here comes from the scope, not from any privacy feature. An IIFE achieves the same thing and was the only way to do it before let and const, which is why so much older code is wrapped in one.

With var count instead, the state is not private at all. var ignores the block entirely, so wrapping it in braces changes nothing: any code in the file can read or reassign it, and at the top level of a script it also becomes a property on globalThis.`,
    explanation: `The var version is the same code with one word changed, and the word is the whole question. var is function scoped and does not see a bare block, so count is declared in the surrounding scope as if the braces were not there.

The const count version is the belief that const means protected. The surrounding scope can read count directly, and increment does not even work: const cannot be reassigned, so it returns count + 1 without ever changing anything.

The object version hides nothing. counter is in the surrounding scope and count is a plain property on it, so counter.count = 99 from anywhere in the file is a single line.`,
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
    tier: 'senior',
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
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'An interviewer asks for the difference between var, let and const. Which answer is correct?',
    options: [
      'var is function scoped and reads as undefined before its line. let and const are block scoped and throw before their line. const also cannot be reassigned, though its value can still be mutated',
      'var is hoisted and let and const are not. Apart from that they behave the same, and const additionally makes its value immutable',
      'All three are block scoped. var can be redeclared in the same scope, let cannot, and const cannot be reassigned either',
      'let and const are the modern spellings of var. The engine treats them identically, and the difference is a lint rule about reassignment',
    ],
    correctOption: 0,
    answerInFull: `Three differences, in order of how often they matter:

- Scope. var is function scoped and ignores blocks. let and const are block scoped, so a declaration inside an if or a loop body does not escape it.
- Early access. var reads as undefined before its line. let and const throw a ReferenceError, because they sit in the temporal dead zone until their declaration runs.
- Reassignment. const cannot be reassigned, though the value it points at can still be mutated.

Two more if there is room: var allows redeclaring the same name in the same scope, and at the top level of a script var creates a property on globalThis while let and const do not.

The ordering is the answer as much as the content. Leading with scope shows you know which difference actually changes program behaviour most often. The practical default worth stating at the end: const everywhere, let when the binding genuinely changes, var never in new code.`,
    explanation: `"let and const are not hoisted" is the most common wrong answer in interviews, and it comes with "const is immutable" attached, which is the second most common. All three are registered before the scope runs; the difference is whether the name has a value in the gap. And const freezes the binding, not the object it points at.

"All three are block scoped" is the one to watch for in someone who has only ever written let and const. It is the right picture of the two modern declarations applied to the old one, and var ignoring blocks is the difference that most often changes what a program does.

The lint rule answer gives away that the temporal dead zone and block scoping are both unknown, since either one is an observable change in behaviour rather than a style preference.`,
    hints: [],
    tags: ['declarations'],
  },
  {
    id: 'tdz-typeof-choice',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
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
    answerInFull: `A ReferenceError at runtime: Cannot access 'value' before initialization.

let value is registered before the first line runs, but without a value, and every read before its declaration line throws. typeof is a read like any other. It does not get a special exemption inside the temporal dead zone.

The idea that typeof is always safe comes from undeclared names, where it does return 'undefined' rather than throwing. That is the one place it is lenient. This name is declared, just not yet initialised, and the engine knows the difference.`,
    explanation: `'undefined' is the typeof guard reflex, learned from checking whether a global exists. It is the tempting answer because it is true of a name that was never declared at all.

'number' is hoisting with the value, which no declaration does.

The SyntaxError is the belief that reading before declaring is something the parser can reject. It cannot, because whether a read lands in the temporal dead zone depends on when the line runs, not where it is written: a function declared above the let and called below it reads the value fine.`,
    hints: [],
    tags: ['hoisting'],
  },
  {
    id: 'function-expression-hoisting-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Which of these can be called on the line above where it is written?',
    options: [
      'const f = function () {}',
      'function f() {}',
      'const f = () => {}',
      'let f = function f() {}',
    ],
    correctOption: 1,
    answerInFull: `Only the function declaration. It is registered complete before the scope runs, so it can be called from a line above its own definition.

The other three are assignments to a variable. The binding is registered early, but the function on the right hand side is not created until the assignment runs, so the call above it fails. With const and let it fails with a ReferenceError, because the binding is in the temporal dead zone. With var it would fail with a TypeError instead, because the binding exists and holds undefined, and undefined is not a function.

That difference in error is the practical tell. "f is not a function" above a var means the assignment has not run yet; "cannot access f before initialization" means the same thing about a let or const.`,
    explanation: `The named function expression, let f = function f() {}, is the one written to tempt. The name on the right is a function declaration's syntax, and that name is indeed bound inside the function's own body. Outside it, f is only the let, and the let is in the temporal dead zone until its line runs.

The arrow is the same as the anonymous function expression with shorter syntax, and neither is hoisted any further than the const binding that holds it.`,
    hints: [],
    tags: ['hoisting', 'functions'],
  },
  {
    id: 'global-property-choice',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt:
      'A script at the top level declares var a = 1 and let b = 2. What is true of globalThis afterwards?',
    options: [
      'Both globalThis.a and globalThis.b are defined',
      'globalThis.a is 1 and globalThis.b is undefined',
      'Neither is defined; both live in a separate scope',
      'globalThis.b is 2 and globalThis.a is undefined',
    ],
    correctOption: 1,
    answerInFull: `globalThis.a is 1 and globalThis.b is undefined.

var at the top level of a script creates a property on the global object. let and const create bindings in a separate global scope that the object cannot see, so b is a global variable, reachable by name from anywhere, but not a property of anything.

Neither appears in a module. An ES module has its own top-level scope, and Node wraps a CommonJS one in a function, so in both a top-level var is local to the file. That is why testing this in a file rather than a browser console shows nothing at all, and why the question says a script.`,
    explanation: `Both defined is the reader who knows top-level declarations are global and has not separated "global" from "a property of the global object". The two were the same thing until let and const arrived.

Neither defined is the module answer, and it is correct for a module. The question is about a classic script, where var still does what it always did.

The last option has the two reversed, which is the wrong guess of someone who remembers there is an asymmetry but not which way it goes. The mnemonic is that var is the old behaviour, and the old behaviour put everything on window.`,
    hints: [],
    tags: ['scope', 'declarations'],
  },
]
