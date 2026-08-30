import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'boundary-audit',
    title: 'Audit a module for lost errors',
    difficulty: 'medium',
    prompt:
      'You are given a module with five calls where errors can escape: an un-awaited promise, a throw inside a setTimeout, an event emitter handler, a fire-and-forget fetch, and a catch that returns a default. Rewrite it so every failure reaches the caller, then write tests that prove each original bug is fixed.',
    requirements: [
      'Each of the five boundary bugs gets its own fix: await, promise wrapping, an error channel, an attached catch, and a deliberate rethrow.',
      'A test per bug asserts the error surfaces: rejection reason, message, or propagation to the caller.',
      'The cold-cache fallback keeps working: that one expected failure must still resolve to the default rather than throw.',
      'An unhandledRejection listener in the test setup fails any test whose fix still leaks a rejection.',
    ],
  },
  {
    id: 'attempt-result',
    title: 'Errors as values, done deliberately',
    difficulty: 'hard',
    prompt:
      'Write attempt(fn) that returns { ok: true, value } on success and { ok: false, error } on failure, plus unwrap(result) that returns the value or throws. Refactor a mixed chain — cache read, API call, render — so expected failures flow through attempt and unexpected ones propagate.',
    requirements: [
      'attempt works on both sync functions and ones returning promises; assert both paths.',
      'unwrap on a failed result throws the original error object, not a copy; assert the identity with toBe.',
      'In the refactored chain, only the cache read is treated as expected failure. A test proves an API failure propagates while a cache failure resolves to null.',
      'Comment on when you would choose this style over try/catch, and what it costs at every call site.',
    ],
  },
]
