import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'desugar-a-class',
    title: 'Write the class without the keyword',
    difficulty: 'medium',
    prompt:
      'Take a class with a field, a method, a getter and a static, and rewrite it as a constructor function plus prototype assignments that behaves identically, then write tests that can tell the two apart.',
    requirements: [
      'The function version defines the method and the getter on the prototype with Object.defineProperty so they are non-enumerable, and a test asserts Object.keys(instance) is the same for both.',
      'The function version throws when called without new, and a test checks it does so with the same error type as the class.',
      'Find at least two remaining differences that your version cannot reproduce, such as hoisting or calling the method with new, and turn each into a test that passes for one and fails for the other. Say in a comment why each cannot be matched.',
      'Assert with JSON.stringify that both versions serialise to the same string.',
    ],
  },
  {
    id: 'field-order-trace',
    title: 'Trace the constructor order',
    difficulty: 'easy',
    prompt:
      'Write a class with three fields whose initialisers each log their name and the current value of the other two, a constructor that logs after them, and a method field written as an arrow. Predict the full log before running it.',
    requirements: [
      'Write the predicted output in a comment above the class before running, then run and record every line you got wrong.',
      'Show that a field reading one declared below it gets undefined, and fix the order so it does not.',
      'Assert that the arrow field is an own property of the instance and the plain method is not, using Object.hasOwn.',
      'Create two instances and assert their arrow fields are different functions and their plain methods are the same function.',
    ],
  },
]
