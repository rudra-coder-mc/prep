import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'tree-shaking-requirements-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'What has to be true before a bundler can drop an unused export?',
    options: [
      'The bundle has to be minified first, since minification is what removes the code',
      'The export has to be a function, since only functions can be proved unreachable',
      'The import graph has to be statically analysable, and the module has to be known not to do anything besides define exports',
      'The module has to be marked as pure with a comment on every export',
    ],
    correctOption: 2,
    answerInFull: `Two conditions, and both are about proof rather than about the export itself.

The graph has to be static. Import and export are declarations, so a tool can follow every use of every export without running the program. require is a function call whose argument can be anything, which is why tree shaking works on ES modules and barely works on CommonJS.

The module has to be side effect free, or the removal is not safe. A module that patches a prototype, registers a custom element or writes to globalThis does something whether or not its exports are read. The bundler assumes the worst unless package.json says otherwise:

    { "sideEffects": false }
    { "sideEffects": ["./src/polyfills.js", "*.css"] }

The third condition, in practice, is that the use is visible. An export reached through a computed property defeats the analysis, and so does a barrel file that re-exports forty modules, because now the bundler has to prove all forty are droppable and one side effect anywhere keeps them.

Minification is a separate later pass. It shortens what survives; it does not decide what survives.`,
    explanation: `Nothing about tree shaking is limited to functions. A constant, a class or an object is dropped on the same terms.

Purity annotations exist as a hint some tools honour for call expressions, and they are a supplement to the analysis, not a requirement of it.

Minifying works inside a module and never removes a module. The two passes are often confused because both make the output smaller.`,
    hints: [],
    tags: ['bundlers', 'tree-shaking'],
  },
  {
    id: 'split-point-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    tier: 'swe-2',
    prompt:
      'The bundle is built, the page loads, and the user clicks once with an empty data set. Put the lines that print in the order they print.',
    code: `// analytics.js
console.log('analytics module')
export function track() {
  console.log('tracked')
}

// chart.js
console.log('chart module')
export function draw() {
  console.log('chart drawn')
}

// main.js
import './analytics.js'
console.log('main body')

button.addEventListener('click', async () => {
  console.log('clicked')
  const { draw } = await import('./chart.js')
  if (data.length > 0) draw()
  else console.log('nothing to draw')
})`,
    items: [
      'tracked',
      'analytics module',
      'main body',
      'chart drawn',
      'clicked',
      'chart module',
      'nothing to draw',
    ],
    correctOrder: [1, 2, 4, 5, 6],
    answerInFull: `analytics module, main body, clicked, chart module, nothing to draw.

Two mechanisms, one each side of the click.

Before the click, only the static graph has run. analytics.js is a static import, so it evaluates before the body of main.js, printing its top level line first. Nothing from chart.js has been fetched: the dynamic import is a split point, so the bundler emitted that subgraph as its own chunk and nothing requests it until the call runs.

After the click, the handler prints, the chunk is fetched and evaluated — which is when the top level line of chart.js prints, once — and then the branch chooses the message.

The exports that are never called print nothing, which is the part worth noticing. Evaluating a module runs its top level code, not its functions.

If chart.js were statically imported instead, its line would print at load, between the analytics line and the main body, and the click would print only two lines. That difference is the whole argument for splitting: the cost of a chunk moves from load to first use.`,
    explanation: `"tracked" and "chart drawn" are the two functions nobody calls. They are exported and evaluated into existence, and a module evaluating is not its functions running.

Placing "chart module" before "clicked" is the model where a dynamic import is fetched eagerly and merely awaited late. The split point means the request itself waits.

Placing "main body" first reads the file top to bottom. Static imports are evaluated before the importing module body, so the dependency prints first.`,
    hints: [
      'What has been downloaded before the click?',
      'Does evaluating a module run the functions it exports?',
    ],
    tags: ['bundlers', 'code-splitting'],
  },
  {
    id: 'inlined-env-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'A frontend container reads its API URL from an env var. Changing the var and restarting the container has no effect; the old URL is still requested. Why?',
    code: `const apiUrl = process.env.API_URL
fetch(apiUrl + '/orders')`,
    options: [
      'The bundler replaced process.env.API_URL with a string literal at build time, so the value is part of the built file and only a rebuild changes it',
      'Env vars are only read once per process, so the module has to be re-imported to pick up the change',
      'The browser cached the response, and the URL is being read correctly',
      'The container caches the compiled bundle, so restarting serves the old file from disk',
    ],
    correctOption: 0,
    answerInFull: `There is no process in a browser. The bundler substitutes the expression for a literal during the build, so the emitted code is:

    const apiUrl = 'https://api.old.example.com'

Restarting the container reruns nothing that could change that. Only a rebuild does, which is why this pattern makes an image environment specific: the same artefact cannot be promoted from staging to production.

The fix depends on what you want. If the value must be settable at deploy time, the app has to fetch it at run time — a small config endpoint, a config file loaded before the app, or a placeholder in index.html that the container's entrypoint rewrites on start. If it is genuinely build time, name it that way and build per environment deliberately.

The general rule worth stating: anything a bundler can turn into a constant is a decision made when the bundle was built. NODE_ENV works the same way, and that is on purpose — the branch around it disappears entirely, which is how development-only warnings cost nothing in production.`,
    explanation: `A stale file on disk is worth checking and produces a different symptom: the file would be identical to the previous build, including the previous value of everything else.

Reading an env var once per process is CommonJS-shaped thinking about a browser bundle. There is no process object at all; the expression never survives the build.

A cached response would be visible in the network tab against the correct URL. Here the request goes to the wrong host.`,
    hints: ['What does process.env mean in a browser?'],
    tags: ['bundlers', 'debugging'],
  },
  {
    id: 'module-as-function-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'staff',
    prompt: 'In a bundle, what has happened to each of your modules?',
    options: [
      'They are inlined at every import site, so a module imported twice appears twice',
      'They are left as modules; the bundler only rewrites the specifiers to point at emitted files',
      'They are concatenated in dependency order, so their top level declarations share one scope',
      'Each becomes a function in a registry, evaluated once on first use, with imports rewritten as property reads on an exports object',
    ],
    correctOption: 3,
    answerInFull: `The bundler rebuilds the module system in user code. Each module becomes a function, all of them go in a registry keyed by module id, and a small runtime evaluates one on first request and caches the result:

    const modules = {
      './rate.js': (exports) => {
        exports.rate = 0.2
      },
    }

Three consequences follow. Module scope becomes function scope, which is harmless because nothing at a module top level was ever global anyway. Live bindings are emulated rather than native, which is why bundlers define exports as getters when the value can change. And the one-evaluation guarantee is now the bundler's runtime keeping it rather than the platform's registry.

Naive concatenation is what the first generation of tools did, and it is why the era of wrapping everything in an immediately invoked function existed: without a wrapper, two files declaring the same name collide.

Scope hoisting, which modern bundlers do where they can prove it is safe, gets back to something like concatenation deliberately: fewer function wrappers, smaller output, faster startup.`,
    explanation: `Shared scope is what concatenation without wrappers means, and it is exactly the collision problem modules were introduced to solve.

Inlining at each import site would duplicate both code and state, and would break the guarantee that a module evaluates once.

Leaving modules as modules and rewriting specifiers is roughly what a dev server does, and it is the thing a bundle is not.`,
    hints: ['What replaces the platform registry once the files are joined?'],
    tags: ['bundlers', 'modules'],
  },
  {
    id: 'shakeable-module-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'You are writing a utility package and want consumers to pay only for what they import. How should it be shaped?',
    options: [
      'One default export holding every utility as a property, so consumers destructure what they need',
      'Named exports, no top level side effects, no barrel that re-exports modules with effects, and an honest sideEffects field',
      'One file per utility with a default export each, and no index file at all',
      'Named exports, plus a build step that emits one file per export so bundlers have less to analyse',
    ],
    correctOption: 1,
    answerInFull: `Four things, and they are all about making the analysis easy:

    // package.json
    { "type": "module", "sideEffects": false }

    // src/index.js
    export { formatDate } from './format-date.js'
    export { parseDate } from './parse-date.js'

Named exports, so each use is visible statically. No top level work in any module, so dropping one is provably safe. A barrel that re-exports only side effect free modules, so importing one name does not drag in thirty. And the sideEffects field telling the truth, including a list of the files that do register something if any do.

An object of utilities defeats all of it. The bundler sees one export that is used, and everything hanging off it comes along, because proving which properties are read is a much harder problem than following a named import.

Say the consumer's side too. Importing from the package root is fine when the package is shaped like this; deep imports into internals are how people work around packages that are not, and they break when the package adds an exports field.`,
    explanation: `The default-object shape is the classic reason a small utility import costs a hundred kilobytes. It was the only option before modules and there is no reason for it now.

Abolishing the index file works and is hostile: consumers get long import paths and you cannot reorganise files without a breaking change. The barrel is fine when the modules behind it are clean.

One file per export as a build step is the same idea taken past its usefulness. Bundlers already track exports individually; the file boundary buys nothing and multiplies the artefacts.`,
    hints: ['What does the bundler have to prove, and what makes that proof easy?'],
    tags: ['bundlers', 'tree-shaking', 'coding'],
  },
  {
    id: 'dev-versus-production-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    tier: 'senior',
    prompt:
      'A team keeps finding bugs that only exist in production. The dev server serves unbundled modules; production is a bundled, minified build. What is the useful response?',
    options: [
      'Treat the dev server as a fast approximation and verify anything load-bearing against a production build, in CI and locally before release',
      'Disable minification in production, since that is where the differences come from',
      'Move the risky code into a dynamic import, which behaves the same in both',
      'Bundle in development too, so both environments run identical code',
    ],
    correctOption: 0,
    answerInFull: `The two pipelines are different on purpose. The dev server exists to be fast: it transforms one file at a time and skips the analysis passes. The production build resolves the whole graph, shakes it, inlines constants and renames identifiers. Making development identical throws away the reason the dev server is pleasant to use.

So the response is to close the gap where it matters, not to remove it:

- A production build in CI on every change, and a way to run it locally in one command.
- Smoke tests, or the end to end suite, against the built output rather than the dev server.
- Knowing the three classic divergences: a wrong sideEffects claim, a value inlined at build time, and code depending on a name the minifier changed.

The judgement being tested is that "make the environments identical" sounds rigorous and is usually the wrong trade. Identical environments cost the fast feedback loop, and the same bugs come back the moment someone adds a production-only optimisation.`,
    explanation: `Bundling in development is available in every tool and is what people had before dev servers. It also multiplies rebuild times by an order of magnitude, which is a large price for catching a small class of bug that a CI build catches anyway.

Turning off minification removes one of the three causes and keeps shaking and inlining, at a real cost in bundle size. It is a diagnostic step, not a policy.

Dynamic imports do not behave identically. They are a split point in the build and an ordinary fetch in the dev server, so they are a difference rather than a bridge.`,
    hints: ['What is the dev server optimised for, and what does that cost?'],
    tags: ['bundlers', 'tooling', 'scenario'],
  },
  {
    id: 'barrel-file-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'Importing one small helper from a shared package added 200kB to the bundle. The helper itself is twenty lines. What is the likely cause?',
    code: `import { formatBytes } from '@acme/utils'`,
    options: [
      'The helper has a large transitive dependency that is loaded lazily in the package but eagerly in your build',
      'The package ships a single bundled file, so importing anything imports everything',
      'The package index re-exports every module, and at least one of them has a side effect or defeats the analysis, so the bundler cannot drop the rest',
      'Named imports always pull the whole package; only a deep import can be shaken',
    ],
    correctOption: 2,
    answerInFull: `A barrel is one module that re-exports many. Importing one name from it makes the bundler ask whether every other module behind it can be dropped, and the answer is no as soon as one of them registers something, patches a prototype or is a CommonJS file it cannot follow.

    // @acme/utils/index.js
    export * from './format.js'
    export * from './analytics.js' // starts a timer at import
    export * from './polyfills.js' // patches Array.prototype

Two of those keep the whole package in the bundle.

Diagnosing it means looking rather than guessing: a bundle analyser shows which modules arrived and which import chain brought them. That is faster than reasoning about it, and it is the tool to name when asked.

Fixes in order: fix the package so it is honest about side effects and keeps effectful modules out of the barrel; import the specific module directly if the package exports that subpath; and only then vendor the twenty lines.

The same shape is why very large barrels are discouraged in application code too. They are convenient for the author of the import and expensive for everything downstream.`,
    explanation: `A single bundled file has this effect and is easy to rule out by looking at the package contents.

Deep imports are a workaround, not a rule: named imports from a well shaped package shake perfectly well, which is the whole point of the format.

A lazily loaded transitive dependency would appear as its own chunk rather than in the main bundle, and would not follow from importing one helper.`,
    hints: ['What does the bundler have to prove about the modules you did not import?'],
    tags: ['bundlers', 'tree-shaking', 'debugging'],
  },
  {
    id: 'minified-name-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt:
      'This dispatch works in development and picks the wrong branch in production. What does handler.constructor.name give in the production bundle?',
    code: `class RetryPolicy {}

function describe(handler) {
  return handler.constructor.name === 'RetryPolicy' ? 'retrying' : 'plain'
}`,
    options: [
      'undefined, because minified classes lose their name property',
      'Object, because the class is flattened into a plain object',
      'RetryPolicy, since class names are preserved for stack traces',
      'A minified name such as "e", because the minifier renames classes and nothing preserves the original',
    ],
    correctOption: 3,
    answerInFull: `Whatever the minifier chose, typically a single letter. The name property is derived from the identifier in the source, and the identifier is exactly what minification replaces.

So a comparison against a literal string silently starts choosing the other branch. There is no error, which is what makes it a production-only bug of the worst kind.

The fix is to stop using the name as data:

    class RetryPolicy {
      static kind = 'retry'
    }

    handler.constructor.kind === 'retry'

An explicit field, a symbol brand, or a plain instanceof check where both sides come from the same module are all stable under minification. instanceof has its own failure mode, which is two copies of the module, so pick by which risk applies.

Worth knowing what does survive: most minifiers have an option to keep class and function names, which some frameworks require, at a cost in size. Relying on it means relying on build configuration nobody will remember.`,
    explanation: `Names are preserved in stack traces through the source map, not in the emitted code. The map is why the trace reads correctly and the runtime value does not.

The name property is never undefined for a class declaration. It holds the minified identifier, which is the whole trap: a plausible string that does not match.

Nothing flattens a class into an object. It is still a class, still with a prototype, just called something shorter.`,
    hints: ['Where does the name property get its value from?'],
    tags: ['bundlers', 'minification'],
  },
  {
    id: 'code-splitting-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    tier: 'swe-2',
    prompt: 'What does a bundler do with a dynamic import(), and when is that worth it?',
    options: [
      'It leaves the request to the runtime, so nothing is decided at build time',
      'It emits the imported subgraph as a separate chunk fetched on demand, which pays when that subgraph is large and genuinely conditional',
      'It inlines the module and defers only its evaluation, so no extra request is made',
      'It converts it to a static import, since the module will probably be needed anyway',
    ],
    correctOption: 1,
    answerInFull: `A dynamic import is a split point. The bundler walks the subgraph reachable from that specifier, emits it as one or more separate chunks, and rewrites the call into "fetch that chunk, then evaluate and resolve with its namespace". Modules needed by more than one chunk are usually hoisted into a shared chunk so they are downloaded once.

It pays where the subgraph is large and genuinely conditional: a route most sessions never visit, a rich text editor behind a button, an admin panel, a locale file. It costs where the thing is needed immediately, because one request becomes two in sequence, and the second cannot start until the first has run.

    // worth it
    const { Editor } = await import('./editor.js')

    // not worth it, on the first screen
    const { Header } = await import('./header.js')

The refinement to mention is that the choice is not binary. A chunk can be fetched early and evaluated late, with a preload or prefetch hint, which is how you get the load time win without the delay on click.`,
    explanation: `The runtime is where the fetch happens, and the decision about what is in that chunk is made at build time. Both halves matter.

Deferred evaluation without a request is what a lazy wrapper around a static import does. It saves execution and not a byte of download.

No bundler converts a dynamic import to a static one, because that would change behaviour: the module would evaluate at load, side effects included.`,
    hints: ['What is emitted, and what is decided at build time against run time?'],
    tags: ['bundlers', 'code-splitting'],
  },
  {
    id: 'interop-default-output',
    type: 'output',
    form: 'choice',
    difficulty: 'hard',
    tier: 'swe-2',
    prompt:
      'An old CommonJS package sets module.exports = function stamp() {}. In a bundled TypeScript app, what does this import give you?',
    code: `import stamp from 'old-stamp'
stamp()`,
    options: [
      'Always an object with a default property, and .default is required in every configuration',
      'undefined, because CommonJS modules have no default export to import',
      'The function, when interop is on; without it, an object whose default property is the function, and calling it throws',
      'Always the function: a default import of a CommonJS module is defined to be module.exports',
    ],
    correctOption: 2,
    answerInFull: `It depends on the interop setting the build uses, which is why this error is so common and so confusing.

The underlying facts: a CommonJS module has no default export. Node defines a default import of one to be module.exports, and bundlers and TypeScript emulate that with a helper when esModuleInterop, or its equivalent, is on. Without the helper, the emitted code treats the exports object as a namespace, so the function ends up as .default and calling the namespace throws that it is not a function.

    // what you see when interop is off
    const stamp = require('old-stamp')
    stamp.default() // the function is here

The error message names the symptom rather than the cause, so recognise the shape: "x is not a function" on a package that plainly exports a function means interop, not a broken package.

Two things to say next. Turning esModuleInterop on is the right fix and it changes the emitted code for every import in the project, so it is a build-wide decision. And a package that publishes both formats sidesteps it entirely, which is the maintainer's half of the answer.`,
    explanation: `"Always the function" is the modern behaviour and only with interop enabled. Configurations without it still exist, particularly in older projects and in some bundler setups.

"Always .default" is the mirror mistake, and it is what people conclude after being burned once. It leaves them writing .default in projects where it is wrong.

undefined would be the outcome if there were no interop rule at all. There is one; the question is only whether the build implements it.`,
    hints: [
      'What does a default import of a CommonJS module mean, and who implements that meaning?',
    ],
    tags: ['bundlers', 'interop'],
  },
  {
    id: 'bundler-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    tier: 'senior',
    prompt:
      'What does a bundler actually do to your code, and what would you check first when something works in development and breaks in production?',
    answerInFull: `- It resolves the module graph with its own implementation of the resolution rules, plus whatever aliases and conditions are configured.
- It transforms each file: TypeScript, JSX, syntax down-levelling.
- It joins the graph into chunks. Each module becomes a function in a registry with a small runtime that evaluates it once on first use. Module scope becomes function scope, and live bindings are emulated with getters.
- It removes what it can prove is unreachable: unused exports, branches behind values it inlined, modules nobody imports.
- It minifies and emits, renaming identifiers, hashing file names and writing a source map.

What that buys and costs: tree shaking needs static import and export and honest side effect information, dynamic imports become split points that trade load time for a request on first use, and some expressions stop being expressions — NODE_ENV and anything else inlined is a build time decision.

For a production-only bug I would check three things in order. First, values inlined at build time, because an env var expected to be read at run time is the most common one and the symptom is a stale value that a restart does not fix. Second, anything depending on identifiers surviving: constructor.name, function.name, a decorator or DI container that reads names. Third, side effect information — a sideEffects claim that is not true, so a polyfill or a registration was shaken out of the build only.

Then the general move: reproduce against a production build locally, and put that build in CI so the gap is measured in minutes rather than in deploys. The dev server is a fast approximation by design, and the answer is to verify against the real output rather than to make development slow enough to be identical.`,
    explanation: `The structure being marked is that the five jobs are separate and that the interesting behaviour comes from the last three. An answer that stops at "it combines files" misses everything that causes real bugs.

The second half is where seniority shows. Naming the three usual causes in the order you would check them, and choosing to close the gap with CI rather than by bundling in development, is a judgement call an interviewer can weigh.`,
    hints: [],
    tags: ['bundlers', 'design'],
  },
]
