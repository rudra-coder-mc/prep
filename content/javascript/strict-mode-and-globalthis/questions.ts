import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'undeclared-assignment-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What happens when you assign to a name that was never declared?',
    options: [
      'It creates a global in both modes, but strict mode warns in the console',
      'It throws a ReferenceError in both modes; the difference is only the message',
      'It creates a property on the global object in sloppy mode, and throws a ReferenceError in strict mode',
      'It creates a block scoped binding wherever the assignment appears, in both modes',
    ],
    correctOption: 2,
    answerInFull: `In sloppy mode the assignment walks the scope chain, finds nothing, and creates a property on the global object. In strict mode the same line throws a ReferenceError naming the identifier.

    function total(order) {
      sum = order.items.length // typo for the local
      return sum
    }

Sloppy, that typo is a working program with a global called sum in it, shared by every call and every other file. Two functions doing the same thing overwrite each other and the bug shows up somewhere else entirely.

Strict, it throws on the line that has the mistake in it. This is the single change strict mode is most worth having, and it is the reason the mode exists at all: the sloppy behaviour turns a misspelling into a feature.

Worth adding that the created property is configurable, unlike a real top level var, so it can be deleted again. That is trivia, but it shows you know the assignment creates a property rather than a declaration.`,
    explanation: `A ReferenceError in both modes describes reading an undeclared name, not writing to one. Reading always throws; only writing has the two behaviours.

A block scoped binding is what a declaration would create. There is no declaration here, which is the whole point, and nothing in JavaScript infers one.

Nothing warns. Sloppy mode is silent by design, which is what made these bugs so hard to find that the language grew a second set of rules.`,
    hints: [],
    tags: ['strict-mode', 'scope'],
  },
  {
    id: 'plain-call-this-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'This file is an ES module. What does it print?',
    code: `function whoAmI() {
  console.log(this)
}

whoAmI()`,
    options: [
      'undefined, because module code is strict and a plain call sets this to undefined',
      'globalThis, because a plain call always falls back to the global object',
      'An empty object, which is what top level this is in a module',
      'The module object, since every module has its own this',
    ],
    correctOption: 0,
    answerInFull: `undefined. Module code is strict whether or not anyone wrote the directive, and in strict mode a function called with nothing to the left of the dot gets undefined as its this.

The sloppy rule is the fallback everyone remembers: a plain call gets globalThis. That fallback is exactly what strict mode removed, because it turned a lost binding into a silent write to a global.

    const timer = {
      count: 0,
      tick() {
        this.count++
      },
    }

    const tick = timer.tick
    tick() // strict: TypeError, cannot read count of undefined

Sloppy, that same extraction increments globalThis.count and the timer never changes. Strict, it throws where the binding was lost.

Keep the two levels separate when answering. Top level this in a module is undefined as well, but for a different reason: the module has no this at all, rather than a call having lost one.`,
    explanation: `There is no module object in ES modules. That is CommonJS, where top level this is module.exports, which is where the empty object answer comes from.

globalThis is the sloppy answer, correct for a classic script and wrong here. Naming the mode is what makes the answer complete.

An empty object would be observable and confusing. undefined is deliberate: it throws on the first property access rather than accepting writes nobody reads.`,
    hints: ['What mode is a module in, without being asked?'],
    tags: ['strict-mode', 'this'],
  },
  {
    id: 'directive-not-first-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'This script was supposed to be strict, and a typo still created a global instead of throwing. Why?',
    code: `const VERSION = 2
'use strict'

function save(record) {
  recrd = record // typo, no error
  store.push(recrd)
}`,
    options: [
      'const at the top level opts the file out of strict mode',
      'Strict mode does not cover assignments, only declarations',
      'The directive has to be inside each function, not at the top of the file',
      'A directive only counts when nothing comes before it, so after a statement it is just a string expression and the file stays sloppy',
    ],
    correctOption: 3,
    answerInFull: `The directive prologue is the run of string literals at the very start of a file or a function body. A string that comes after any statement is an expression that evaluates to a string and does nothing else, so this file is sloppy and the typo creates a global.

    'use strict' // first line, nothing before it
    const VERSION = 2

Comments and blank lines are fine before it; anything executable is not.

The failure mode is nasty because it is invisible. There is no error, no warning, and the file reads as strict to anyone skimming it. It is one of the reasons the ecosystem stopped relying on the directive at all: modules are strict by construction, so there is nothing to get wrong.

If you meet this in a real file, the honest fix is usually to make the file a module rather than to move the string.`,
    explanation: `A per function directive works, and is how you would opt one function in inside a sloppy file, but the file level directive works too when it is genuinely first.

const has no effect on the mode. It is simply the statement that happens to be in the way, and any statement would do the same.

Assignment is precisely what strict mode changes here. The rule is about writing to an undeclared name, not about declarations.`,
    hints: ['What has to be true of a directive for the engine to treat it as one?'],
    tags: ['strict-mode', 'debugging'],
  },
  {
    id: 'frozen-write-silent-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'In a CommonJS file with no directive, this function reports success and the config never changes. What is happening?',
    code: `const config = Object.freeze({ retries: 3 })

function bumpRetries() {
  config.retries = 5
  return config.retries
}

console.log(bumpRetries()) // 3`,
    options: [
      'Object.freeze copies the object, so the write lands on a different object',
      'The write to a frozen object fails silently under sloppy rules; in strict mode the same line throws a TypeError',
      'const prevents the property write, and freeze is irrelevant here',
      'The return reads a cached value, and a second call would report 5',
    ],
    correctOption: 1,
    answerInFull: `Freezing makes every own property non-writable. A write to a non-writable property is not an error under sloppy rules, it is a no-op: the assignment evaluates, nothing changes, and execution carries on. The read that follows sees the original value.

In strict mode the same assignment throws:

    TypeError: Cannot assign to read only property 'retries' of object

Same for a property with only a getter, and for adding a property to a non-extensible object. Strict mode did not change what happens to the object; it changed whether you are told.

This is the sloppy failure that survives longest in real code, because everything looks fine. Frozen configuration objects and frozen state in a store are exactly where it hides.

Two things worth adding. freeze is shallow, so a nested object stays mutable. And a strict function writing to a frozen object throws even when the freeze happened in a sloppy file, because the mode of the code doing the writing is what counts.`,
    explanation: `freeze returns the same object it was given. There is no copy, which is why freezing an object other code already holds affects that code too.

const stops the binding being reassigned, not the object being mutated. Without the freeze, config.retries = 5 would work perfectly.

Nothing is cached. Every call performs the same write and the same read, and every call returns 3.`,
    hints: ['What does an assignment to a non-writable property do when nothing throws?'],
    tags: ['strict-mode', 'objects', 'debugging'],
  },
  {
    id: 'let-not-on-globalthis-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A classic script declares const rate = 0.2 at its top level. Why is globalThis.rate undefined?',
    options: [
      'let, const and class at the top level of a script live in the global lexical scope, which is not the global object',
      'Only functions can create properties on the global object',
      'globalThis is a copy of the global object taken before the script ran',
      'const bindings are removed once the script finishes running',
    ],
    correctOption: 0,
    answerInFull: `Because "global" names two scopes that sit on top of each other. The global object holds the built-ins and whatever gets put there as a property. Above it sits the global lexical scope, where top level let, const and class declarations go.

    var total = 0 // globalThis.total === 0
    const rate = 0.2 // globalThis.rate === undefined
    rate // resolves fine, it is in scope

Both names resolve normally, because a lookup searches the lexical scope and then the global object. Only one of them is reachable as a property.

The split was deliberate when let and const arrived: adding a global property is observable to every other script on the page and cannot be shadowed safely, so the new declarations were kept out of it.

The third case completes the answer. In a module, none of these are global at all. Every top level declaration stays in module scope, and the only way to reach the global object is to write to it: globalThis.rate = 0.2.`,
    explanation: `Nothing is removed when a script finishes. Both bindings outlive it, which is how one script's globals are visible to the next.

Functions and var both create global properties, and only in a script. The declaration keyword decides it, not what is being declared.

globalThis is the object itself, not a snapshot. Assigning to it is how a polyfill installs itself, and every other script sees the change immediately.`,
    hints: ['How many scopes does the word global cover here?'],
    tags: ['globalthis', 'scope'],
  },
  {
    id: 'portable-global-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'You ship a library that runs in a page, in a web worker and in Node, and it has to install one shared registry object. Which approach is right?',
    options: [
      'Keep the registry in a module level const, since every importer shares the module instance',
      'Read window, and fall back to a module level object when it is missing',
      'Write to globalThis, after checking for the registry so a second copy of the library reuses the first',
      'Detect the environment with typeof process, then use global or window accordingly',
    ],
    correctOption: 2,
    answerInFull: `globalThis is the name that resolves in all three, which is what it was added for.

    globalThis.__myLibRegistry ??= new Map()
    const registry = globalThis.__myLibRegistry

The check matters as much as the object. Two copies of a library in one process is normal — two versions in a dependency tree, or a bundle plus a script tag — and a cross-realm singleton is only a singleton if the second copy finds the first.

Give the property a name nobody collides with, and understand what you are trading: the global object is shared with everything else in the realm, so anything you put there is a name in a namespace you do not own. Do it for things that genuinely must be one per realm, such as a registry, a polyfill or a devtools hook, and nothing else.

Say the limit out loud too. Each realm has its own globalThis, so a worker, an iframe and the page do not share one. Anything that has to be shared across realms needs a message, not a property.`,
    explanation: `window is missing in a worker and in Node, and a module level fallback quietly gives every environment except the browser its own private registry, which is the bug the singleton was meant to prevent.

Sniffing with typeof process is the pre-2020 workaround, still seen in bundled code and now pointless. It also misidentifies environments that shim process.

A module level const is the right default for ordinary state, and wrong here: the module registry is per bundle, so two copies of the library get two registries. That is the difference between module state and realm state.`,
    hints: ['What has to be true when two copies of the library load?'],
    tags: ['globalthis', 'coding'],
  },
  {
    id: 'top-level-this-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'The same line, console.log(this), sits at the top level of three files: a classic script, an ES module, and a CommonJS file. What does each print?',
    options: [
      'globalThis, undefined, {} — the script sees the global object, the module has no this, and CommonJS logs module.exports',
      'globalThis in all three, since top level code always runs against the global object',
      'undefined, undefined, globalThis — anything strict has no this, and CommonJS is sloppy',
      '{}, {}, {} — every file gets its own module object',
    ],
    correctOption: 0,
    answerInFull: `globalThis, undefined, and an empty object.

A classic script runs with this bound to the global object, which is why old code could write this.foo = 1 to make a global.

An ES module has no this at the top level. It is specified as undefined, and that is a property of modules rather than of strict mode: module code is strict, but this is undefined here because the module goal says so.

A CommonJS file is a function body that Node calls with module.exports as this, so the empty object is exports before anything is added to it. That is also why this.x = 1 in a CommonJS file exports x, and why the same line in an ES module throws.

The useful summary: top level this tells you what kind of file you are in. If you need the global object regardless, the answer is globalThis, in every one of the three.`,
    explanation: `"globalThis in all three" is the pre-modules answer. It has been wrong since 2015 for modules and was never right for CommonJS.

The third option gets the module right and CommonJS wrong. CommonJS files are sloppy by default, but this is module.exports there because of the wrapper Node calls the file with, not because of the mode.

Uniform empty objects would make the three interchangeable. The differences are exactly what people trip on when moving a file from require to import.`,
    hints: ['What does Node wrap a CommonJS file in before running it?'],
    tags: ['globalthis', 'this', 'modules'],
  },
  {
    id: 'strict-failures-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    prompt: 'This module is strict. Put the lines it prints in the order it prints them.',
    code: `const config = Object.freeze({ retries: 1 })

function attempt(label, fn) {
  try {
    fn()
    console.log(label + ': ok')
  } catch (error) {
    console.log(label + ': ' + error.name)
  }
}

attempt('write', () => {
  config.retries = 5
})
attempt('global', () => {
  missing = 5
})
attempt('delete', () => {
  delete config.retries
})`,
    items: [
      'global: ok',
      'write: TypeError',
      'delete: ok',
      'global: ReferenceError',
      'write: ok',
      'delete: TypeError',
    ],
    correctOrder: [1, 3, 5],
    answerInFull: `write: TypeError, then global: ReferenceError, then delete: TypeError.

Each call is one of the three silent failures strict mode turned into errors.

The write goes to a frozen, and therefore non-writable, property. Sloppy that is a no-op and the label would say ok. Strict it is a TypeError.

The assignment to missing has no declaration anywhere in scope. Sloppy it creates globalThis.missing. Strict it is a ReferenceError, and the name in the message is the typo.

The delete targets a non-configurable property, which freezing also makes it. Sloppy, delete returns false and carries on. Strict, it throws a TypeError. Note the other delete rule is a syntax error rather than a runtime one: delete on a plain variable name fails to parse in strict code, so it could not be caught like this at all.

The order itself is plain top to bottom. What the question is really asking is which branch each call takes.`,
    explanation: `Every "ok" line is the sloppy reading of one of the three calls, which is what makes them the tempting distractors: each is exactly what the same file would print without strict mode.

Three failures, three different reasons: a non-writable property, an undeclared name, and a non-configurable property. Only the middle one is about scope.

If delete config.retries had been written as delete retries, the file would not have run at all. A syntax error is thrown before any of these lines execute, so nothing would print.`,
    hints: [
      'Which of these three would be silent without the mode?',
      'What does freezing do to writability and configurability?',
    ],
    tags: ['strict-mode', 'objects'],
  },
  {
    id: 'mode-is-lexical-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A strict ES module imports a helper from an old sloppy CommonJS file, and that helper still creates a global when it assigns to an undeclared name. A colleague says the import should have made it strict. Who is right?',
    options: [
      'Neither: the bundler decides, so it depends on the build',
      'You: the mode is decided by where code is written, not by where it is called from, so the helper stays sloppy',
      'The colleague, but only for the top level of the helper file; its functions stay sloppy',
      'The colleague: code imported into a module runs under the importing module rules',
    ],
    correctOption: 1,
    answerInFull: `The mode is lexical. It is fixed by the file and the enclosing code the function was written in, and nothing at the call site changes it. A strict caller does not make a sloppy callee strict, and a sloppy caller does not relax a strict callee.

That is what makes the mode safe to reason about at all. If it travelled with the call, the same function would follow different rules depending on who called it, and you could not read a file and know what it does.

So the helper keeps creating its global. The options are to add the directive to that file, convert it to a module, or leave it alone and know what it does.

The one thing that does travel is inheritance downward through nesting: a function written inside strict code is strict, including callbacks defined there. The same helper, if you copy its body into your module, becomes strict immediately, which is a common surprise during a migration.`,
    explanation: `Importing does not rewrite the imported file. The module system decides where the code comes from, not what rules it runs under.

The bundler answer sounds plausible because bundlers do wrap CommonJS files, and that is exactly why it is worth being clear: the wrapper preserves each file's own mode rather than merging them, and a bundler that failed to would change behaviour it has no business changing.

Splitting a file into a strict top level and sloppy functions is not something the language does. The mode covers a file and everything nested inside it.`,
    hints: ['Is the mode a property of the code, or of the call?'],
    tags: ['strict-mode', 'modules', 'scenario'],
  },
  {
    id: 'arguments-aliasing-output',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    prompt: 'A sloppy script contains this function. What does it print?',
    code: `function update(price) {
  price = price * 2
  console.log(arguments[0])
}

update(10)`,
    options: [
      'It throws: arguments is read only',
      '10, since arguments holds the values as they were passed',
      '20, because in sloppy mode arguments and the named parameters alias each other',
      'undefined, because reassigning a parameter detaches arguments',
    ],
    correctOption: 2,
    answerInFull: `20. In sloppy mode the arguments object and the named parameters are two views of the same storage, so writing to price is visible as arguments[0], and writing to arguments[0] is visible as price.

Strict mode breaks the link. The same function in a module or under the directive prints 10: arguments is a snapshot of what was passed, and the parameter is an ordinary binding.

The aliasing also disappears in sloppy code the moment the parameter list uses a default value, a rest parameter or destructuring. So the behaviour depends on the mode and on the shape of the parameter list, which is a good reason not to build anything on it.

In practice nobody wants arguments now. Rest parameters give a real array, work identically in both modes, and read better:

    function update(...args) {
      // args is an array, no aliasing anywhere
    }

Knowing the aliasing is still worth it for reading old code, where a function reassigns a parameter and something further down reads arguments.`,
    explanation: `10 is the strict answer, and the answer people expect, because the aliasing is the surprising half of the pair.

Nothing detaches. In sloppy mode the link holds for the life of the call, in strict mode it never existed, and neither produces undefined here.

arguments is writable in sloppy mode. What strict mode forbids is assigning to the arguments binding itself, and reading arguments.callee, neither of which this function does.`,
    hints: ['What is arguments in a sloppy function: a copy, or another name for the same slots?'],
    tags: ['strict-mode', 'functions'],
  },
  {
    id: 'why-strict-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'Why does strict mode exist, and why does almost nobody write the directive any more? What would you check before deleting it from an old file?',
    answerInFull: `- It exists because a set of early decisions made mistakes silent. Undeclared assignment created a global, failed writes did nothing, delete returned false, and a plain call bound this to the global object. All four turn a bug into a program that runs.
- The language could not fix them in place. Every page on the web depended on the old behaviour, so the fixes went behind an opt-in that a file, or a function, chooses for itself. That is why the mode is lexical rather than a flag on the engine.
- Nobody writes the directive now because the opt-in got absorbed into the things people already use. ES modules are strict, class bodies are strict, and a bundler emits modules. A codebase written in the last decade is strict almost everywhere without saying so.
- The three that matter in review: undeclared assignments throw, this is undefined in a plain call, and writes that used to fail silently now throw. The syntax removals — duplicate parameters, octal literals, with, arguments aliasing, arguments.callee — are worth naming after those.

Before deleting a directive from an old file, the question is whether that file is still sloppy without it. If it is a module, or a class body, the directive is redundant and removing it changes nothing. If it is a classic script or a CommonJS file, removing it puts the file back under sloppy rules, and that is a behaviour change rather than a cleanup: writes that throw today start passing silently, and this in a plain call goes back to being the global object. The safe move is converting the file to a module instead, which keeps the rules and removes the line.

The senior-shaped ending is that strict mode is now a compatibility story rather than a decision. You inherit it. What you still need it for is reading old code and explaining why the same function behaves differently in two files.`,
    explanation: `Interviewers use this to separate people who learned a rule from people who know why the rule exists. The tell is whether the answer mentions that the mode is lexical and per file, since that is what explains both the migration path and the surprises.

The second half is the more senior half. Anyone can list what strict mode changes; noticing that removing the directive is a behaviour change rather than a tidy-up is the part that shows judgement.`,
    hints: [],
    tags: ['strict-mode', 'design'],
  },
]
