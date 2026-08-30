import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'range-iterable',
    title: 'A range you can spread',
    difficulty: 'easy',
    prompt:
      'Write range(start, end, step = 1) that returns an iterable, not an array, so that [...range(1, 4)] is [1, 2, 3], for...of works, and destructuring const [a, b] = range(10, 20) takes only what it needs.',
    requirements: [
      'Implement it without a generator: an object with Symbol.iterator returning an object with next.',
      'The iterable must be reusable: spreading the same range twice gives the same result both times.',
      'Prove destructuring stops early by counting calls to next and asserting that const [a, b] = range(0, 1_000_000) makes three calls, not a million.',
      'Then rewrite it as a generator in three lines and say in a comment what the generator is doing for you that you had to write by hand.',
    ],
  },
  {
    id: 'early-exit-cleanup',
    title: 'Release a resource when the loop breaks',
    difficulty: 'medium',
    prompt:
      'Write lines(text) that returns an iterable over the lines of a string and logs "closed" exactly once whenever iteration ends for any reason: completing, break, return from the enclosing function, a throw inside the loop body, or destructuring that takes fewer lines than there are.',
    requirements: [
      'Implement return() on the iterator and show, with a test for each of the five cases, that "closed" is logged once.',
      'Show one way to consume the iterator that does not call return() on early exit, and say in a comment why the protocol cannot protect you there.',
      'Make the iterator also an iterable by returning this from Symbol.iterator, and explain what breaks if you forget.',
    ],
  },
]
