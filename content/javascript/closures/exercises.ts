import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'counter',
    title: 'Private counter',
    difficulty: 'easy',
    prompt:
      'Write a factory that returns a counter function whose state cannot be reached from outside.',
    requirements: [
      'The counter starts at 0.',
      'Calling the returned function increments the count and returns the new value.',
      'Two counters created by the factory are independent of each other.',
      'There is no way to read or write the count except by calling the function.',
    ],
  },
  {
    id: 'memoize',
    title: 'Memoize a single-argument function',
    difficulty: 'medium',
    prompt:
      'Write memoize(fn) that caches results per argument so fn runs at most once for each distinct input.',
    requirements: [
      'A repeated call with the same argument does not call fn again.',
      'The cache is private to the returned function.',
      'It works when fn legitimately returns undefined.',
      'Use a Map rather than a plain object, and explain in a comment why that matters.',
    ],
  },
]
