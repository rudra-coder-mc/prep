import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `Every property you have ever written carries three flags you have
      probably never set. They decide whether a write sticks, whether Object
      keys and JSON see the property, and whether it can be deleted or
      redefined. A property literal sets all three to true, which is why most
      code never notices them. The built in objects do not. Array length, class
      methods and everything on a prototype are shaped by these flags, and so
      is every object a library hands you.

      Accessors are the other half. A getter looks like a property and runs
      like a function, which is how length, size and most framework reactivity
      work. It is also why spreading an object can silently freeze a value that
      used to be computed. This topic is what lets you read a property
      descriptor and know what the object is going to do.`,
  },
  {
    title: 'A property is four things',
    heading: 'A property is four things',
    script: `A data property has a value and three attributes. Writable: does
      assignment change the value. Enumerable: does for in, Object keys,
      spread and JSON list it. Configurable: can it be deleted, can its
      attributes be changed, can it be switched between a data property and
      an accessor.

      Assignment and literals create properties with all three true. Object
      define property creates them with every attribute you did not mention
      set to false. That is the opposite default, and it is the source of most
      surprises with it. Define a property with only a value, and you have
      made something read only, hidden from every listing, and impossible to
      delete.

      Watch what happens in the walkthrough when the code then assigns to it.
      In sloppy code the write fails silently. In strict code, which is every
      module and every class body, the same line throws. Either way the value
      is unchanged, and it is still invisible to Object keys and to JSON. It
      is there. Read it directly and you get seven.`,
  },
  {
    title: 'Getters and setters',
    heading: 'Getters and setters',
    script: `An accessor property has no value and no writable flag. It has a get
      function, a set function, or both, and reading or assigning the property
      calls them. The temperature example stores celsius and exposes
      fahrenheit as a getter and setter pair, so assigning fahrenheit converts
      and stores, and reading it converts back.

      Two rules worth holding onto. A getter with no setter makes the property
      read only, with the same silent or throwing failure as a non writable
      data property. And a setter has to store its value somewhere other than
      the property it guards, because assigning to the same name inside the
      setter calls the setter again, forever, until the stack runs out.

      Getters run on every read, through whatever this the read happened on.
      That is what class relies on: a getter on the prototype reads fields
      from the instance it was called through. And it is what a lazy property
      pattern pays for: compute once on the first read, then redefine the
      property as a plain value so later reads cost nothing.`,
  },
  {
    title: 'Who sees which property',
    heading: 'Who sees which property',
    script: `Every way of listing properties draws its own line, and the table in
      the lesson is worth a minute of your time. Two rows matter most.

      For in is the only listing that walks the prototype chain. That is why
      it was the wrong loop for arrays the moment anyone added a method to the
      array prototype, and it is why it is almost never the loop you want.

      And spread copies enumerable symbol keys, where Object keys and JSON do
      not. So a symbol is a way to hide a property from JSON, and it is not a
      way to hide it from a copy.

      One more thing spread does: it reads through getters. The copy gets
      whatever the getter returned at that moment, as a plain data property,
      and the accessor is gone. If you want to copy the accessor itself, you
      copy its descriptor.`,
  },
  {
    title: 'Freeze, seal and prevent extensions',
    heading: 'Freeze, seal and prevent extensions',
    script: `Three built ins lock an object down, each a little more than the
      last. Prevent extensions means no new properties. Seal means no new
      properties and no deleting or reshaping the existing ones, though their
      values can still change. Freeze means sealed, and every data property
      is read only as well. Nothing about the object's own properties can
      change.

      All three are one level deep. A frozen object holding an array holds a
      mutable array. And all three report failure the way property attributes
      do: silently in sloppy code, as a type error in strict code. A freeze
      that nobody has tested under strict mode is a freeze that nobody has
      tested.

      There is no frozen flag on the object. Is frozen checks that it is not
      extensible and that every own property is locked down, which is why it
      is true of an empty object that has had prevent extensions called on it.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what Object freeze guarantees, say that the object's own
      properties cannot be added, removed, reassigned or reconfigured. Then
      give the two limits without being asked: it is one level deep, so nested
      objects are still mutable, and it is enforced by a throw only in strict
      code. Most answers stop at makes it immutable, and the two limits are
      what the question is for.

      Asked for the difference between Object keys and for in, say that for
      in includes enumerable properties inherited from the prototype chain,
      and Object keys lists own enumerable properties only. Then add that
      neither sees non enumerable properties or symbol keys, because the
      follow up question is usually which one does.`,
  },
]
