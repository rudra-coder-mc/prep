import type { Narration } from '@/content/schema'

export const narration: Narration = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    script: `For most of the language's life, a map was an object and a set was
      an array you called includes on. Both still work, and both have edges
      that the real collections were added to remove. An object's keys are
      always strings or symbols, it inherits toString and friends, it has no
      size, and includes on an array is a linear scan. Map and Set fix each
      of those, and WeakMap and WeakSet fix a different problem entirely.

      Interviewers ask when you would use a Map over an object because the
      answer has four parts and most people give one. And they ask about
      WeakMap because it is the one collection whose whole point is what it
      does not do.`,
  },
  {
    title: 'What Map does that an object cannot',
    heading: 'What `Map` does that an object cannot',
    script: `A Map holds key value pairs where the key can be anything: an
      object, a function, not a number, any primitive. An object converts
      every key to a string, so two different objects used as keys collapse
      into the same string, and the number one and the string one are the
      same key too.

      Follow the walkthrough. Two objects with identical contents are two
      distinct keys, because keys are compared by identity. Setting the
      first one again replaces its value and keeps its place. A fresh
      literal with the same shape is a third key nobody set, so get returns
      undefined.

      The comparison is same value zero, the rule includes uses, so not a
      number is a valid key that matches itself.

      The rest of the list, for the interview answer. Insertion order is
      guaranteed, where an object puts integer like keys first. Size is a
      property, where an object needs its keys counted. A Map starts with no
      inherited keys, where an object can see constructor and toString
      through its prototype, which is why a lookup table keyed by user input
      wants a Map. And a Map is iterable directly, yielding key value pairs.

      When the keys are a fixed set of names you know while writing the
      code, an object is right and reads better. When the keys are data,
      arriving at runtime and possibly not strings, it is a Map.`,
  },
  {
    title: 'Set and what it replaces',
    heading: '`Set` and what it replaces',
    script: `A Set is a collection of unique values, again by same value zero,
      again in insertion order. Has is the operation it exists for: constant
      time, where includes on an array walks the whole thing. Deduplicating
      an array is spreading a new Set of it into an array literal, the one
      idiom everyone should write without thinking.

      Uniqueness is by identity for objects, so two distinct objects with
      the same contents are two entries. A Set of records does not
      deduplicate by id. For that, a Map keyed by id does the job and keeps
      the last one written.

      The newer methods, union, intersection, difference and the rest, each
      return a new Set and replace the filter over a spread that everyone
      wrote by hand for a decade.`,
  },
  {
    title: 'Iterating and converting',
    heading: 'Iterating and converting',
    script: `Both collections give you keys, values and entries iterators, and a
      forEach. On a Set, keys and values are the same thing, and entries
      yields each value twice, so code written for a Map can take a Set.

      The conversions are each one line, and every direction goes through
      the iteration protocol. Object entries into a new Map. Object from
      entries on a Map, which stringifies the keys. Spread a Map for an
      array of pairs. Spread its keys for an array of keys.

      Two things to know about iteration. The iterators are live: add an
      entry during a loop over the same Map and the loop will visit it. And
      JSON knows nothing about either collection, so stringify gives an
      empty object. Convert first, which the JSON topic covers.`,
  },
  {
    title: 'WeakMap and WeakSet',
    heading: '`WeakMap` and `WeakSet`',
    script: `A WeakMap is a Map with three restrictions, and the restrictions are
      the feature. Keys must be objects. It cannot be iterated, has no size,
      and cannot be cleared. And a key that nothing else references is
      eligible for garbage collection, together with its value, as if the
      WeakMap had never held it.

      The memory picture shows why that matters. A component is the key in
      a Map and in a WeakMap. The component unmounts and the variable is
      cleared. The Map still holds a reference, so the component stays in
      memory for as long as the Map does, which is usually forever. The
      WeakMap's reference is not counted, so the collector frees the
      component and the entry goes with it.

      The no iteration rule follows from that. If you could list the keys,
      the collector could never remove one without the list changing under
      you. So a WeakMap is for attaching data to an object you do not own
      without extending its lifetime: private fields before the hash
      syntax, caches keyed by a DOM node or a request, metadata for
      instances a framework tracks. WeakSet is the same deal for membership.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked when you would use a Map over an object, give four things: any
      key type, guaranteed insertion order, size without counting, and no
      inherited keys. Then the converse: when keys are a fixed set of
      identifiers known at write time, an object reads better.

      Asked what a WeakMap is for, say attaching data to an object without
      keeping it alive. Keys are objects, held weakly, and there is no
      iteration and no size. The example is a cache keyed by DOM nodes that
      empties itself when the nodes are removed.

      Asked how to deduplicate an array, spread a new Set of it. Then, before
      being asked, say that it deduplicates by identity, so objects with
      equal contents are not merged, and a Map keyed by the identifying
      field is how you merge those.`,
  },
]
