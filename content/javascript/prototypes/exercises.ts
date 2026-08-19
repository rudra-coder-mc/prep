import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'inheritance-without-class',
    title: 'Inheritance without the class keyword',
    difficulty: 'medium',
    prompt:
      'Build a two-level inheritance hierarchy using only constructor functions, Object.create and prototype assignment. Then rewrite it with class syntax and confirm the two behave identically.',
    requirements: [
      'The child prototype must inherit from the parent prototype.',
      'constructor must point back at the right function on both prototypes.',
      'The child constructor must call the parent constructor.',
      'Prove with assertions that instanceof, method lookup and constructor all match between the two versions.',
    ],
  },
  {
    id: 'safe-lookup',
    title: 'Tell own properties from inherited ones',
    difficulty: 'easy',
    prompt:
      'Write a function that returns only an object’s own enumerable string-keyed properties, and show three ways an inherited property could otherwise sneak in.',
    requirements: [
      'Do not use Object.keys or Object.entries in the main implementation.',
      'It must work on an object created with Object.create(null).',
      'It must not be fooled by an object with its own hasOwnProperty property.',
      'Demonstrate the difference against a for...in loop in a comment.',
    ],
  },
]
