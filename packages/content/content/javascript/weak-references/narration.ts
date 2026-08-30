import type { Narration } from '@prep/core'

export const narration: Narration = [
  {
    title: 'The bound you do not have to write',
    heading: 'Why this matters',
    script: `The last topic ended with a bound you do not have to write. Hold the
      key weakly, and the entry disappears when the thing it describes does. This
      topic is that bound, and its edges.

      It is also the interview question that separates people who have read about
      WeakMap from people who have used one. Everybody can say the keys are held
      weakly. Rather fewer can say why it cannot be iterated, what happens to the
      value, or why WeakRef exists when WeakMap already does.`,
  },
  {
    title: 'An edge the collector does not follow',
    heading: 'What weak actually means',
    script: `A reference is strong when it keeps its target alive, and every
      reference you have written so far is strong. A variable, an array element,
      a property, a Map key, a captured closure variable. All of them are edges
      the collector follows when it walks out from the roots.

      A weak reference is an edge it does not follow. If the only paths to an
      object are weak, the object is unreachable, and it goes.

      That is the whole idea, and one consequence is worth stating before any
      syntax. A weak reference is only useful when somebody else owns the
      lifetime. A WeakMap keyed by a DOM node is useful because the document
      decides when the node dies. A WeakMap keyed by an object that nothing else
      refers to is a complicated way to write an empty collection.`,
  },
  {
    title: 'The missing methods, and why',
    heading: 'The rules, and the reasons',
    script: `WeakMap and WeakSet have the API you would expect with pieces
      missing, and every missing piece has the same explanation.

      Keys must be objects, or unregistered symbols in current engines. A string
      cannot be a weak key, because two equal strings are the same value: there
      is no identity to become unreachable. Passing a primitive to set throws.

      There is no size, no iteration, no clear and no forEach. That is not an
      oversight. If you could list the entries, the list would change on its own,
      at a moment nothing in your program caused, and you would be reading
      collection timing. Everything the engine wants to keep unobservable is
      exactly what those methods would expose.

      Get and has on a missing key are quiet. Get returns undefined, has returns
      false, including for a primitive key. Only writing rejects one, which means
      a lookup that passes an id string instead of the object it meant returns
      undefined forever and never says why.

      And the entry goes with the key. Not on a schedule you can see, and never
      before the key is unreachable.

      The specification also closes the obvious hole. If a key is reachable only
      by following references that start inside the WeakMap itself, that entry is
      removed. So a value that points back at its own key does not keep it alive.
      That is the ephemeron rule, and it is why storing a node alongside its own
      measurements is safe.`,
  },
  {
    title: 'Weak keys, strong values',
    heading: 'The value is still strong',
    script: `What is weak is the key. The value is an ordinary strong reference,
      held for as long as the entry exists, and that is the part people get
      wrong.

      Follow a chain. A WeakMap where key a maps to object b, and b is itself the
      key of a second entry whose value is a large state object. Only a is
      referenced from outside. a is reachable, so its entry stands, and the entry
      holds b strongly. That makes b reachable, so the second entry stands, and
      the state object is alive. One live key at the head keeps the whole chain.

      Drop the outside reference to a and all of it becomes unreachable at once.

      None of that is a leak; it is the semantics working. The mistake it causes
      is the assumption that a WeakMap puts a bound on memory. It bounds the
      entries by the lifetimes of their keys, and if the keys live for the life
      of the process, so does everything the values reach.

      The other version of the same mistake is the one to watch for in review. A
      WeakMap keyed by objects that are also held in a module level array is not
      weak in any way that matters. The array is a strong reference from a root,
      so nothing is ever collected, and the WeakMap bought nothing except an
      inability to inspect it.`,
  },
  {
    title: 'The four jobs',
    heading: 'What they are actually for',
    script: `Four jobs, worth recognising by shape.

      Metadata about objects you do not own. Measurements keyed by a DOM node,
      state keyed by a request, timing keyed by a socket. Your data disappears
      exactly when the thing it describes does, with no teardown to remember and
      none to forget.

      Private data. A module level WeakMap keyed by the instance was how private
      state was done before hash fields existed, and it is still how you attach
      state to an object you did not construct. For a class you write, a hash
      field is better: it is syntax, it is checked, and it needs no side table.

      Memoisation keyed by an object argument. A parsed form of a config object,
      a derived index for a large record. The cache empties itself as callers
      drop their objects, which is the only cache bound that needs no policy.

      And membership, with WeakSet. Have I seen this object before. The canonical
      use is cycle detection while walking a graph: a deep clone, a serialiser, a
      validator. Marking objects as seen in an ordinary Set would keep every
      visited object alive after the walk is over.`,
  },
  {
    title: 'The last resort',
    heading: '`WeakRef` and `FinalizationRegistry`',
    script: `These two are different in kind from the collections, and it is worth
      being precise about why. A WeakMap gives you weakness without ever letting
      you see collection happen. WeakRef lets you look, and FinalizationRegistry
      tells you afterwards. Observation is the dangerous part, and the
      specification says so directly: correct programs should not depend on the
      timing of collection.

      Deref gives you back the object, or undefined if it has gone. There is one
      guarantee attached: if it hands you the object, that object stays alive
      until at least the end of the current job. So within one synchronous run,
      deref once, keep the result in a local, and use it freely. Across turns of
      the event loop, two deref calls can give two different answers, and code
      that checks liveness early and uses the object later is the classic bug.

      A FinalizationRegistry runs a callback after a registered object has been
      collected. Two rules. The held value you pass must not reference the
      target, or the target can never be collected and the callback can never
      run. And the callback may simply never run at all: not if the program exits
      first, not if the engine never collects that object. It is a backstop,
      never a mechanism. Anything that must happen belongs in code that runs.

      The one pattern that justifies them is a cache whose keys are primitives,
      so a WeakMap cannot be used, and whose values are large and also referenced
      elsewhere. Even there, a size bounded cache with least recently used
      eviction is usually the better answer, because it is predictable and
      testable.`,
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    script: `Asked what a WeakMap is for, say: attaching data to an object whose
      lifetime somebody else owns, so the data goes when the object does. Then
      the two details that show you have used one. The keys are weak and the
      values are not. And you cannot iterate it.

      Asked why you cannot iterate it, say: because the contents change without
      your program doing anything, so listing them would expose when the
      collector ran, and collection timing is deliberately unobservable.

      Asked when you would use WeakRef over WeakMap, say: rarely, and only when
      the key is not an object, which is the case a WeakMap cannot serve. Then
      give the specification's own warning, that correct programs should not
      depend on collection timing, and say that a bounded cache is usually
      better.

      Expect a follow up on whether a WeakMap is faster than a Map, which it is
      not, and on what happens to a value that references its own key, which is
      nothing, because of the ephemeron rule.`,
  },
]
