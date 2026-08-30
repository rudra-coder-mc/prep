import type { Question } from '@prep/core'

export const questions: Question[] = [
  {
    id: 'map-over-object-choice',
    type: 'concept',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'Which of these is NOT a reason to prefer a Map over a plain object?',
    options: [
      'A Map can use objects, functions and NaN as keys; an object converts every key to a string',
      'A Map is faster than an object for every lookup',
      'A Map has a size property and no inherited keys like constructor or toString',
      'A Map iterates in insertion order, where an object puts integer-like keys first',
    ],
    correctOption: 1,
    answerInFull: `The speed claim is the odd one out. Engines optimise objects with a stable set of string keys very hard, and a Map is not faster for that case. A Map wins on frequent additions and deletions of many keys, where objects fall off their fast paths, and it is the only option for non-string keys. "Faster" is not the reason to pick it.

The other three are the real reasons: any key type compared by identity, size without counting, no inherited keys to collide with user data, and guaranteed insertion order. The fourth one, which the question leaves implicit, is that a Map is directly iterable.

And the converse: when the keys are a fixed set of names you know while writing the code, an object reads as a record and is the right choice.`,
    explanation: `The key-type point is the most important of the four and the one people most often forget, because object keys being stringified is invisible until two keys collide.

size and inherited keys are what make an object dangerous as a lookup table keyed by user input: "constructor" in obj is true before you have added anything.

The order rule is what makes an object sort your numeric ids for you whether you asked or not.`,
    hints: ['Which of the four is a claim about performance rather than behaviour?'],
    tags: ['collections', 'map'],
  },
  {
    id: 'object-key-collision-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does this print?',
    code: `const obj = {}
const map = new Map()
const k1 = { id: 1 }
const k2 = { id: 2 }

obj[k1] = 'one'
obj[k2] = 'two'
map.set(k1, 'one')
map.set(k2, 'two')

console.log(Object.keys(obj).length, obj[k1], map.size, map.get(k1))`,
    options: ['2 one 2 one', '1 two 2 one', '1 two 1 two', '2 one 1 two'],
    correctOption: 1,
    answerInFull: `1 two 2 one

An object converts every key to a string, and both objects convert to "[object Object]". The second assignment overwrites the first under that one key, so there is one key and reading obj[k1] gives 'two'.

A Map keys by identity. k1 and k2 are different objects, so they are two entries, and get(k1) returns what was set for k1.`,
    explanation: `Two keys on the object would need the object to tell k1 from k2, and it cannot once they are strings.

One entry in the Map would need the Map to stringify, which is precisely what it does not do.

2 one 1 two has the behaviours swapped.`,
    hints: ['What does an object do to a key before storing it?'],
    tags: ['collections', 'map', 'keys'],
  },
  {
    id: 'live-iteration-ordering',
    type: 'output',
    form: 'ordering',
    tier: 'staff',
    prompt: 'Put the lines this prints in the order it prints them.',
    code: `const map = new Map([
  ['a', 1],
  ['b', 2],
])

for (const [key, value] of map) {
  console.log(key, value)
  if (key === 'a') {
    map.delete('b')
    map.set('c', 3)
    map.set('a', 10)
  }
}
console.log([...map.keys()].join())`,
    items: ['a 1', 'b 2', 'c 3', 'a 10', 'a,c', 'a,b,c', 'c,a'],
    correctOrder: [0, 2, 4],
    answerInFull: `a 1
c 3
a,c

Map iteration is live. On the first step the body deletes b, which has not been visited yet, so it will not be. It adds c, which goes on the end of the insertion order and will be visited. And it sets a again, which updates the value in place without moving a, and a has already been visited.

So the loop continues to c and prints c 3, then ends. The remaining keys are a and c, in that order, because re-setting an existing key keeps its position.`,
    explanation: `b 2 would print if the iterator worked from a snapshot. It works from the live collection, and b is gone by the time the iterator reaches it.

a 10 is what you would see if setting an existing key moved it to the end, where the iterator would reach it again. It does not move; only a delete followed by a set does.

c,a is the order if re-setting a had moved it. a,b,c forgets the delete.`,
    hints: [
      'Does the iterator see a snapshot or the live Map?',
      'Does set on an existing key change its position?',
    ],
    tags: ['collections', 'map', 'iteration'],
  },
  {
    id: 'bracket-on-map-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-1',
    prompt:
      'cache is a Map. After cache["user:1"] = data, cache.get("user:1") returns undefined and cache.size is 0. Why?',
    options: [
      'Map keys cannot contain a colon. Use a different separator',
      'Bracket assignment sets an ordinary property on the Map object, not an entry. get and size only see entries. Use cache.set("user:1", data)',
      'The Map was created with new Map() and no initial entries, so it is frozen. Pass the entries to the constructor',
      'String keys must be wrapped: cache.get(new String("user:1"))',
    ],
    correctOption: 1,
    answerInFull: `A Map is an object, and bracket assignment on any object creates a property on it. The entries a Map manages live in an internal slot that get, has, size and iteration read, and a property on the object is invisible to all of them.

  cache.set('user:1', data)

is the only way to add an entry. The stray property does no harm except to confuse, and is the most common mistake in the first week of using Map, because obj[key] = value is what years of objects have trained the hand to write.`,
    explanation: `Any string is a valid Map key, colons included. Any value at all is.

Maps are never frozen by the constructor, and an empty Map accepts set like any other.

Wrapping in new String makes a new object each time, which would be a key that nothing can look up again.`,
    hints: ['Where does a Map keep its entries, and what does bracket assignment touch?'],
    tags: ['collections', 'map'],
  },
  {
    id: 'dedupe-by-id-coding',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'Write uniqueBy(items, key) that returns the items with duplicates removed by item[key], keeping the first occurrence of each, in original order, in linear time. Which is correct?',
    options: [
      'function uniqueBy(items, key) {\n  return [...new Set(items)]\n}',
      'function uniqueBy(items, key) {\n  const seen = new Set()\n  return items.filter((item) => {\n    if (seen.has(item[key])) return false\n    seen.add(item[key])\n    return true\n  })\n}',
      'function uniqueBy(items, key) {\n  return items.filter((item, i) => items.findIndex((o) => o[key] === item[key]) === i)\n}',
      'function uniqueBy(items, key) {\n  return [...new Map(items.map((item) => [item[key], item])).values()]\n}',
    ],
    correctOption: 1,
    answerInFull: `function uniqueBy(items, key) {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item[key])) return false
    seen.add(item[key])
    return true
  })
}

One pass. The Set remembers which key values have been kept, has is constant time, and filter preserves order and keeps the first occurrence because the second one finds its key already present.

The Map version is the other linear answer, and it keeps the last occurrence rather than the first, since set on an existing key replaces the value. Either can be right; the question said first, so this one is. Say which one yours keeps.`,
    explanation: `new Set(items) deduplicates by identity. Two objects with the same id are two different objects, so nothing is removed.

findIndex inside filter is correct and quadratic: for every item it scans from the start. On ten thousand items that is fifty million comparisons.

The Map version is linear and keeps the last occurrence of each key, not the first, because each later set overwrites the earlier value under the same key. Its order is also by first insertion of each key, which happens to match, but the item kept is the wrong one for this spec.`,
    hints: [
      'What does a Set compare objects by?',
      'For the Map version, which occurrence survives a repeated set?',
    ],
    tags: ['collections', 'set', 'dedupe'],
  },
  {
    id: 'dom-metadata-scenario',
    type: 'scenario',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A library attaches state to DOM elements it decorates, using a Map keyed by element. In a single-page app that creates and removes thousands of elements, memory grows without bound even though the elements are gone from the page. What is the fix?',
    options: [
      'Store the state on the element itself as a property, so it is removed with the element',
      'Key the Map by element id instead of by the element, since strings are smaller',
      'Use a WeakMap keyed by element. The Map holds a strong reference to every element ever decorated, so none of them can be collected; a WeakMap lets an entry go when the element is otherwise unreachable',
      'Call map.clear() on a timer every few minutes',
    ],
    correctOption: 2,
    answerInFull: `The Map is the leak. A Map holds its keys strongly, so every element ever decorated stays reachable through the Map even after it is removed from the document, along with its subtree and whatever state was attached. Nothing is ever collected.

  const state = new WeakMap()
  state.set(element, { ... })

A WeakMap does not count as a reference for the purposes of collection. Once the element is detached and nothing else holds it, the collector frees it and the entry disappears. The library does not need to know when elements are removed, which is the whole point: it is attaching data to objects it does not own and cannot watch.

The cost is that the library can never list the elements it has decorated. If it needs to, it has to track them another way and accept that it is now responsible for cleaning up.`,
    explanation: `A property on the element works and is what libraries did before WeakMap, at the cost of polluting an object the library does not own, colliding with other libraries, and showing up in any code that enumerates the element's properties.

Keying by id keeps a string key alive, which is fine, and keeps the state value alive forever, which is not. The element can now be collected and the state cannot, so the leak is smaller and still unbounded.

Clearing on a timer throws away state for elements that are still on the page.`,
    hints: [
      'What keeps a removed element reachable?',
      'Which collection does not count as a reference?',
    ],
    tags: ['collections', 'weakmap', 'memory'],
  },
  {
    id: 'choose-a-collection-interview',
    type: 'interview',
    form: 'open',
    tier: 'senior',
    prompt:
      'For each of these, say which collection you would use and why: a config object read from a file; a cache from request object to parsed body; a lookup from user id to user, filled from an API; the set of ids the user has selected in a list; and a registry of which plugin instances have been initialised.',
    answerInFull: `Config from a file: a plain object. The keys are a fixed set of names known when the code is written, it arrived as JSON so it is already an object, and dot access reads as a record. A Map would add ceremony and nothing else.

Request to parsed body: a WeakMap. The key is an object I do not own, requests come and go by the thousand, and I must never keep one alive after it is finished. I never need to list them. A Map here is the classic server memory leak.

User id to user, from an API: a Map. The keys are data, arriving at runtime. If they are numeric ids an object would stringify and reorder them, and a lookup table keyed by external input should not inherit constructor and toString. size and iteration in insertion order come free. If the ids are guaranteed strings and the table is built once, an object created with Object.create(null) is defensible, and I would still reach for the Map.

Selected ids: a Set. The operations are has, add and delete, all constant time, and the data is a collection of unique values with no associated payload. An array with includes is linear per check and needs manual dedup on add. If the selection needs to be JSON-shaped for state, I would convert with [...set] at the boundary.

Initialised plugin instances: a WeakSet. Membership only, keyed by object, and the registry must not be what keeps a plugin alive after everything else has dropped it. If I also need to enumerate initialised plugins, that is a Set, and then I own the lifetime and need an explicit deregister.

The rule across all five: fixed string keys known at write time is an object; keys that are data is a Map or Set; keys that are objects I do not own is the weak version, as long as I never need to list them.`,
    explanation: `The answer being listened for is the reasoning, not the five names. Picking WeakMap for the request cache and saying why a Map leaks is the point that distinguishes someone who has run a server from someone who has read about collections. The config case is the other tell: choosing a Map for everything is as much a mistake as choosing an object for everything.`,
    hints: [],
    tags: ['collections', 'design'],
  },
  {
    id: 'set-identity-output',
    type: 'output',
    form: 'choice',
    tier: 'swe-2',
    prompt: 'What does this print?',
    code: `const set = new Set([1, '1', NaN, NaN, { a: 1 }, { a: 1 }, 0, -0])
console.log(set.size)`,
    options: ['8', '6', '5', '4'],
    correctOption: 1,
    answerInFull: `6

Set uses SameValueZero. 1 and '1' are different types, so both stay. NaN equals NaN under SameValueZero, so the two collapse to one. The two object literals are different objects, so both stay. 0 and -0 are equal under SameValueZero, so they collapse to one.

That is 1, '1', NaN, the first object, the second object, and 0: six.`,
    explanation: `8 is what you would get with no deduplication at all, or with a rule where NaN never equals itself, which is the === rule and not the one Set uses.

5 merges the two objects, which would need comparison by contents. A Set compares objects by identity.

4 also merges 1 with '1', which would need type coercion. SameValueZero does not coerce.`,
    hints: ['Which equality does Set use, and what does it say about NaN, -0 and two objects?'],
    tags: ['collections', 'set', 'equality'],
  },
  {
    id: 'weakmap-restrictions-choice',
    type: 'concept',
    form: 'choice',
    tier: 'staff',
    prompt: 'Why can a WeakMap not be iterated, and why must its keys be objects?',
    options: [
      'Iteration was left out to keep the API small, and primitives are rejected because they cannot be hashed',
      'Keys are held weakly, so the collector may remove an entry at any time; a list of keys could then change under you, so none is offered. A primitive is never collected, so holding it weakly would mean nothing',
      'Iterating a WeakMap would force the collector to run, which is too slow; primitives are rejected because the collector cannot track them',
      'WeakMaps store keys by hash of their contents, which cannot be enumerated or computed for primitives',
    ],
    correctOption: 1,
    answerInFull: `Both restrictions follow from one fact: the WeakMap does not keep its keys alive.

If you could list the keys, then either the list would hold them, which makes them strong again and defeats the purpose, or the collector could remove one mid-iteration and the list would be wrong. The language avoids exposing collection timing to programs, so there is no keys(), no size, no forEach and no clear.

A primitive like a string or a number is not something the collector frees; it is a value, not an allocation with a lifetime. Holding it weakly would be indistinguishable from holding it strongly, so the WeakMap refuses it rather than pretend. Since 2023, non-registered symbols are allowed as keys, because those do have an identity that can be collected.`,
    explanation: `It was not an API size decision. Every restriction is a consequence of the weak semantics, and a WeakMap with iteration would not be weak.

Iteration would not force collection. The problem is that collection could have already happened, invisibly.

WeakMaps key by identity, not by hashed contents. Two objects with the same contents are two keys.`,
    hints: ['What would a list of keys do to the keys?', 'Can a string be garbage collected?'],
    tags: ['collections', 'weakmap'],
  },
  {
    id: 'from-entries-stringifies-bug',
    type: 'debugging',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'A Map keyed by user objects is converted with Object.fromEntries(map) so it can be sent as JSON. The result has one key, "[object Object]". What happened, and what is the right conversion?',
    options: [
      'Object.fromEntries only supports string keys and drops the rest. Filter the Map to string keys first',
      'Object keys were stringified on the way into the object, and every user object became the same string. Convert to something JSON can hold by choosing a key: Object.fromEntries([...map].map(([user, v]) => [user.id, v]))',
      'JSON.stringify stringified the keys, not fromEntries. Use structuredClone instead',
      'The Map was iterated as values rather than entries. Use map.entries() explicitly',
    ],
    correctOption: 1,
    answerInFull: `Object.fromEntries builds an object, and object property keys are strings or symbols, so each user object was converted with toString and they all became "[object Object]", overwriting one another. That is the Map's reason for existing, in reverse.

JSON cannot hold object keys either, so the fix is to decide what the key should be on the wire, which is normally the id:

  Object.fromEntries([...map].map(([user, value]) => [user.id, value]))

or, if the full user is needed, an array of pairs: [...map].map(([user, value]) => ({ user, value })). Either way, the choice of key is yours, not the conversion's, and whoever parses it needs to know which you picked.`,
    explanation: `fromEntries does not drop non-string keys; it stringifies them, which is worse because it is silent.

JSON.stringify never saw the Map's keys. The collapse happened in fromEntries, before stringify was called. structuredClone would preserve the Map and still cannot produce JSON.

A Map's default iterator is entries already. Asking for entries explicitly changes nothing.`,
    hints: [
      'What can an object property key be?',
      'Where did the collapse happen: fromEntries or stringify?',
    ],
    tags: ['collections', 'map', 'json'],
  },
  {
    id: 'lru-with-map-choice',
    type: 'coding',
    form: 'choice',
    tier: 'swe-2',
    prompt:
      'An LRU cache is built on a single Map, relying on insertion order. On get(key) for a present key, what is the correct way to mark it most recently used?',
    options: [
      'map.set(key, map.get(key)), since set moves an existing key to the end',
      'const value = map.get(key); map.delete(key); map.set(key, value), since set on an existing key keeps its position and only delete followed by set moves it to the end',
      'Nothing; get already moves the key to the end of the order',
      'map.delete(key) alone, since the next set will re-add it',
    ],
    correctOption: 1,
    answerInFull: `const value = map.get(key)
map.delete(key)
map.set(key, value)
return value

A Map keeps insertion order, and setting a key that already exists updates its value without moving it. The only way to move an entry to the end is to remove it and add it again. Eviction is then map.keys().next().value, the first key in the order, which is the least recently used, and map.delete on it.

All of that is constant time, which is what makes a Map the standard single-structure LRU in JavaScript. Say that the order guarantee is the thing being relied on, and that an object would not do, since it reorders integer-like keys.`,
    explanation: `set on an existing key is the trap. It feels like it should move the entry and it does not, so the cache would evict recently used keys.

get never changes the order. It is a read.

delete alone removes the entry, so the next get misses and the value is lost.`,
    hints: ['Does set on an existing key change where it sits in the order?'],
    tags: ['collections', 'map', 'lru'],
  },
]
