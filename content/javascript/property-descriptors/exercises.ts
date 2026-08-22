import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'observe-object',
    title: 'Make an object report its own changes',
    difficulty: 'medium',
    prompt:
      'Write observe(object, onChange) that replaces every own enumerable data property of object with a getter and setter pair, so that any assignment calls onChange(key, oldValue, newValue) and reads still return the current value.',
    requirements: [
      'The stored values live somewhere the setter can reach without assigning to the property it guards, and say in a comment why that matters.',
      'Object.keys and JSON.stringify give the same result before and after observe, which means the accessors are enumerable.',
      'A property that was already an accessor, or was non-configurable, is left alone and reported rather than overwritten.',
      'Prove it: assign twice, assert both callbacks, and assert that spreading the observed object gives a plain snapshot that no longer reports.',
    ],
  },
  {
    id: 'describe-properties',
    title: 'List what the listings hide',
    difficulty: 'easy',
    prompt:
      'Write describe(object) that returns one entry per own property, including non-enumerable and symbol-keyed ones, with its key, whether it is a data property or an accessor, and its three attributes.',
    requirements: [
      'Use Reflect.ownKeys so nothing own is missed, and say in a comment which properties Object.keys would have dropped.',
      'Run it on an array, a class instance and a frozen object, and write down one thing each result shows that you did not expect.',
      'For the class instance, show that its methods are not in the result and explain where they are.',
      'Assert the attributes of array length and of a property made with defineProperty({ value: 1 }).',
    ],
  },
]
