import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'which-type-table',
    title: 'Make the engine name its own errors',
    difficulty: 'medium',
    prompt:
      'Write a table of small expressions that each fail, run every one, and assert which built-in type came out. The value is in being surprised by two or three of them, so guess before you run it.',
    requirements: [
      'Cover all five types the engine actually produces, with at least two expressions each, and assert on the constructor rather than on the message.',
      'Include the pairs that are easy to swap: reading a property of undefined against calling an undeclared name, and a negative array length against a non-numeric one.',
      'Assert that a blown call stack is a RangeError, and that the catch block runs afterwards.',
      'Assert that nothing in the table produces an EvalError, and leave a comment saying why the type still exists.',
      'One case asserts a SyntaxError from JSON.parse is catchable, with a comment on why a syntax error in the test file itself would not be.',
    ],
  },
  {
    id: 'identify-across-a-boundary',
    title: 'Identify an error that crossed a boundary',
    difficulty: 'hard',
    prompt:
      'Throw an error inside a Node vm context, or a worker, catch it outside, and build a check that recognises it correctly. Then make the same check work for an error that has been through JSON.',
    requirements: [
      'A test asserts instanceof fails for an error made in the other realm, and says in a comment what instanceof is actually comparing.',
      'Write isErrorLike(value) that recognises an error object from any realm, and test it against a real error, a cross-realm error, a plain object with a message, and a string.',
      'Write a discriminator that reads a code field you set yourself, and assert it survives both the realm boundary and a round trip through JSON.stringify and JSON.parse.',
      'Assert the round trip loses message and stack unless they are copied deliberately, then write the serialiser that keeps them and test it.',
      'Assert that a wrapped error keeps its cause across the serialiser, including a cause that is itself wrapped.',
    ],
  },
]
