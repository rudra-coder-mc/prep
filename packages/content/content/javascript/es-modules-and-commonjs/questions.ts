import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'live-binding-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does an ES module importer actually receive from a named export?',
    options: [
      'A property on a shared namespace object it may reassign',
      'A copy of the value taken when the module finished evaluating',
      'A live, read only binding onto the exporting module variable, so later changes are visible',
      'A getter function it has to call to read the current value',
    ],
    correctOption: 2,
    answerInFull: `A live binding. The importer sees whatever the exporting module variable holds right now, and cannot assign to it.

    // counter.mjs
    export let count = 0
    export const bump = () => count++

    // app.mjs
    import { count, bump } from './counter.mjs'
    bump()
    count // 1

The two halves are worth saying separately. Live means reads go to the exporter, so a value that changes after evaluation is visible without any getter. Read only means the importer assigning to count is a TypeError: exactly one module owns the binding.

Compare with CommonJS, where require hands back whatever module.exports pointed at when the module finished. Destructure it and you have copies, and a later reassignment in the module never reaches you.

The practical payoff is that a module can export mutable state honestly, and that circular imports between functions work: the binding exists before the value does.`,
    explanation: `A copy is the CommonJS answer, and it is the reason destructuring a require is a trap and destructuring an import is not.

Calling a getter is how bundlers implement the namespace object underneath, but that is emitted code. The language gives you a binding you read like any other variable.

Reassigning is what the read only half forbids. A namespace object exists, and its properties are non-writable, so pushing state back through an import is not a thing you can do.`,
    hints: [],
    tags: ['modules', 'esm'],
  },
  {
    id: 'destructured-require-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'A CommonJS file. What does it print?',
    code: `// state.cjs
let count = 0
module.exports = { count, bump: () => count++ }

// app.cjs
const { count, bump } = require('./state.cjs')
bump()
bump()
console.log(count)`,
    options: [
      '0, because the number was copied into the exports object at evaluation, and destructured out of it again',
      'undefined, since count was captured before it was assigned',
      'It throws: count is const and bump reassigns it',
      '2, because require returns a live view of the module',
    ],
    correctOption: 0,
    answerInFull: `0. Two copies happen, and neither is undone by calling bump.

The first is in the module: { count } copies the number 0 into the exports object. The second is in the importer: destructuring pulls that number into a new const. The module variable count now has nothing to do with either.

bump increments the module variable, so the module itself sees 2. The importer sees the number it copied twice over.

    // the shape that works
    const state = require('./state.cjs')
    state.bump()
    state.count // reads the property now, not then

That only works if the module mutates the exported object rather than reassigning module.exports, which is the same discipline in reverse. This is where the advice not to destructure a require comes from, and it applies exactly when the module has mutable state. For a module exporting functions, destructuring is fine.

The ES module version of this file prints 2, because imports are bindings rather than values.`,
    explanation: `2 is what the same code prints with import instead of require, which is precisely the difference being tested.

undefined would need count to be read before its declaration. It is initialised on the line above; the value copied is 0, not nothing.

Nothing throws. const stops the importer reassigning its own binding, and bump never touches that binding, only the module variable.`,
    hints: ['How many times is the number copied before console.log sees it?'],
    tags: ['modules', 'commonjs'],
  },
  {
    id: 'import-in-block-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'This module fails to load at all, before anything runs. Why?',
    code: `if (process.env.NODE_ENV === 'development') {
  import { inspect } from './devtools.js'
  inspect()
}`,
    options: [
      'The condition runs before imports are hoisted, so inspect is in the temporal dead zone',
      'process.env is not available in a module, so the condition throws',
      'devtools.js is missing an export called inspect, which is a link time error',
      'import declarations cannot be nested in a block or a condition, so this is a SyntaxError; conditional loading needs import()',
    ],
    correctOption: 3,
    answerInFull: `An import declaration may only appear at the top level of a module. Inside an if, it does not parse, so the file fails before evaluation.

The restriction is the point rather than an oversight. The whole import graph has to be knowable without running the code, which is what allows every dependency to be fetched in parallel, names to be checked at link time, and unused exports to be dropped by a bundler.

When a decision genuinely has to be made at run time, the dynamic form exists:

    if (process.env.NODE_ENV === 'development') {
      const { inspect } = await import('./devtools.js')
      inspect()
    }

That is an operator, not a declaration. It returns a promise for the namespace object, it takes any expression as a specifier, and it can sit anywhere.

Worth knowing what the two forms cost. The static import is loaded whether or not you use it; the dynamic one is a separate chunk and a promise you have to wait for. Bundle splitting is the usual reason to reach for it.`,
    explanation: `A missing export is a real link time error, and it names the export. This file never gets that far, because it does not parse.

Imports do hoist, but hoisting is not the problem: the syntax is rejected wherever the declaration is nested, condition or not.

process.env is Node, not the module system, and it works fine in a module. Reaching for it as the explanation is a good sign of pattern matching on the word process rather than reading the error.`,
    hints: ['Where is an import declaration allowed to appear?'],
    tags: ['modules', 'esm', 'debugging'],
  },
  {
    id: 'module-evaluation-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'swe-2',
    prompt: 'Two ES modules. Put the lines this prints in the order it prints them.',
    code: `// counter.mjs
console.log('counter evaluated')
export let count = 0
export function bump() {
  count++
}

// app.mjs
console.log('app body')
import { count, bump } from './counter.mjs'
bump()
console.log('count is ' + count)`,
    items: [
      'count is 0',
      'counter evaluated',
      'app body',
      'count is undefined',
      'count is 1',
      'count is 2',
    ],
    correctOrder: [1, 2, 4],
    answerInFull: `counter evaluated, app body, count is 1.

Two rules, one line each.

Imports are hoisted, so the console.log written above the import is not the first thing to run. The whole dependency graph is evaluated before any of the importing module body, which is why counter.mjs prints first even though its import appears on the second line of app.mjs.

The import is a live binding rather than a copy, so reading count after bump() gives 1. The value is read from counter.mjs at the moment of the read.

    // the CommonJS version of the same file
    console.log('app body') // prints first
    const { count, bump } = require('./counter.cjs')
    bump()
    console.log('count is ' + count) // 0

Both differences flip. require runs where it is written, so app body comes first, and destructuring copies the number, so the count never moves. Being able to say which of the two behaviours you are looking at, from the output alone, is the whole point of the question.`,
    explanation: `"count is 0" is the CommonJS answer: the value copied out of the exports object, unaffected by anything bump does afterwards.

"count is undefined" is what you would expect if the binding existed but had not been initialised, which is the cycle case rather than this one. Here counter.mjs has fully evaluated before app.mjs starts.

Putting "app body" first is the trap that catches most people. It is the first line of the file you are looking at, and it is not the first line to run, because every import is evaluated before the module body.`,
    hints: [
      'Which module body runs first, and why is it not the one you are reading?',
      'Does the importer hold the number, or a view of the exporter binding?',
    ],
    tags: ['modules', 'esm'],
  },
  {
    id: 'static-structure-concept',
    type: 'concept',
    form: 'choice',
    tier: 'senior',
    prompt:
      'Why does the specification force import specifiers to be string literals at the top level of a module?',
    options: [
      'To keep parsing fast, since a computed specifier would need the expression evaluated at parse time',
      'So the whole dependency graph can be known without running the code, which is what allows parallel fetching, link time name checks and tree shaking',
      'Because the browser cannot fetch a module whose path is computed',
      'To stop developers loading modules conditionally, which was considered bad practice',
    ],
    correctOption: 1,
    answerInFull: `Because a statically analysable graph is worth more than the flexibility it costs.

Three concrete things depend on it. The loader can read a module's imports and fetch every one of them in parallel, before evaluating anything, which is what makes loading over a network viable. The linker can check that every imported name is actually exported, so a typo fails before either module runs rather than as undefined halfway through. And a bundler can prove an export is never used and drop it, which is what tree shaking is.

None of those are possible with require, because require is a function call and its argument can be anything. That is the trade: CommonJS bought run time flexibility and gave up everything that needs the graph in advance.

The flexibility came back deliberately and separately, as import(). It is dynamic on purpose, it returns a promise, and a bundler treats it as a split point rather than as something it can analyse away.`,
    explanation: `Parse speed is not the argument. A computed specifier parses fine; what it cannot do is be resolved before evaluation.

Browsers fetch computed paths all the time, which is exactly what import() does. The constraint is about when the graph is known, not about what a fetch can take.

Discouraging a practice is never how the language works here. Conditional loading is supported, through a form designed for it.`,
    hints: ['What can a tool do with a program it has not run?'],
    tags: ['modules', 'esm'],
  },
  {
    id: 'dynamic-import-shape-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A charting library is 300kB and only some users open the chart. You load it on demand with import(). Which use is correct?',
    options: [
      'const chart = await import("./chart.js"); chart(data) — the promise resolves to the default export',
      'const { default: chart } = await import("./chart.js"); chart(data) — the promise resolves to the namespace object, whose default export is .default',
      'const chart = import("./chart.js"); chart.render(data) — import() returns the module synchronously once it is cached',
      'import chart from await "./chart.js" — awaiting the specifier defers the load',
    ],
    correctOption: 1,
    answerInFull: `import() resolves to the module namespace object, never to a single export. The default export is the .default property of it:

    const { default: chart, palette } = await import('./chart.js')

Named exports come off the same object, which is the tidy part: one await gives you everything the module exports.

Two things worth adding unprompted. Call it once and hold the promise, or call it behind a guard, because a second import of an already loaded module resolves immediately from the registry but still costs a promise and a microtask. And put the call where the user has already committed to the feature, not on hover of everything, or the split has bought you nothing.

Errors deserve a word too. A failed dynamic import rejects, and it rejects for reasons a static import cannot have: a network failure, a chunk removed by a deploy while the page was open. Catching it and showing a retry is the difference between a feature that fails and a page that breaks.`,
    explanation: `Treating the resolved value as the default export is the single most common mistake with import(), and it fails as "chart is not a function" rather than as anything that names the cause.

import() without await gives you a promise, and a promise never turns into the module by being cached. The registry makes the resolution immediate, not synchronous.

The last option is not syntax. import declarations take a literal, and awaiting a string produces a string.`,
    hints: ['What exactly does the promise from import() resolve to?'],
    tags: ['modules', 'esm', 'coding'],
  },
  {
    id: 'cycle-tdz-output',
    type: 'output',
    form: 'choice',
    tier: 'staff',
    prompt: 'Two ES modules import each other. Running a.mjs, what happens?',
    code: `// a.mjs
import { b } from './b.mjs'
export const a = 'a'
console.log('a sees', b)

// b.mjs
import { a } from './a.mjs'
export const b = 'b'
console.log('b sees', a)`,
    options: [
      'It prints "a sees b" then "b sees a" — the loader orders the cycle so both are initialised',
      'It prints "b sees undefined" then "a sees b" — cyclic imports resolve to undefined until initialised',
      'It throws a ReferenceError from b.mjs: a is in the temporal dead zone, because a.mjs has not evaluated yet',
      'It hangs: the loader waits for each module to finish before evaluating the other',
    ],
    correctOption: 2,
    answerInFull: `A ReferenceError from b.mjs, saying a cannot be accessed before initialization.

The loader hoists and links the whole graph first, so both modules exist and both bindings exist before any evaluation. What the bindings do not have yet is values. Evaluation starts at a.mjs, immediately goes into b.mjs to satisfy its import, and b.mjs runs its log while a.mjs is still paused on line one. The a binding is in its temporal dead zone, and reading it throws.

    // this cycle is fine
    // a.mjs
    import { b } from './b.mjs'
    export function a() {}
    console.log(b())

Function declarations are hoisted and initialised before evaluation, so a cycle between functions usually works, which is why cycles survive in real codebases without anyone noticing them.

The CommonJS equivalent does not throw. It hands b.cjs a partially populated exports object, so it logs undefined and carries on, and the failure shows up somewhere else. Throwing at the read, naming the binding, is the better of the two bad outcomes.

The real fix is neither: break the cycle, usually by moving the shared thing into a third module.`,
    explanation: `undefined is the CommonJS behaviour, and the reason people expect it here. Modules replaced silence with an error deliberately.

Nothing hangs. A cycle is detected during linking, and evaluation proceeds through it rather than waiting.

There is no ordering that makes both work. Something has to run first, and in a genuine cycle that means one module reads a binding the other has not initialised.`,
    hints: ['Which module body runs first, and what has the other one done by then?'],
    tags: ['modules', 'esm', 'cycles'],
  },
  {
    id: 'interop-named-imports-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Migrating a service to ES modules, one dependency breaks: import { parse } from "old-cjs-lib" throws at load, while the package works fine under require. What is going on, and what do you do?',
    options: [
      'Named imports from CommonJS are never supported; every import of a CommonJS package must be a default import',
      'The import needs the .js extension added, which is what the loader is complaining about',
      'The package is broken and has to be republished as a module before it can be used',
      'Node detects named exports from CommonJS by analysing the source, and cannot see exports built dynamically; import the default and destructure from it',
    ],
    correctOption: 3,
    answerInFull: `A CommonJS module has no export list. Node reconstructs one by statically analysing the file for the assignment patterns it recognises, and a package that builds its exports in a loop, or reassigns module.exports from a variable, defeats that. The default export always works, because that is module.exports itself:

    import lib from 'old-cjs-lib'
    const { parse } = lib

That is why the default-import-then-destructure form is the safe one across an interop boundary, and why the failure is at load rather than at the call: the named import is checked while linking.

The thing to say next is that this is a static analysis limit rather than a bug in either side. It is worth reporting to the package, since adding a named export shape is usually a one line change, and worth not blocking on.

Do not reach for createRequire unless you need it. It works, and it hides the fact that you are importing CommonJS, which is information the next person wants.`,
    explanation: `Republishing is somebody else's timeline, and the default import works today. Blocking a migration on a dependency's release cycle is the wrong call when a one line workaround exists.

Named imports from CommonJS do work when the analysis succeeds, which is the majority of packages. Saying they never work over-corrects and would make interop far more painful than it is.

The extension rule is real for relative paths in Node modules and irrelevant to a bare package specifier, which is resolved through package.json.`,
    hints: ['Where does the export list of a CommonJS module come from?'],
    tags: ['modules', 'interop', 'scenario'],
  },
  {
    id: 'top-level-await-concept',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A module uses await at its top level. What does that do to the modules that import it?',
    options: [
      'Nothing: the await only pauses the module itself, and importers see its exports immediately',
      'They wait for it to finish before their own bodies evaluate, so one asynchronous module makes its dependents asynchronous too',
      'They receive a promise for each of its exports and have to await them individually',
      'It is a syntax error unless every importer also uses top level await',
    ],
    correctOption: 1,
    answerInFull: `Top level await makes the module itself asynchronous, and that propagates upward. Everything that imports it, directly or through a chain, evaluates only after it settles.

    // config.mjs
    export const config = await loadConfig()

    // app.mjs
    import { config } from './config.mjs'
    // this body does not run until loadConfig() resolves

That is exactly what you want for a module whose exports are not knowable synchronously, and it is a real cost to be deliberate about: one slow module at the bottom of a graph delays every module above it, and an await that never settles keeps the application from starting at all with no error to look at.

The other consequence is interop. A module graph containing top level await cannot be loaded synchronously, which is the case where require of an ES module still fails in Node while ordinary module graphs now load.

The alternative is exporting a promise, or an init function, and letting the caller decide when to wait. That keeps evaluation fast and moves the waiting to where it is visible.`,
    explanation: `"Nothing" would make the feature unsound: importers could read exports the module has not assigned yet. The propagation is what keeps the guarantee that a module body sees its imports initialised.

Per-export promises would be a plausible design and are not this one. The module is the unit of asynchrony, not the export.

No importer has to do anything. It is not a syntax error anywhere in a module, and importing an asynchronous module needs no special syntax at all, which is the part that makes the delay easy to miss.`,
    hints: ['What does a module body assume about its imports?'],
    tags: ['modules', 'esm', 'async'],
  },
  {
    id: 'exports-reassignment-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'This CommonJS module exports nothing: require of it returns an empty object. What is wrong?',
    code: `function parse(input) {
  return JSON.parse(input)
}

exports = { parse }`,
    options: [
      'The function declaration is hoisted above the assignment, so the object holds undefined',
      'exports has to be assigned before the functions it names are declared',
      'exports is a local parameter pointing at module.exports; reassigning it only rebinds the local, so module.exports is untouched',
      'A CommonJS file may only export with module.exports.default',
    ],
    correctOption: 2,
    answerInFull: `Node wraps every CommonJS file in a function, and exports is one of its parameters, initialised to the same object module.exports points at. Reassigning the parameter points the local name at a new object and leaves module.exports exactly where it was: empty.

Two forms work, for the same reason:

    exports.parse = parse // mutates the shared object
    module.exports = { parse } // replaces what the module actually exports

The rule underneath is the one from values and references. exports is a second reference to an object; mutating through it is visible everywhere, rebinding it is visible only locally.

Mixing the two is the version that bites in real code: a file that sets several properties on exports and then assigns module.exports at the bottom silently discards everything above.

ES modules have no equivalent mistake, because export is a declaration rather than an assignment to an object anyone can rebind.`,
    explanation: `Order of declaration is not the issue. Function declarations hoist, and the object would be built correctly whichever order they were in.

There is no default export in CommonJS. The .default property is a convention interop introduced, and it is not required to export anything.

Hoisting works in this file's favour, not against it: parse is initialised before the assignment runs, so the object would hold the function if the assignment reached module.exports at all.`,
    hints: ['What is exports, exactly, inside a CommonJS file?'],
    tags: ['modules', 'commonjs', 'debugging'],
  },
  {
    id: 'which-system-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'Walk me through the differences between ES modules and CommonJS, and how you would decide what a new library should publish.',
    answerInFull: `- Resolution. Modules are parsed, resolved and linked before any evaluation; require resolves when the call runs. Everything else follows from that.
- What crosses the boundary. Modules export live, read only bindings, so a value that changes later is visible to importers. require hands back the value module.exports held when the module finished, so destructuring it copies.
- Loading. Modules load asynchronously and support top level await, which makes the module and everything above it asynchronous. require is synchronous, which is why it cannot load a module graph that awaits.
- The environment. Modules are always strict, have their own scope with undefined as top level this, and use import.meta.url in place of __dirname. CommonJS is sloppy by default with module.exports as this.
- Cycles. CommonJS gives a half filled exports object and fails later as undefined. Modules throw a temporal dead zone error at the read, unless the cycle is between hoisted functions, which usually works.
- Conditional loading. import() in both, returning a promise for the namespace object, with the default export under .default.

For a new library, publish ES modules and target the runtimes that matter. If consumers are on Node and some of them still use require, ship both builds through the exports field with conditions, keep them behaviourally identical, and be aware of the dual package hazard: two copies of the same module in one process, each with its own state, which breaks instanceof and any singleton the package holds. Keeping state out of the package, or putting it on a well named global, is how that is avoided when it matters.

The judgement worth showing is that this is a distribution question rather than an authoring one. Source is written as modules either way, and the build decides what the package offers.`,
    explanation: `The tell of a good answer is starting from resolution and deriving the rest, rather than listing syntax differences. Live bindings, tree shaking, conditional loading and the cycle behaviour all come from the same root.

The dual package hazard is the senior-shaped part. Anyone can say ship both; noticing what two copies of a module in one process does to state and to instanceof is what distinguishes an answer from a recital.`,
    hints: [],
    tags: ['modules', 'design'],
  },
  {
    id: 'default-vs-named-import-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Node refuses to start: SyntaxError, the requested module ./api.js does not provide an export named fetchUser. The function is right there. Why?',
    code: `// api.js
export default function fetchUser(id) {
  return fetch('/users/' + id)
}

// app.js
import { fetchUser } from './api.js'`,
    options: [
      'A default export cannot be a function declaration, so nothing is exported at all',
      'The importing file has to use the same name the module used, and this module exported anonymously',
      'The braces ask for a named export called fetchUser, and this module has a default export instead',
      'The module has to be imported before it can be destructured, so this needs an import line and then a const',
    ],
    correctOption: 2,
    answerInFull: `The braces are the problem. Asking for a name in braces asks for a named export, and this module has exactly one export, the default one. The name after the function keyword is local to api.js and is not part of what it exports.

    import fetchUser from './api.js'

Without braces you are asking for the default, and the name is yours to pick. Importing it as getUser works identically, which is also why a default export gives you no help keeping a name consistent across a codebase.

Two things make the error easier to read next time. It is a SyntaxError raised while linking, before a line of either file has run, which is why a typo in a named import fails immediately rather than turning up as undefined later. And it names both the module and the export, so it is telling you exactly which of the two files to open.

Mixing the forms on one line is allowed, and is what you see from a library with one main thing and some extras:

    import fetchUser, { BASE_URL } from './api.js'`,
    explanation: `A default export takes any expression after it, including a function declaration, a class or an object literal. This module exports perfectly well. The importer is asking it for something else.

The name-matching option has the right instinct pointed at the wrong export. A named import really does have to match the exported name exactly, which is what the braces mean, and a default export has no name to match.

Reading the braces as destructuring is the most understandable answer, because the two look identical. Destructuring reads properties off a value while the program runs; an import list is checked against the module's exports before anything runs at all.`,
    hints: ['What do the braces in an import actually ask for?'],
    tags: ['modules', 'esm', 'debugging'],
  },
  {
    id: 'what-makes-a-file-a-module-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'Node has to decide whether a .js file is an ES module or CommonJS. What decides it?',
    options: [
      'Whether the file uses import and export, or require and module.exports',
      'The type field of the nearest package.json, with a .mjs or .cjs extension overriding it per file',
      'Whether the file was loaded by import() or by require()',
      'Every file is an ES module now, unless it sits inside node_modules',
    ],
    correctOption: 1,
    answerInFull: `The nearest package.json. A type of module makes every .js file under it an ES module, a type of commonjs or no field at all leaves them as CommonJS, and the .mjs and .cjs extensions state it per file and win over the field.

The decision is made before the file is parsed, which is why getting it wrong is a syntax error rather than anything that mentions modules:

    SyntaxError: Cannot use import statement outside a module

That message means Node parsed the file as CommonJS, where import is not valid syntax. The fix is to change the classification, by adding the type field or renaming the file, rather than to change the import.

Recent versions of Node soften this. A file with no classification either way that fails to parse as CommonJS is reparsed as an ES module, with a warning. That is a fallback for packages that never declared themselves, not something to rely on: a file under a type of commonjs, or named .cjs, still fails.

The same field is what your bundler and your editor read, which is why a half converted project produces confusing errors in the tooling as well as at run time.`,
    explanation: `Deciding from the contents is the intuitive rule and the one Node deliberately did not adopt, because the file would have to be parsed to know how to parse it. The syntax detection fallback above is as close as it gets, and it exists to rescue old packages rather than to be the rule.

How a file is loaded does not change what it is. require of an ES module and import of a CommonJS module both work now, and each file keeps the semantics its own classification gave it.

Modules everywhere describes a world several tools have tried to reach and Node has not, because it would break every package published before 2019.`,
    hints: [],
    tags: ['modules', 'esm', 'commonjs'],
  },
  {
    id: 'missing-extension-debugging',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'This line works in the bundled front end and fails when Node runs it: ERR_MODULE_NOT_FOUND, cannot find module utils, did you mean ./utils.js. Why?',
    code: `import { formatDate } from './utils'`,
    options: [
      'Node takes a relative specifier literally and does not try adding extensions. A bundler does, which is why the same line worked there',
      'The file has to be listed in the exports field of package.json before a relative import can reach it',
      'Relative specifiers only work inside node_modules, and elsewhere the path has to be absolute',
      'utils.js has no default export, and a specifier with no extension asks for one',
    ],
    correctOption: 0,
    answerInFull: `Node takes the string literally. It names a file called utils, there is no such file, and Node stops. It does not go on to try ./utils.js, or ./utils/index.js, or anything else.

    import { formatDate } from './utils.js'

Bundlers do try, which is the only reason the line ever worked. Webpack and Vite resolve extensionless paths and directory index files because CommonJS did, so code written against that habit breaks the first time Node runs it directly. Two tools, two resolution algorithms, one import line.

The extension names the file as it exists at run time. In a TypeScript project compiled to ES modules that means writing ./utils.js inside a file called utils.ts, which looks wrong and is right.

Bare specifiers are a separate rule and need no extension, because importing from zod is resolved through that package's package.json rather than as a path on disk.`,
    explanation: `The exports field controls what other packages may import from yours, by mapping public names onto files. It has nothing to say about a relative import between two files in the same project.

Relative specifiers work anywhere and are the ordinary way to import your own files. Bare specifiers are the ones that go looking in node_modules.

The last option is about what is inside the file, and Node never opened one. Resolution failed first, which is the useful thing the error code tells you.`,
    hints: ['What does Node do with that string, exactly?'],
    tags: ['modules', 'esm', 'debugging'],
  },
  {
    id: 'modules-evaluate-once-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'Three modules import ./config.js, which logs a line while it evaluates and exports an object. How many times does that line print, and how many objects are there?',
    options: [
      'Three times and three objects, one for each importer',
      'Once and one object, shared by all three importers',
      'Once and three objects, since each importer gets its own copy of the exports',
      'Three times and one object, because evaluation repeats but the exports are cached',
    ],
    correctOption: 1,
    answerInFull: `Once, and one object.

A module is evaluated the first time it is imported, and the result is kept in the loader's registry under its resolved path. Every later import of that path, from anywhere in the program, gets what is already there. require has the same behaviour through its own cache.

That single fact explains a lot of module behaviour that otherwise looks arbitrary. A module body is the right place for setup that must happen exactly once. Exported mutable state is shared state, so a module exporting a counter exports one counter to the whole program. And a slow module body is paid for once, by whoever imports it first.

It is also why a singleton in JavaScript needs no pattern:

    // db.js
    export const pool = createPool()

Everything that imports that gets the same pool.

The registry is keyed by resolved path, which is where the surprises live. One file reached by two different paths, or a package installed twice at different versions, evaluates twice and gives you two of everything.`,
    explanation: `Three evaluations treats an import as a call that runs the file. It is a reference to something that has already been built, and rebuilding it would make shared state impossible.

One evaluation and three objects is CommonJS destructuring described as though it were the module system. Copies happen when you destructure the exports yourself. The module and its exports object are still made once.

The last option separates evaluation from caching in a way nothing does. Caching the exports is caching the result of the evaluation, so there is nothing left over to repeat.`,
    hints: [],
    tags: ['modules', 'esm', 'commonjs'],
  },
  {
    id: 'module-directory-path-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'An ES module needs the directory it is in, to read a file sitting next to it. __dirname throws a ReferenceError. Which of these is right?',
    options: [
      'process.cwd(), which is the directory the module is in',
      'path.dirname(import.meta.url), which gives the string __dirname would have held',
      'new URL(".", import.meta).pathname, since import.meta is already a URL',
      'import.meta.dirname, or path.dirname(fileURLToPath(import.meta.url)) on older Node',
    ],
    correctOption: 3,
    answerInFull: `    import { readFile } from 'node:fs/promises'

    const config = await readFile(import.meta.dirname + '/config.json', 'utf8')

__dirname and __filename are variables Node injects into the function it wraps every CommonJS file in. An ES module is not wrapped in anything, so they do not exist, and the error says exactly that: __dirname is not defined in ES module scope.

The replacement is import.meta, an object the runtime fills in per module. import.meta.dirname and import.meta.filename are the direct equivalents, added in Node 20.11. Before that, and in code that still has to run on older versions, the same thing is spelled:

    import { fileURLToPath } from 'node:url'
    import path from 'node:path'

    const here = path.dirname(fileURLToPath(import.meta.url))

The step people leave out is fileURLToPath. import.meta.url is a URL, not a path, and slicing the prefix off it works until a directory name contains a space or a character outside ASCII, which arrive percent encoded.

For reading a file next to your source, new URL('./config.json', import.meta.url) is tidier still, since the fs functions accept a file URL directly and nothing needs converting.`,
    explanation: `process.cwd() is where the process was started, usually the project root, and has nothing to do with where any particular file is. It is the answer that works on your machine and breaks the moment someone runs the command from another directory.

Calling path.dirname on the URL treats a URL as a path. It returns something rather than failing, a string still beginning with file://, and that stays quietly wrong until it reaches the filesystem.

The last option is one character away from a real idiom. new URL('.', import.meta.url) is the one that works; import.meta is an object rather than a URL, and reading .pathname off the result is the step that loses the percent encoding.`,
    hints: [],
    tags: ['modules', 'esm', 'node'],
  },
]
