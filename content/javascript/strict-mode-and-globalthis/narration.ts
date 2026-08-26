import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'The rules before the code',
    heading: 'Why this matters',
    script: `Two pieces of the runtime decide what your code means before a line of
      it runs. Which set of language rules is in force, and what the word global
      refers to. Neither is visible in the source, and both change the behaviour
      of code that looks identical either way.

      Strict mode is not a linter setting and not a style choice. It is a second
      set of rules the same syntax is read under. Almost nobody types the
      directive any more, because modules and class bodies switch it on for you.

      Global this is the other half. One name for the global object in a browser,
      a worker and in Node, and a much smaller thing than most people assume.`,
  },
  {
    title: 'Three piles of changes',
    heading: 'What strict mode changes',
    script: `The changes fall into three piles.

      First, silence becomes an error. Assigning to a name that was never
      declared creates a global in sloppy mode and throws a reference error in
      strict mode. Writing to a frozen property, or to an accessor with only a
      getter, does nothing at all in sloppy mode and throws a type error in
      strict mode. Deleting a variable or a non-configurable property returns
      false in sloppy mode and is a syntax error in strict mode.

      Second, this stops falling back to the global object. In a plain call,
      this is undefined in strict mode and the global object in sloppy mode.
      That single line is why a method pulled off its object throws in modern
      code, instead of quietly reading and writing globals.

      Third, some syntax is simply gone. Duplicate parameter names, octal
      literals and the with statement are all syntax errors. The arguments
      object no longer aliases the named parameters, so reassigning a parameter
      leaves arguments alone. And a handful of words reserved for the future
      cannot be used as identifiers.`,
  },
  {
    title: 'Where the mode comes from',
    heading: 'Where the mode comes from',
    script: `The directive turns strict mode on for a file, or for one function
      body, and everything nested inside it. It cannot be turned off again
      further in.

      You rarely write it, because three things are strict whether you ask or
      not. Every ES module. Every class body, including its methods and static
      blocks. And in Node, every file the package treats as a module. What is
      left sloppy is a classic script tag, a CommonJS file without the
      directive, and code evaluated from sloppy code.

      There is one real trap. The directive is a string expression, and it only
      counts when nothing comes before it. Comments are fine. A statement is
      not. Put one declaration above it and the file is sloppy, with no warning
      and no sign of it when you read the file.

      The mode is also lexical. It belongs to where code is written, never to
      where it is called from. A strict module importing a sloppy helper does
      not make that helper strict.`,
  },
  {
    title: 'Three scopes people all call global',
    heading: 'globalThis and the global object',
    script: `Every runtime has one object at the root of the environment, and each
      one used to call it something different. Window in a page, self in a
      worker, global in Node. Global this is the name that works in all of them,
      which is what lets one piece of code detect a feature or install a
      polyfill anywhere.

      What surprises people is how little of their own code is on it. There are
      three scopes here, not one. Var declarations and function declarations at
      the top level of a classic script become properties of the global object.
      Let, const and class at the top level of that same script land one scope
      in, in the global lexical scope. They resolve normally, but they are not
      properties, so reading them off global this gives you undefined.

      And inside a module, none of it is global. Every top level declaration
      stays in module scope, which is why modules stopped colliding with each
      other. The only way a module puts a name on the global object is to write
      it there deliberately.

      Top level this follows the same split. The global object in a sloppy
      script, undefined in a module, and the exports object in a CommonJS file.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what strict mode changes, lead with the two that bite.
      Undeclared assignments throw instead of creating a global, and this is
      undefined in a plain call instead of the global object. Then say that
      writes which used to fail silently now throw. Then the syntax it removes.

      Asked whether you still write the directive, the answer is only in a
      script or a CommonJS file. Modules and class bodies are strict already, so
      in most codebases the line is redundant. And a directive that is not the
      first statement does nothing at all.

      Asked why a name declared at the top of a file is missing from global
      this, there are two answers and you should give both. Either the file is a
      module, so top level declarations are module scoped, or the declaration is
      let or const, which live in the global lexical scope rather than on the
      global object.

      One more worth having ready. Deleting the directive from an old file is a
      behaviour change, not a cleanup. If the file is still sloppy underneath,
      the silent failures come back with it.`,
  },
]
