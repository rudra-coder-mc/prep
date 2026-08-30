import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Not the code you wrote',
    heading: 'Why this matters',
    script: `The code that runs in production is not the code you wrote. Between
      the two sits a bundler, and it has rewritten your modules into functions,
      dropped exports it decided nobody used, replaced some of your expressions
      with constants, renamed almost every identifier, and split the result into
      files with hashes in their names.

      Nearly all of that is invisible, which is exactly why it is worth
      understanding. The bugs it causes are the ones that only exist in a
      production build, and the optimisations it offers only work if you write
      code it can reason about.`,
  },
  {
    title: 'The five jobs',
    heading: 'What a bundler actually does',
    script: `Five jobs, in roughly this order.

      It resolves the module graph, using its own implementation of the
      resolution rules plus whatever aliases and conditions you configured. That
      is why a build can find a module the runtime would not, and the reverse.

      It transforms each file. TypeScript, JSX, newer syntax down to older
      syntax.

      It joins the graph into chunks. Each module becomes a function, collected
      in a registry, with a small runtime that evaluates one on first use and
      caches the result. That is the module system, rebuilt in user code. Module
      scope becomes function scope, and live bindings are emulated with getters
      rather than being native.

      It removes what it can prove is unreachable. Unused exports, branches
      behind values it inlined, whole modules nobody imports.

      And it minifies and emits. Identifiers renamed, file names hashed for
      caching, and a source map to get back to what you wrote.`,
  },
  {
    title: 'What tree shaking needs from you',
    heading: 'Tree shaking, and what it needs from you',
    script: `Removing an unused export sounds simple and is not, because removing
      code is only safe if the code does nothing else.

      The graph has to be static. Only import and export declarations can be
      followed without running the program, which is why shaking works on ES
      modules and barely works on CommonJS.

      Side effects have to be knowable. A module that registers something,
      patches a prototype or writes to the global object cannot be dropped just
      because its exports are unused. The bundler assumes the worst unless the
      side effects field in package json says otherwise.

      And the use has to be visible. An export reached through a computed
      property usually cannot be dropped, and neither can one behind a barrel
      file that re-exports forty modules, because now the bundler has to prove
      all forty are safe to discard and one side effect anywhere keeps the lot.
      That is where real bundles get fat.`,
  },
  {
    title: 'Values that stop being values',
    heading: 'Values that stop being values',
    script: `Node env is not read at run time in a bundled browser app. It is
      replaced with a string during the build, so the branch around it becomes
      constant and the dead half is removed. That is how a development-only
      warning costs nothing in production.

      Everything exposed to your code the same way follows the same rule. An
      environment variable baked into a bundle is a value chosen when the bundle
      was built, and changing it afterwards needs a rebuild rather than a
      restart. This is the single most common surprise when a frontend is
      deployed as a container, and the fix is to decide honestly which values
      are build time and which have to be fetched when the app starts.`,
  },
  {
    title: 'Where development and production diverge',
    heading: 'Where development and production diverge',
    script: `Modern dev servers do not bundle. They serve your modules to the
      browser as modules, transformed one at a time, which is what makes a
      reload fast. The production build is a different pipeline over the same
      source.

      So they differ in three ways worth knowing before they bite. Tree shaking
      and dead code removal usually run only in the production build, so a
      mistaken side effects claim has no symptom in development. Minification
      renames things, so anything depending on a function or class name works in
      development and fails in production. And module count and evaluation order
      can differ, because bundling concatenates a graph the dev server evaluates
      as separate files.

      The rule that follows is short. Anything you rely on has to be verified
      against a production build, not against the dev server. Making the two
      identical sounds rigorous and costs you the fast feedback loop that is the
      dev server's entire reason to exist.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what a bundler does, give the five jobs. Resolve the graph,
      transform each file, join them into chunks where each module becomes a
      function with a tiny registry runtime, remove what it can prove is unused,
      minify and emit. Then say what that costs and buys. Tree shaking needs
      static imports and honest side effect information. Dynamic imports become
      split points. Some values are inlined at build time.

      Asked why something is only broken in production, name the three usual
      causes in the order you would check them. A value inlined at build time,
      where a restart does not change it and a rebuild does. Code depending on a
      name the minifier changed, such as a constructor name comparison. And a
      side effects claim that is not true, so a polyfill was shaken out of the
      production build only.

      Then say what you would do about it, which is to reproduce against a
      production build locally and put that build in continuous integration, so
      the gap is measured in minutes rather than in deploys.`,
  },
]
