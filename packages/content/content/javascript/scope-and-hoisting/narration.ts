import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Two questions in disguise',
    heading: 'Why this matters',
    script: `Scope answers one question. Which variable does this name refer to?
      Hoisting answers another. Does it exist yet? Almost every confusing thing
      in JavaScript is one of those two underneath. Every closure question,
      every this question, and every why is this undefined question.

      This is also the topic where the vocabulary does the most damage. The word
      hoisting makes people picture declarations being physically moved to the
      top of the file. That picture is a useful lie right up to the moment a let
      declaration throws a reference error, and then it stops explaining
      anything at all. So let us build the real picture instead.`,
  },
  {
    title: 'Scopes nest, and lookups go outward',
    heading: 'Scopes nest, lookups go outward',
    script: `A new scope is created by the script or module itself, by every
      function, and by every block. A block is anything in curly braces,
      including the bodies of if, for and try.

      A name is resolved by looking in the current scope, then the one enclosing
      it, then the one enclosing that, all the way out to the global scope. The
      first scope that has the name wins. If none of them has it, reading the
      name throws a reference error.

      The important part is what decides that chain. It is decided by where the
      code is written, not by who called it. That is what the word lexical
      means, and it is why you can read a function and know what its names refer
      to without running anything. Hold onto that, because it is the whole
      foundation of closures two topics from now.`,
  },
  {
    title: 'What hoisting actually is',
    heading: 'What hoisting actually is',
    script: `Before any code in a scope runs, the engine walks that scope and
      registers every declaration it finds. Nothing moves. What differs between
      the kinds of declaration is what each one is worth in the gap between
      being registered and being reached.

      A var declaration is registered and initialised to undefined. Reading it
      early gives you undefined rather than an error. A function declaration is
      registered completely, which is why you can call a helper defined further
      down the file. And let, const and class are registered but left
      uninitialised. Reading one before its declaration line throws a reference
      error.

      That gap, between a name being registered and being initialised, is the
      temporal dead zone. Say it that way in an interview. Not moved to the top.
      Registered before the code runs, with different starting values.`,
  },
  {
    title: 'Why the dead zone is a feature',
    heading: 'What hoisting actually is',
    script: `It is tempting to see the temporal dead zone as an inconvenience.
      It is the opposite. Consider what the alternative gives you.

      With var, reading a variable too early hands you undefined. That value
      then flows onward through your program and shows up somewhere completely
      different, later, as a confusing result that has nothing obviously to do
      with the line that caused it. With let, reading too early throws
      immediately, names the variable, and points at the line.

      One error is a bug you spend an afternoon on. The other is a stack trace.
      That is the trade the dead zone makes, and it is a good one.

      There is one thing to know about it. Typeof does not protect you here.
      Everywhere else, typeof on an undeclared name is safe. Inside a temporal
      dead zone, typeof throws like any other read.`,
  },
  {
    title: 'Var is function scoped, and that is the whole difference',
    heading: '`var` is function scoped, and that is the whole difference',
    script: `Take an if block inside a function, and declare a var inside that
      block. After the block, the var is still readable, because var ignores
      blocks entirely and belongs to the whole function. Do the same with let,
      and reading it after the block is a reference error, because let belongs
      to the block.

      Var has two more habits. It lets you redeclare the same name
      in the same scope without any complaint, which quietly turns a typo into
      working code. And at the top level of a script it creates a property on
      the global object. Let and const do neither of those things.

      One clarification people get wrong constantly. Const prevents reassigning
      the binding. It does not prevent mutating the value. A const object can
      have its properties changed all day long. If you want the other half, that
      is Object dot freeze, and freeze is shallow.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what hoisting is, the weak answer is that declarations move
      to the top. The strong answer is that declarations are registered before
      the code in a scope runs, and that what differs is the initial value: var
      starts as undefined, functions start fully defined, and let and const
      start uninitialised, which is the temporal dead zone.

      Expect follow ups on why the dead zone exists, on the difference between a
      function declaration and a function expression assigned to a var, and on
      what happens when you assign to a name nobody declared. That last one splits
      two ways. In non strict code it silently creates a global. In strict mode
      and in modules it throws. Modules are always strict, so in modern code it
      throws.`,
  },
]
