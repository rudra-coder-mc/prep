import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'deep-get',
    title: 'Read a nested path safely',
    difficulty: 'easy',
    prompt:
      'Write get(object, path, fallback) which reads a dotted path such as "user.address.city" and returns the fallback when any step along the way is missing.',
    requirements: [
      'get({ a: { b: 1 } }, "a.b") returns 1, and get({}, "a.b", 0) returns 0.',
      'A value of null or undefined partway down returns the fallback rather than throwing.',
      'A stored value of undefined is not confused with a missing key: say in a comment which behaviour you chose and why.',
      'Write it recursively first, then rewrite it as a loop, and keep both.',
      'Say in a comment which of the two you would ship here, given the path length is bounded by the caller.',
    ],
  },
  {
    id: 'safe-deep-clone',
    title: 'Deep clone that survives its input',
    difficulty: 'medium',
    prompt:
      'Write deepClone(value) for plain objects, arrays, dates and primitives, and make it survive both cycles and deeply nested data.',
    requirements: [
      'Nested objects and arrays are copied rather than shared, so mutating the clone never touches the original.',
      'An object that references itself does not recurse forever, and the clone has the same self-reference.',
      'Dates are cloned as dates, and primitives are returned unchanged.',
      'Add a maxDepth parameter that throws a clear error when it is exceeded, and explain in a comment why that matters for data from a request.',
      'Compare your result with structuredClone in a comment: what does it do that you do not, and what does it refuse to clone?',
    ],
  },
]
