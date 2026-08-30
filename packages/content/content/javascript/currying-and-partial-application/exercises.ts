import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'partial',
    title: 'Partial application without bind',
    difficulty: 'easy',
    prompt:
      'Write partial(fn, ...fixed), which returns a function calling fn with the fixed arguments followed by whatever it is later given.',
    requirements: [
      'partial(log, "WARN")("auth", "expired") calls log("WARN", "auth", "expired").',
      'The returned function can be called more than once, and the calls do not affect each other.',
      'It works as a method, so fn still sees the this the returned function was called with.',
      'Do not use Function.prototype.bind anywhere in the implementation.',
      'Add a comment naming the one thing bind does that your version does not.',
    ],
  },
  {
    id: 'curry-with-placeholders',
    title: 'Curry that can skip an argument',
    difficulty: 'medium',
    prompt:
      'Extend a standard curry so a placeholder value can be passed for an argument that is not ready yet, and filled in by a later call.',
    requirements: [
      'Export a placeholder, for example const _ = Symbol("placeholder").',
      'curried(1, _, 3)(2) calls fn(1, 2, 3).',
      'A placeholder still in the collected arguments means the function is not ready, even when the count looks sufficient.',
      'Later arguments fill the placeholders left to right, and anything after them is appended.',
      'Take the arity as an optional second parameter defaulting to fn.length, and say in a comment which functions need it passed explicitly.',
    ],
  },
]
