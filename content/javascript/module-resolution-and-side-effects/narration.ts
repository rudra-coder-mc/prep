import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Two questions every import asks',
    heading: 'Why this matters',
    script: `Every import is two questions the runtime answers for you. Which file
      does this name mean, and has it already run?

      Both are invisible until they go wrong, and then they go wrong in ways
      that look like anything but a module problem. A package that works in Node
      and not in the browser. A polyfill that never installed itself. A
      configuration module that appears to run twice. Two copies of a library
      that refuse to recognise each other's objects.

      All four are resolution or evaluation, and none of them says so.`,
  },
  {
    title: 'Three kinds of specifier',
    heading: 'Three kinds of specifier',
    script: `The string in an import decides which algorithm runs.

      A relative specifier, starting with a dot, resolves against the importing
      module's own URL. In Node's module loader the extension is required.
      Nothing guesses dot js for you the way require did, and nothing resolves a
      directory to its index file either. That is the single most common failure
      when a file moves from one system to the other.

      An absolute path or a full URL is taken as written.

      A bare specifier is a package name, and it is the one with machinery
      behind it. Node walks up the directory tree looking in each node modules
      folder. A browser has no such tree, so it refuses a bare specifier outright
      unless an import map says what the name means. Resolving those names is
      the job bundlers were originally doing.`,
  },
  {
    title: 'What the package decides',
    heading: 'What a package decides',
    script: `Finding the package directory is not the end. Its package json decides
      which file you actually get, and the modern answer is the exports field.

      Two things follow, and both surprise people.

      Conditions mean one package can hand out different files. Import and
      require are the two everyone meets. Node, browser, types and default are
      the rest. It is how a package ships both module systems, and it is also
      how the same package ends up loaded twice in one process, once per
      condition, each copy with its own state. That is the dual package hazard.
      It breaks instance of, and it duplicates any singleton the package holds.

      The second surprise is that exports is an allow list. Anything it does not
      name cannot be imported at all. Reaching into a package's internal files
      worked for years and stops working the day the package adds the field,
      which is why that upgrade breaks a build with a resolution error rather
      than a deprecation warning.`,
  },
  {
    title: 'Evaluated once, keyed by the resolved URL',
    heading: 'Evaluated once, keyed by what it resolved to',
    script: `A module is evaluated the first time it is imported and never again.
      Every later import of the same resolved URL gets the same namespace
      object, in the same state. That is what makes a module a reliable place
      for a singleton, and a bad way to reset anything.

      The key is the resolved URL, not the string you wrote. Two spellings that
      resolve to the same file share one module. Two paths that resolve
      differently do not, however identical their contents. Add a query string
      and you have a second module, which is useful for forcing a reload in
      development and is an accidental duplicate the rest of the time.

      Two copies of a package in node modules, or one package reached through
      both of its conditions, is the same situation with a more expensive shape.
      Two modules, two sets of state, and objects from one that fail an instance
      of check from the other.`,
  },
  {
    title: 'Importing for a side effect',
    heading: 'Importing for a side effect',
    script: `An import with no bindings runs a module for what it does rather than
      for what it exports. Polyfills, decorator metadata, a design system
      injecting its styles. The module's top level code runs once, at the point
      in the graph where it was reached, and that is the whole contract.

      It is fragile in one specific way. A side effect import has no bindings,
      so nothing in the importing file uses it, and a bundler is allowed to
      conclude the import can be dropped. The side effects field in a package
      json is exactly that promise: nothing in this package does anything but
      define exports. A package that makes the promise falsely loses its
      polyfill in production and not in development. The fix is to list the
      files that really do something.

      As for order, side effects happen in graph order, depth first, which means
      a module's effects have already happened before any module that imports it
      runs. Relying on more than that, on two unrelated branches of the graph
      running in a particular order, is relying on the order you happened to
      write your imports in.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked how an import of a package name finds a file: a bare specifier
      sends Node up the directory tree through node modules, and the package's
      exports field maps the subpath and the condition to an actual file while
      restricting everything it does not list. Browsers do none of that. They
      need an import map or a bundler.

      Asked why a module ran twice, the answer is that it resolved to two
      different URLs. Two copies in node modules, both package conditions
      loaded, a query string, or a symlink resolved differently. The registry is
      keyed by what the specifier resolved to, never by file contents.

      Expect a follow-up on the dual package hazard, and on why a bundler might
      drop an import that has no bindings. And if identity checks start failing
      in a deployed app and not locally, say what you would run first. Listing
      the installed tree and finding two copies of the library is usually the
      whole diagnosis.`,
  },
]
