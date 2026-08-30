import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Two kinds of member sit outside the plain field or method split, and
      both get asked about because both are misused. Static is for things
      that belong to the class rather than to any instance, and the misuse
      is reaching for it as a global. Hash private is the first real
      encapsulation JavaScript has had, and the misuse is treating it as
      the underscore convention with a new spelling, when its rules are
      stricter and its failures are different.

      The interview question behind both is the same. Where does this
      member live, who can reach it, and what happens when someone tries
      who cannot?`,
  },
  {
    title: 'What belongs to the class',
    heading: 'What belongs to the class',
    script: `A static member is a property of the class function itself. It is one
      value per class, not per instance, and it is the right home for three
      things: constants that describe the type, factory methods that know
      how to build an instance, and caches or registries shared by every
      instance.

      Inside a static method, this is the class, which matters for
      inheritance. A factory that writes new this rather than naming the
      class means a subclass calling it gets a subclass back. A static block
      runs once when the declaration is evaluated, with this as the class,
      and exists for set up that needs more than one expression.

      Static members are inherited through the class chain the previous
      topic drew. A subclass finds a static constant on its base, and a
      static field assigned in the subclass shadows it without touching the
      base.

      A static is not a module level constant with extra steps. If nothing
      about it is specific to the class, a plain const or function in the
      module is simpler and does not invite this confusion.`,
  },
  {
    title: 'What private guarantees',
    heading: 'What `#private` guarantees',
    script: `A private name starts with a hash and is declared in the class body.
      The guarantee is total. No code outside the class body can read,
      write, detect or enumerate it. Not with bracket access, not with
      Object keys or get own property names, not with stringify, not with a
      proxy.

      That is a different thing from an underscore prefix, which is a
      request, and from a closure over a variable, which hides state but
      needs each method to be a closure too. Three rules follow from the
      mechanism.

      A private name is not a property. Reading it is a lookup in a per
      class table keyed by the object, not a string key on the object.
      Bracket access with the hash spelled out reads an ordinary property
      of that name, which is undefined.

      Access is lexical. Only code written inside the class body can use
      the name, so a subclass cannot reach the base's private field even by
      the same name. Two classes can each declare the same private name and
      they are unrelated.

      And reading a private name on an object that does not have it throws
      a type error. Not undefined. The object lacks the brand.

      Follow the walkthrough. Object keys and stringify see nothing.
      Bracket access finds nothing. The brand check, hash name in object,
      is the one way to ask without throwing, and only from inside the
      class. And borrowing a method onto a plain object throws, because
      that object was never constructed as an instance.

      Private methods and private accessors follow the same rules, and a
      private static is a private on the class. They are installed at
      construction, so they are effectively non writable.`,
  },
  {
    title: 'Where each one breaks',
    heading: 'Where each one breaks',
    script: `Private fields and proxy. A proxy around an instance is a different
      object, and it does not carry the brand. Calling a method that touches
      a private field through the proxy throws, because inside the method
      this is the proxy. Libraries that wrap objects, which includes some
      reactivity systems, break on classes with private fields for this
      reason.

      Private fields and freeze. Freezing an instance does not freeze its
      private fields, because they are not properties. They can still be
      assigned on a frozen object.

      Static this after borrowing. Detach a static factory into a variable
      and call it, and this is lost, so new this throws. A static method is
      an ordinary function with an ordinary this.

      Names are declared once. Two static blocks are fine, two declarations
      of the same private name in one class is a syntax error, and a
      private name declared in a base is not visible in a subclass.

      Before private fields existed, the usual encapsulation was a WeakMap
      keyed by instance, in module scope. It still works, it is what the
      hash syntax compiles down to under transpilers, and it is the answer
      if an interviewer asks how you would do it without the syntax.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what hash private actually guarantees, say no access from
      outside the class body, by any means. Then the rules: not a property,
      lexically scoped, a brand that throws on the wrong object. And give
      the proxy consequence, because it marks the answer as experience.

      Asked how you would implement private state without the syntax, say a
      WeakMap in module scope keyed by the instance. Closures in a factory
      function are the other answer, with the cost that each instance gets
      its own copies of the methods.

      Asked when static is right, say factories, type level constants and
      shared caches. Not as a global with a namespace. A module export is
      simpler.`,
  },
]
