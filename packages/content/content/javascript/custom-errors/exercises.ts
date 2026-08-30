import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'error-base-class',
    title: 'One base class the rest inherit from',
    difficulty: 'medium',
    prompt:
      'Write AppError, the base every error in a service extends, and two subclasses whose handling genuinely differs. Get the four things right that a naive subclass gets wrong, and test each of them separately.',
    requirements: [
      'A test asserts the name matches the class actually constructed, including for a subclass of a subclass, so a hard coded string fails it.',
      'A test asserts a cause passed to any of the three classes is reachable, which fails if super is called with the message alone.',
      'Every error carries a code from a frozen set, and a test asserts constructing one with an unknown code throws at construction rather than at the boundary.',
      'A test asserts instanceof AppError is true for every subclass and false for a plain Error, then writes the boundary handler that uses it and asserts a TypeError falls through to the bug path.',
      'A test asserts the stack does not name the error constructor, using the V8 helper behind a guard, and skips rather than fails where the helper does not exist.',
    ],
  },
  {
    id: 'errors-over-a-boundary',
    title: 'Send an error somewhere and get it back',
    difficulty: 'hard',
    prompt:
      'Take the classes from the previous exercise through JSON and back, as if over a queue. Write the serialiser and the rebuilder, and prove what survives.',
    requirements: [
      'A test asserts JSON.stringify of a subclass without a toJSON produces only the enumerable fields, and names in a comment which useful ones are missing.',
      'Add toJSON to the base class, and assert every call site benefits without passing a replacer, including one nested inside a larger object.',
      'Write fromJSON that rebuilds the matching class from the code, and assert the result passes instanceof for the right subclass and carries its fields.',
      'Assert an unrecognised code rebuilds as the base class rather than throwing, and that the original code is preserved on it.',
      'Serialise an error whose cause is itself a wrapped error. Assert the chain survives one level, and decide deliberately how deep to go, saying why in a comment.',
      'A test asserts the stack is included for the internal shape and absent from the shape meant for an HTTP response.',
    ],
  },
]
