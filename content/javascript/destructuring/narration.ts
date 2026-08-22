import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Destructuring is the syntax you read most and think about least. It is
      on the first line of nearly every function that takes an options object,
      every React component, every import. Most of the time it does the obvious
      thing, which is exactly why the cases where it does not are so hard to
      spot. A default that never fires because the value was null. A nested
      pattern that throws on the one response shape nobody tested. A copy that
      is still sharing everything inside it.

      The rules are small. A pattern reads properties. A default fills in
      undefined and nothing else. Rest collects what is left. Knowing those
      three precisely is what separates code that handles a partial response
      from code that crashes on it.`,
  },
  {
    title: 'Matching a shape',
    heading: 'Matching a shape',
    script: `A destructuring pattern is an object or array literal written on the
      left of the equals sign. Each name in it becomes a variable, filled by
      reading the matching property of whatever is on the right. It is property
      access written as a shape, and nothing more.

      That means nothing is copied that the longhand would not copy. A primitive
      comes across as a value. An object comes across as a reference to the
      same object. The thing on the right is untouched.

      Watch the walkthrough and notice the colons. When a property name is
      followed by a colon and another pattern, that property is not bound to a
      variable. The colon means go into this property and keep matching. So
      data and user never become variables. Only the names at the leaves do.

      Array patterns work on anything iterable, not just arrays. Destructure a
      string and you get characters. Destructure a set and you get its members
      in order. And a pattern longer than the thing it matches just fills the
      rest with undefined.`,
  },
  {
    title: 'Defaults trigger on undefined only',
    heading: 'Defaults trigger on `undefined` only',
    script: `A default is used when the property read gives undefined. That is the
      whole rule, and every surprise in this topic is a case of expecting it to
      be wider than it is.

      Zero, the empty string, false and null are all real values as far as a
      pattern is concerned. Null is the one that bites, because it is what
      APIs send to mean nothing here, and it sails straight past a default.

      Defaults are expressions, and they are evaluated lazily, left to right.
      A default that calls a function only calls it when it is actually needed.

      The same rule applies to a whole nested pattern. Writing data, colon,
      inner pattern, equals empty object says: if data is undefined, match the
      inner pattern against an empty object instead. That is how a nested
      pattern survives a missing branch. And it still throws if data is null,
      for the same reason the default did not fire.`,
  },
  {
    title: 'Renaming and nesting',
    heading: 'Renaming and nesting',
    script: `Property, colon, target reads the property and binds it under a
      different name, or matches it against a further pattern. The left of the
      colon is always the source key. The right is always what happens to the
      value. People get this backwards constantly, so say it to yourself once
      more: left is where it comes from, right is where it goes.

      The key can be computed with square brackets, which is the destructuring
      equivalent of bracket access.

      Reading from a nested pattern means reading into the intermediate object,
      so the intermediate has to exist. A pattern never checks for you. Ask for
      profile's name on a user with no profile and you are reading a property
      of undefined, and it throws exactly as the longhand would.`,
  },
  {
    title: 'Rest collects, spread spreads',
    heading: 'Rest collects, spread spreads',
    script: `The same three dots do opposite jobs depending on which side of the
      equals sign they are on.

      Rest appears in a pattern. It collects everything the pattern did not
      name, and it has to be last. In an array pattern it produces a new array
      of the remaining elements. In an object pattern it produces a new object
      holding the remaining own enumerable properties.

      Spread appears in a literal or a call. It expands one value into many,
      and it can go anywhere. Spreading two arrays into a literal concatenates
      them. Spreading defaults and then overrides into an object merges them,
      with later keys winning. Spreading an array into a call passes its
      elements as separate arguments.

      Both are one level deep. The object rest gives you holds the same nested
      objects the original did. Spreading copies own enumerable properties and
      nothing inherited. Past the first level, everything is shared, exactly as
      with any other shallow copy.`,
  },
  {
    title: 'In parameters',
    heading: 'In parameters',
    script: `A parameter is a binding like any other, so a pattern can stand where
      a parameter name would. That is what an options object is.

      There are two layers of defaults in a well written one. The inner
      defaults cover missing properties. The outer default, equals empty
      object, covers the call with no argument at all. Without it, calling the
      function with nothing tries to destructure undefined, and that throws
      before the body even runs. A function taking an options object nearly
      always wants both.

      One more idiom. Swapping two values by destructuring an array literal
      works, but at the start of a line it needs a leading semicolon. Without
      one, the previous line's value gets indexed by your array, and the error
      you get will not mention destructuring at all.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what a destructuring default applies to, the answer is undefined,
      and nothing else. Null, zero, the empty string and false all come through
      as themselves. If the point needs making, say that an API sending null
      for a missing field bypasses every default in the pattern, and that the
      nullish coalescing operator is how you handle it afterwards.

      Asked whether destructuring with a rest element is a copy of the object,
      say a shallow one. New outer object, same inner objects, own enumerable
      properties only. It is the same as spreading into a literal, and it has
      the same limits.`,
  },
]
