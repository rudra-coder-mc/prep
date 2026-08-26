import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Two systems, still both here',
    heading: 'Why this matters',
    script: `JavaScript spent a decade with two module systems, and both are still
      in every codebase you will open. CommonJS is what Node shipped and what
      most of npm was published as. ES modules are what the language specified,
      what browsers load, and what every new project targets.

      They are not two spellings of the same idea. One resolves at run time and
      hands you a value. The other resolves before any code runs and hands you
      a live view.

      Interviews ask about this because the seam between the two is where a
      whole class of real bugs lives. A stale import. A cycle that returns half
      an object. A dependency that cannot be loaded conditionally.`,
  },
  {
    title: 'The two differences everything follows from',
    heading: 'The two systems side by side',
    script: `Two rows of the comparison matter, and the rest are consequences.

      When it resolves. An ES module is parsed, resolved and linked before
      anything is evaluated. A require resolves when the call runs, wherever
      that call happens to be.

      What you get. An ES module export is a live, read only binding onto the
      exporting module's variable. A require gives you whatever module dot
      exports pointed at when the module finished.

      From those two: modules load asynchronously and support top level await,
      requires are synchronous. Modules are always strict, CommonJS is sloppy
      unless the directive is there. And loading something conditionally means
      the dynamic import form on one side, and an ordinary if statement on the
      other.`,
  },
  {
    title: 'Live bindings against copied values',
    heading: 'Live bindings against copied values',
    script: `A module that exports a counter, and an importer that calls bump and
      then reads the count, sees the new value. The import is a view of the
      exporter's binding, not a snapshot of it. What the importer cannot do is
      assign to it. Exactly one module owns that binding, and everyone else
      reads.

      The CommonJS version of the same file prints zero. The number was copied
      into the exports object when the module was built, and copied again when
      the importer destructured it. Two copies, and bump moves neither.

      That is where the advice never to destructure a require comes from. It
      applies exactly when the module has mutable state. Read the property off
      the required object instead, so both sides share one object. For a module
      that exports only functions, destructuring is fine.`,
  },
  {
    title: 'What static structure buys',
    heading: 'Static structure, and what it buys',
    script: `Import and export are declarations, not calls. They hoist to the top
      of the module, they cannot be nested in a block or a function, and their
      specifiers have to be string literals.

      That restriction is the point. Because the graph is known before anything
      runs, every module in it can be fetched and parsed in parallel, which is
      what makes loading over a network viable. Names are checked while linking,
      so importing something a module does not export fails before either file
      executes. And a bundler can prove an export is never used and drop it,
      which is all tree shaking is.

      None of that is available to require, because require is a function call
      and its argument can be anything. That was the trade. CommonJS bought run
      time flexibility and gave up everything that needs the graph in advance.

      The flexibility came back separately, as the dynamic import form. It is an
      operator rather than a declaration, it takes any expression, it returns a
      promise for the module's namespace object, and the default export arrives
      as the default property of that namespace.`,
  },
  {
    title: 'Cycles, and how each one fails',
    heading: 'Cycles',
    script: `Both systems survive a cycle, and both hand you something incomplete.
      What differs is how you find out.

      CommonJS gives the second module a partially populated exports object,
      holding whatever had been assigned before the cycle came back round. You
      get undefined properties at run time, usually far from the cause.

      ES modules hoist and link the whole graph first, so the bindings exist
      before the values do. A function declaration is initialised early, which
      is why cycles between functions usually work and survive unnoticed in real
      codebases. A const or a let read during evaluation, before its own module
      has run, throws a reference error from the temporal dead zone.

      Neither is pleasant. The module version is the better of the two bad
      outcomes, because it throws at the read and names the binding. The real
      fix is to break the cycle, usually by moving the shared thing into a third
      module.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked for the difference, start from resolution and derive the rest.
      Modules are resolved and linked before evaluation, require runs when the
      call runs. Then live bindings against a copied value. Then that modules
      are always strict, have their own scope, and use import meta url where
      CommonJS has dirname. Finish with conditional loading.

      Asked why you cannot import inside an if, the answer is that the graph has
      to be knowable without running the code, and that this is what pays for
      parallel fetching, link time name checks and tree shaking. The dynamic
      form exists for decisions that genuinely happen at run time.

      Expect follow-ups on what a cycle does, on why a destructured require went
      stale, and on whether a package should publish both formats. On that last
      one, the answer worth giving names the dual package hazard: two copies of
      the same module in one process, each with its own state, which breaks
      instanceof and any singleton the package holds.`,
  },
]
