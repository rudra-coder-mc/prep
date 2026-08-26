import type { Question } from '@/content/schema'

export const questions: Question[] = [
  {
    id: 'bare-specifier-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'easy',
    prompt: 'What does a bare specifier such as import x from "lodash" mean to the runtime?',
    options: [
      'A built-in module, since anything without ./ is reserved for the platform',
      'A path relative to the project root, resolved against the nearest package.json',
      'A package name: Node walks up the directory tree looking in each node_modules, and a browser rejects it unless an import map defines it',
      'A URL the runtime fetches from the npm registry on demand',
    ],
    correctOption: 2,
    answerInFull: `It is a package name, and it is the only specifier form with a search behind it. Node starts in the importing file's directory, looks for node_modules/lodash, and if it is not there moves up a directory and tries again, all the way to the root.

The browser does none of that. It has no node_modules and no directory tree to walk, so a bare specifier is a hard error unless an import map supplies the mapping:

    <script type="importmap">
      { "imports": { "lodash": "/vendor/lodash.js" } }
    </script>

That difference is why bundlers exist for browser code in the first place: resolving bare specifiers is the job they were originally doing.

The two other forms are simpler. A relative specifier resolves against the importing module's own URL, and in Node's module loader the file extension is required. An absolute path or full URL is taken as written.

Worth adding that once the package directory is found, the search is not over: its package.json decides which file inside it you actually get.`,
    explanation: `Project root resolution is what TypeScript path aliases and bundler aliases provide. It is configuration, not the language, and it disappears the moment the code runs somewhere without that configuration.

Fetching from a registry is what a CDN based import map arranges deliberately. Nothing in the runtime reaches the network for a name on its own.

Node built-ins are spelled node:fs now precisely so they cannot be confused with packages, and everything else without a leading dot is a package name.`,
    hints: [],
    tags: ['modules', 'resolution'],
  },
  {
    id: 'missing-extension-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'easy',
    prompt:
      'A file moved from CommonJS to an ES module now fails with ERR_MODULE_NOT_FOUND, though the file it names is right there. What changed?',
    code: `import { formatDate } from './utils'`,
    options: [
      "Node's module loader does not guess extensions or resolve a directory to its index file, so the specifier has to be './utils.js'",
      'Relative specifiers are not allowed in modules; the path has to start from the project root',
      'The file has to be renamed to .mjs before another module can import it',
      'Named imports need the file to declare its exports in package.json',
    ],
    correctOption: 0,
    answerInFull: `require guessed for you. It tried ./utils, then ./utils.js, ./utils.json, ./utils.node, then ./utils/index.js. The ES module loader does none of that: the specifier is resolved as a URL, and a URL with no extension names a file with no extension.

    import { formatDate } from './utils.js'

The same rule kills the other habit, importing a directory and getting its index file. That has to be spelled out too.

It is worth knowing why, because it sounds like a regression. Guessing means trying several candidates for every unresolved import, which is cheap against a local disk and unacceptable over a network, and it makes resolution ambiguous in a way tools then have to replicate exactly. The module loader traded convenience for one deterministic answer per specifier.

TypeScript is where this bites hardest, because the source says .js and the file on disk is .ts. That is intended: the specifier describes the output, and the compiler resolves it back to the source.`,
    explanation: `Nothing in package.json affects a relative import inside your own project. The exports field governs how other packages reach into this one.

Relative specifiers are the normal form in modules. Root relative paths are the thing that does not work without a bundler or an import map.

Extensions decide the module system for a file, and .js is a module perfectly well when the package type says so. Renaming to .mjs fixes a different problem.`,
    hints: ['What did require try before giving up, and what does the URL resolver try?'],
    tags: ['modules', 'resolution', 'debugging'],
  },
  {
    id: 'registry-key-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt: 'What decides whether two imports get the same module instance?',
    options: [
      'The specifier string, so two different spellings of the same path are two modules',
      'The package name, so every file in a package shares one instance',
      'The file contents: identical files are deduplicated by hash',
      'The resolved URL: same URL, same module, evaluated once and cached; different URL, a second module with its own state',
    ],
    correctOption: 3,
    answerInFull: `Resolution happens first, and the resolved URL is the key. Two specifiers written differently — ./utils.js from one file and ../src/utils.js from another — resolve to the same URL and therefore the same module: evaluated once, with one copy of its top level state.

Change the URL and you get a second module, whatever the contents:

    import './config.js'
    import './config.js?v=2' // a different module, evaluated again

That is occasionally useful, as a cache buster during development, and it is the mechanism behind the expensive version of the problem. Two copies of a package installed at different depths in node_modules are two URLs. A package loaded through both its import and its require condition is two URLs. Each copy has its own module state, and an object made by one fails an instanceof against a class from the other.

The identity check to remember: same resolved URL, same namespace object, same everything. Nothing compares contents, and nothing deduplicates across paths.`,
    explanation: `Hashing contents would make two deliberately separate copies of a library collapse into one, which would break as often as it helped, and it would mean resolution could not answer without reading every file.

The raw specifier is what people assume, and it is wrong in the useful direction: two spellings that resolve the same do share a module, which is why relative paths from different directories still reach one instance.

Package level sharing does not exist. Each file in a package is its own module with its own evaluation.`,
    hints: ['What has already happened by the time the registry is consulted?'],
    tags: ['modules', 'resolution'],
  },
  {
    id: 'side-effect-order-ordering',
    type: 'output',
    form: 'ordering',
    difficulty: 'hard',
    prompt: 'Running app.mjs, put the lines it prints in the order it prints them.',
    code: `// tracker.mjs
globalThis.runs = (globalThis.runs ?? 0) + 1
console.log('tracker run ' + globalThis.runs)

// a.mjs
import './tracker.mjs'
console.log('a')

// b.mjs
import '../src/tracker.mjs'
console.log('b')

// c.mjs
import './tracker.mjs?v=2'
console.log('c')

// app.mjs  (all four files are in src/)
import './a.mjs'
import './b.mjs'
import './c.mjs'
console.log('app')`,
    items: ['tracker run 1', 'a', 'tracker run 3', 'b', 'tracker run 2', 'c', 'app'],
    correctOrder: [0, 1, 3, 4, 5, 6],
    answerInFull: `tracker run 1, a, b, tracker run 2, c, app.

Three importers, two evaluations. a.mjs is reached first and its import of tracker.mjs evaluates it, printing run 1. b.mjs writes a different path to the same file, which resolves to the same URL, so the registry answers and nothing runs again: b prints on its own. c.mjs asks for the same file with a query string, which is a different URL and therefore a different module, so the top level code runs a second time and prints run 2.

app.mjs prints last, because every import is evaluated before the importing module's body.

Two rules carry the whole answer. A module is evaluated once per resolved URL, and side effects happen in graph order, depth first, before the importer's own code.

The query string trick is worth knowing in both directions. It is how you force a module to re-evaluate during development, and it is an accidental duplicate module, with duplicate state, if you reach for it thinking it is just a cache hint.`,
    explanation: `"tracker run 3" is the reading where every import evaluates the module: three importers, three runs. The registry exists precisely to make that not happen.

Only one "tracker run 1" appears because the counter lives on globalThis rather than in the module. Module level state would reset with each new module instance, and both runs would report 1, which is itself a good demonstration of what a duplicate module costs.

Putting "app" anywhere but last means reading the file top to bottom. Its body runs after the whole graph it imports.`,
    hints: [
      'Which of the three specifiers resolve to the same URL?',
      'When does the importing module body run relative to its imports?',
    ],
    tags: ['modules', 'resolution', 'side-effects'],
  },
  {
    id: 'idempotent-registration-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'You are writing a module whose job is a side effect: it registers a set of custom elements. How should it be written so that being loaded twice does no damage?',
    options: [
      'Register at the top level and let the module registry guarantee it happens once',
      'Register at the top level, but guard each registration by checking the registry for the name first, since two copies of the module are two evaluations',
      'Export an init function and require every consumer to call it exactly once',
      'Track a module level boolean and return early when it is already set',
    ],
    correctOption: 1,
    answerInFull: `Top level registration is right, and the guard is what makes it safe:

    for (const [name, element] of elements) {
      if (!customElements.get(name)) {
        customElements.define(name, element)
      }
    }

The module registry guarantees one evaluation per resolved URL, which is not the same as one evaluation per process. Two copies in node_modules, both package conditions, a query string, a second bundle on the same page: any of them evaluates the module again, and defining an element twice throws.

The guard has to consult something outside the module, because whatever is duplicated brings its module level state with it. Here the browser's element registry is the shared source of truth, which is the ideal case. When there is no such registry, a namespaced property on globalThis is the honest substitute.

An init function is not wrong, and it is a different design: it moves the decision to the caller and makes the effect explicit, at the cost of every consumer remembering. For a polyfill or an element registration, importing for the effect is the convention, so it should be safe to do twice.`,
    explanation: `Trusting the registry is the answer that works right up to the day someone installs a second copy of your package, and then fails at load with an error naming a duplicate element rather than a duplicate module.

A module level boolean is precisely the state that gets duplicated. Each copy has its own, each one is false, and each one registers.

The init function shifts responsibility rather than removing the problem: two copies with two callers still call twice, and the guard is still what saves it.`,
    hints: ['What does a second copy of the module bring with it?'],
    tags: ['modules', 'side-effects', 'coding'],
  },
  {
    id: 'sideeffects-false-scenario',
    type: 'scenario',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'A polyfill imported for its side effect works in development and is missing from the production bundle. Nothing else changed. What is the most likely cause?',
    options: [
      'The package declares "sideEffects": false, so the bundler treated an import with no bindings as removable',
      'The production build resolves the browser condition, which maps the polyfill to an empty file',
      'Dynamic imports are inlined in production, changing the evaluation order',
      'Minification removed the module because none of its exports are used',
    ],
    correctOption: 0,
    answerInFull: `"sideEffects": false is a promise to the bundler: nothing in this package does anything except define exports. Under that promise an import with no bindings is unreachable code, and dropping it is correct. Development builds usually skip that analysis, which is why the symptom only appears in production.

The fix is to tell the truth about the files that do have effects:

    { "sideEffects": ["./src/polyfills.js", "*.css"] }

The wider point is that a side effect import is the one import a bundler cannot verify. Everything else has a binding that is either used or not; this one has nothing to look at, so it relies entirely on the flag.

If the package is not yours, the workarounds are to import something from it that is genuinely used, or to move the import into an entry point the bundler will not tree shake.

This is also the reason to be careful before adding the flag to your own package. It is a real optimisation and it is a claim about every file you ship, including the one that installs something on globalThis or defines a custom element.`,
    explanation: `Minifiers work inside a module and do not remove imports. The decision to drop a whole module belongs to the bundler's module graph analysis.

A browser condition mapping to an empty file is a real pattern for Node-only code, and it would fail identically in development, since conditions are resolved the same way in both builds.

Dynamic imports change when a module evaluates, not whether it survives the build, and this import is static.`,
    hints: ['What can a bundler check about an import with no bindings?'],
    tags: ['modules', 'side-effects', 'tooling', 'scenario'],
  },
  {
    id: 'exports-field-concept',
    type: 'concept',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'After a dependency upgrade, import helper from "pkg/lib/helper.js" fails to resolve, though the file is still in node_modules. What did the package do?',
    options: [
      'It published as a single bundled file, so the path no longer exists at run time',
      'It moved to ES modules, and deep imports only work with require',
      'It added an exports field, which is an allow list: subpaths it does not name cannot be imported at all',
      'It marked the file private in package.json, which the loader honours per file',
    ],
    correctOption: 2,
    answerInFull: `The exports field does two jobs, and the second one is the surprise. It maps subpaths and conditions to files, and it makes everything it does not map unreachable.

    {
      "exports": {
        ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
        "./parser": "./dist/parser.mjs"
      }
    }

With that in place, pkg and pkg/parser resolve, and pkg/lib/helper.js does not, whether or not the file is sitting there. Reaching into a package's internals was always a privilege rather than an API, and this is the field that finally enforces it.

The fix is to use what the package exports, or to ask the maintainer to add the subpath. Patching node_modules or importing the file by relative path works and buys you a problem at the next upgrade.

While you are in there, the conditions are the other half worth knowing: import and require select by how the file is being loaded, node and browser by where, and a package can end up loaded twice, once per condition, each copy with its own state.`,
    explanation: `Deep imports are unaffected by which module system a package uses. A CommonJS package with an exports field restricts require exactly the same way.

There is no per file private marker. The allow list is the mechanism, and it is all or nothing per subpath.

A bundled package would fail with the file genuinely missing, which is a different error and easy to check. Here the file exists and the resolver refuses it.`,
    hints: ['What does a field that maps subpaths imply about the subpaths it does not map?'],
    tags: ['modules', 'resolution', 'packaging'],
  },
  {
    id: 'duplicate-instance-debugging',
    type: 'debugging',
    form: 'choice',
    difficulty: 'hard',
    prompt:
      'A validation library throws "expected a Schema" on an object that is very obviously a Schema, built by the same library. Everything works locally and fails in the deployed app. What is happening?',
    options: [
      'The class was tree shaken out of the production build and the check falls back to a different constructor',
      'The library uses a private field, and private fields do not survive minification',
      'The object crossed a serialisation boundary, so it is a plain object wearing the right shape',
      'Two copies of the library are loaded — different versions in node_modules, or both package conditions — so instanceof compares against a class from the other copy',
    ],
    correctOption: 3,
    answerInFull: `Two modules, two classes, one failed instanceof. The check compares a prototype from one copy against the constructor from the other, and neither copy is wrong.

How you get there is always resolution. Two versions of the library installed at different depths, so different importers resolve to different files. Or one version loaded through both conditions, so the ES module build and the CommonJS build are both in the process. Or a bundled dependency carrying its own copy.

    npm ls the-library    # more than one line is the answer

Fixes, in order of preference: deduplicate so one copy is installed, then make it a peer dependency so consumers own the version, then have the library use a branded check rather than instanceof — a symbol or a static isSchema — so identity survives duplication.

The reason it works locally and fails deployed is nearly always that the install trees differ. A lockfile, and the same install command in both places, is what stops that class of surprise.

This is the dual package hazard whenever the two copies are the two conditions of one package, and it is why a package with internal state deserves care about being dual published at all.`,
    explanation: `Serialisation produces the same message and is easy to rule out: the object would have lost its methods, and it has them.

Tree shaking never leaves a class half present. If it were removed, construction would fail rather than the check.

Private fields survive minification, and a brand check with a private field is one of the more robust identity mechanisms. Its failure mode would also be identical across environments.`,
    hints: ['What does instanceof actually compare, and what is duplicated here?'],
    tags: ['modules', 'resolution', 'debugging'],
  },
  {
    id: 'dynamic-side-effect-output',
    type: 'output',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'setup.js logs "setup" at its top level. This module is imported and the button is never clicked. What is printed?',
    code: `console.log('module body')

button.addEventListener('click', async () => {
  const { configure } = await import('./setup.js')
  configure()
})`,
    options: [
      '"setup" then "module body", because the import is hoisted to the top of the module',
      '"module body" only, because a dynamic import evaluates nothing until it is called',
      '"module body" then "setup", because dynamic imports are still resolved during loading',
      'Nothing, because the module body does not run until an event fires',
    ],
    correctOption: 1,
    answerInFull: `"module body", and nothing else. import() is an operator that runs when it is reached, so setup.js is not fetched, not evaluated, and its side effect does not happen until someone clicks.

That is exactly the difference from a static import, which is part of the graph and therefore evaluated before the importing module body runs at all.

    import { configure } from './setup.js' // 'setup' prints before 'module body'

Both facts in one sentence: a static import is a promise that the module has already run; a dynamic import is a promise, in the ordinary sense, that it will.

The consequence worth stating is about side effects specifically. Moving a polyfill behind a dynamic import defers it past code that may already need it, and moving an expensive registration behind one is often the whole point. Which of those you are doing is a design decision, not a detail of the syntax.

A second click imports again, gets the same module from the registry, and does not evaluate it again. The promise resolves immediately, still asynchronously.`,
    explanation: `Hoisting applies to the import declaration, which this is not. Nothing about import() moves.

Being resolved during loading is what a bundler does with the specifier, not what the runtime does with the module: the chunk may be known at build time and it is still not evaluated until requested.

The module body runs when the module is imported, which has already happened; only the dynamic part is waiting.`,
    hints: ['When does an operator run, compared with a declaration?'],
    tags: ['modules', 'side-effects', 'esm'],
  },
  {
    id: 'file-next-to-module-coding',
    type: 'coding',
    form: 'choice',
    difficulty: 'medium',
    prompt:
      'An ES module needs to read a data file that ships beside it. Which way of finding the path is correct?',
    options: [
      "require.resolve('./data.json'), imported from node:module",
      "path.join(__dirname, 'data.json'), the same as the CommonJS version",
      "new URL('./data.json', import.meta.url), which resolves against the module own URL",
      "path.resolve('./data.json'), which resolves against the module directory",
    ],
    correctOption: 2,
    answerInFull: `import.meta.url is the module's own URL, and resolving a relative path against it is how a module finds anything next to itself:

    const data = JSON.parse(
      await readFile(new URL('./data.json', import.meta.url), 'utf8'),
    )

Node's fs functions accept a file URL directly, so no conversion is needed. When something does need a string path, fileURLToPath from node:url is the correct converter, and manually stripping file:// is the wrong one: it breaks on spaces and on Windows.

Recent Node versions also expose import.meta.dirname and import.meta.filename, which are the direct replacements for the CommonJS pair and read better when you want a directory.

The thing to say alongside the answer is why __dirname is gone rather than merely renamed. A module has a URL, not a path — it may not be a file at all — so the identity a module gets is a URL, and everything else is derived from it.`,
    explanation: `__dirname is a CommonJS wrapper variable and simply does not exist in a module. The error is immediate and clear, which is the friendly case.

path.resolve resolves against the process working directory, not the module, so it works when you run from the project root and fails from anywhere else. That is the answer that passes tests and fails in production.

require.resolve through createRequire does work, and it is the tool for finding a package, not a data file beside you. Reaching for it here adds a CommonJS shim to solve something the module system answers directly.`,
    hints: ['What identity does a module have, and what is a path relative to?'],
    tags: ['modules', 'resolution', 'coding'],
  },
  {
    id: 'resolution-interview',
    type: 'interview',
    form: 'open',
    difficulty: 'hard',
    prompt:
      'Take me through what happens between writing an import and the module running, and where that process goes wrong in real projects.',
    answerInFull: `- Resolution. The specifier form decides the algorithm: relative resolves against the importing module URL with no extension guessing, absolute is taken as written, bare walks node_modules in Node or needs an import map in a browser. If a package is found, its package.json decides the file — exports first, mapping subpaths and conditions such as import, require, node and browser, and restricting anything it does not name; main and module for older packages.
- Registry lookup. The resolved URL is the key. If it is there, the existing module is used, in whatever state it is in. Nothing compares contents.
- Fetch, parse, link. The module and everything it imports are loaded and parsed, and the bindings are wired up. Missing exports are caught here, before any evaluation.
- Evaluation. Depth first through the import lists, each module once. A module body runs after everything it imports, which is what "importing for a side effect" relies on.

Where it goes wrong is mostly step one and step two. Extension guessing disappearing breaks a CommonJS to module migration. An exports field added upstream breaks deep imports on an upgrade, with a resolution error rather than a deprecation. Two copies of a package — two versions installed, or both conditions loaded from one dual published package — resolve to two URLs, and then two modules hold two sets of state, instanceof stops working between them, and any singleton the package keeps is duplicated. That last one is the dual package hazard, and it is worth naming as the thing that makes shipping both formats a real decision.

Side effects have their own failure. An import with no bindings gives a bundler nothing to check, so it relies entirely on the sideEffects flag in package.json. A package that claims false while installing a polyfill loses that polyfill in production builds only.

What I would actually do about all of it: one lockfile and the same install everywhere, npm ls when identity checks start failing, brand checks instead of instanceof in library code, and honesty in the sideEffects field.`,
    explanation: `The structure is what is being marked here: resolve, look up, link, evaluate, in that order, with the registry keyed by the resolved URL. Someone who describes it as a lookup step separate from the resolution step will get the duplicate module questions right without having memorised them.

The second half separates experience from theory. Extension guessing, the exports allow list and the dual package hazard are the three that consume real days, and naming what you would run to diagnose them is worth more than the explanation itself.`,
    hints: [],
    tags: ['modules', 'resolution', 'design'],
  },
]
