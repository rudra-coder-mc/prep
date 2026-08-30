import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why bother, if classes exist',
    heading: 'Why this matters',
    script: `You can write JavaScript for years using class syntax and never
      think about prototypes. Then something inherited shows up in a for in
      loop, or a deleted property comes back with an older value,
      or an interviewer asks what class actually compiles to, and the
      abstraction stops holding.

      There is one mechanism underneath all of it, and it is genuinely simpler
      than the syntax suggests. Once you have it, class syntax stops being magic
      and becomes shorthand.`,
  },
  {
    title: 'The chain',
    heading: 'The chain',
    script: `Every object has a hidden link to another object, or to null.

      Reading a property checks the object itself first. If it is not there, the
      engine follows the link and checks that object. Then the next one. It
      keeps going until it finds the property, or until it runs out of chain and
      hits null, at which point the answer is undefined.

      So a dog instance might have its own name. Its bark method is not on the
      instance, it is one link up, on the dog prototype. A speak method might be
      two links up, on the animal prototype. And toString is further up still,
      on the object prototype, which is where almost every chain ends.

      That is the whole model. A lookup is a walk up a chain of objects.`,
  },
  {
    title: 'Reading walks, writing does not',
    heading: 'Reading walks, writing does not',
    script: `This asymmetry is the single most useful thing to know in this
      topic, because it explains several behaviours that otherwise look
      arbitrary.

      Reading a property walks the chain. Writing a property does not. Assigning
      always creates or updates the property on the object you assigned to,
      never on the prototype it happened to be inherited from.

      That is called shadowing. The instance now has its own copy, which hides
      the inherited one. And it explains the puzzle people find so strange:
      delete that own property, and the inherited value appears again. Nothing
      came back from anywhere. The shadow was removed, so the walk goes one link
      further than it used to.`,
  },
  {
    title: 'Prototype versus the link itself',
    heading: '`prototype` versus `__proto__`',
    script: `The naming here is genuinely bad. State it as an equation and it
      stops being confusing.

      The word prototype, as a property, lives on a constructor function. It is
      the object that the instances that function creates will link to. The link
      itself, on every object, is a different thing, reached with Object dot get
      prototype of.

      So dog prototype is not dog's prototype. It is the prototype dog hands
      out. Ask an instance for its prototype and you get dog prototype. Ask the
      constructor function for its prototype and you get something else
      entirely. And an instance has no prototype property of its own at all.

      In real code, prefer get prototype of and set prototype of over the
      underscore underscore proto underscore underscore accessor. And avoid
      changing an object's prototype after creation, because engines deoptimise
      objects whose shape moves.`,
  },
  {
    title: 'What class really is',
    heading: 'What `class` really is',
    script: `Mostly the same mechanism, with much better syntax. Methods go on
      the prototype. Extends links the two prototypes together. Super reaches up
      the chain.

      But just sugar is the answer that gets probed, and it is not quite true.
      Class bodies are always in strict mode. A class cannot be called without
      new, it throws. Class declarations sit in the temporal dead zone rather
      than hoisting usefully. And class fields are assigned per instance rather
      than shared on the prototype, which is exactly why a method written as a
      class field gets a bound this and a normal method does not.

      So the accurate answer is that class is syntax over prototypes, plus a
      handful of real semantic differences. Naming even two of those differences is what
      separates a good answer from a rehearsed one.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked how property lookup works, describe the walk. Own property
      first, then up the chain link by link, until found or until null.

      Asked what class compiles to, say methods on the prototype and extends
      linking prototypes, and then immediately name the differences that are not
      sugar.

      Expect follow ups on why for in sees inherited properties while Object dot
      keys does not, on what has own property is for and why you would call it
      through Object dot prototype rather than directly, and on the difference
      between the instance of operator and comparing prototypes. All three are the
      same idea seen from different angles. Inheritance in this language is a
      chain of live objects, not a copy made at construction time.`,
  },
]
