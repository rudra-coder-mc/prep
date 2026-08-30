import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'lru-cache',
    title: 'An LRU cache on one Map',
    difficulty: 'medium',
    prompt:
      'Write class LRU with get(key) and set(key, value) and a fixed capacity, where the least recently used entry is evicted when a set would exceed capacity, using a single Map and nothing else for storage.',
    requirements: [
      'get on a present key moves that key to most recently used. Say in a comment how you do that with a Map and why it works.',
      'Eviction finds the least recently used key without iterating over every entry. Use the iterator and say which end of the insertion order it is at.',
      'Keys may be objects. Show two distinct objects with identical contents stored as two separate entries, and the same object stored twice as one.',
      'Both operations must be constant time. Write a test that sets 100,000 entries into a capacity of 10 and asserts that only the last ten remain, in order.',
    ],
  },
  {
    id: 'set-operations',
    title: 'Set algebra and its cost',
    difficulty: 'easy',
    prompt:
      'Write union(a, b), intersection(a, b) and difference(a, b) for two Sets, then write the same three for arrays with includes, and measure both on two collections of 50,000 items.',
    requirements: [
      'Each Set version is one spread or one filter over one of the inputs, and does not mutate either input.',
      'Record the timings for both versions and say in a comment why the array version grows the way it does.',
      'Show that the built-in Set.prototype.union, intersection and difference exist in your runtime, or say which version they arrived in, and use one of them.',
      'Add a case where the items are objects with an id field, and explain why neither Set version deduplicates two objects with the same id, and what you would key on instead.',
    ],
  },
]
