import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'implement-bind',
    title: 'Implement bind yourself',
    difficulty: 'hard',
    prompt:
      'Write Function.prototype.myBind, matching the real bind closely enough to pass your own tests.',
    requirements: [
      'It returns a new function with this permanently fixed.',
      'Arguments given at bind time are prepended to arguments given at call time.',
      'Binding an already-bound function does not change the original binding.',
      'Calling the bound function with new uses the new instance as this, not the bound value.',
      'Write the tests first, including the new case.',
    ],
  },
  {
    id: 'fix-the-callback',
    title: 'Fix four broken callbacks',
    difficulty: 'medium',
    prompt:
      'Write an object with a method that loses its this in four different ways: passed to setTimeout, passed to map, used as an event handler, and destructured. Fix each one with a different technique.',
    requirements: [
      'Demonstrate all four failures, with the wrong output shown in a comment.',
      'Use a different fix for each: bind, an arrow function, a wrapper closure, and a class field.',
      'Explain in a comment which fix you would prefer in real code, and why.',
    ],
  },
]
