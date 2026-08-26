import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'weak-metadata-registry',
    title: 'Attach state to objects you do not own',
    difficulty: 'medium',
    prompt:
      'Write a small decoration library that records call counts and timings for objects created by other code, using a WeakMap, and test everything about it that can be tested without depending on the collector.',
    requirements: [
      'decorate(target) attaches state without adding any own property, asserted with Object.keys, JSON.stringify, a spread and Reflect.ownKeys.',
      'Two objects with identical contents are tracked separately, and a lookup with an id string returns undefined rather than throwing.',
      'A test asserts that set with a primitive key throws and get with one does not, and a comment says why the API is asymmetric.',
      'Rewrite the same library with a symbol-keyed property, and write down in a comment which two behaviours differ and when each is preferable.',
      'A WeakSet version of has-this-been-decorated, tested against a self-referencing object graph so the walk terminates.',
    ],
  },
  {
    id: 'weakref-cache-against-lru',
    title: 'Build both caches and argue for one',
    difficulty: 'hard',
    prompt:
      'Implement the same cache twice, once as a Map of id to WeakRef with a FinalizationRegistry, and once as a size-bounded LRU, then measure both under a workload where some values stay referenced and others do not.',
    requirements: [
      'The LRU evicts the least recently used entry at a fixed maximum size, with a test that a re-read moves an entry to the newest position.',
      'The WeakRef version registers a held value that does not reference the target, with a comment explaining what happens if it does.',
      'A harness holds a subset of the values and drops the rest, runs with --expose-gc, and reports hit rate and heap for both caches.',
      'Run the WeakRef version twice and record whether the hit rates match, then say in a comment what that means for testing it.',
      'A written recommendation of which one you would ship for this workload, naming what each design makes predictable and what it hands to the collector.',
    ],
  },
]
