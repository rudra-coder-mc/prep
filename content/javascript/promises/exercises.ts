import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'promise-from-scratch',
    title: 'A promise good enough to chain',
    difficulty: 'hard',
    prompt:
      'Implement a MyPromise class supporting the executor, then, catch and chaining, without using the built-in Promise.',
    requirements: [
      'A promise settles exactly once; later resolve or reject calls are ignored.',
      'then returns a new promise, so chains work and each link transforms the value.',
      'A callback registered after settling still runs.',
      'Callbacks run asynchronously as microtasks, via queueMicrotask, never synchronously.',
      'A throw inside a then callback rejects the promise it returned.',
    ],
  },
  {
    id: 'concurrency-limit',
    title: 'Run promises with a concurrency limit',
    difficulty: 'hard',
    prompt:
      'Write pool(tasks, limit) that runs at most `limit` async tasks at once and resolves with all results in the original order.',
    requirements: [
      'Never more than `limit` tasks in flight at any moment.',
      'Results come back in the order the tasks were given, not the order they finished.',
      'One rejected task must not lose the results of the others.',
      'Include a test using timers that proves the limit is actually respected.',
    ],
  },
]
