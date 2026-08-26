import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'measure-tree-shaking',
    title: 'Make the bundler drop something, then stop it',
    difficulty: 'medium',
    prompt:
      'Build a small package with three exports and a consumer that imports one of them, then measure the production bundle in four shapes: clean named exports, a barrel including a module with a top level side effect, sideEffects false, and a default export object holding all three.',
    requirements: [
      'Record the byte size of each build and state which of the four shakes and which does not.',
      'Prove the side effect module survives when sideEffects is absent and is dropped when the field is set, and say why that is a promise rather than an optimisation.',
      'Show that the default-export-object shape keeps all three utilities, and explain what the bundler would have had to prove to drop them.',
      'Add a check that fails the build if the bundle grows past a threshold, so a regression is caught rather than noticed.',
    ],
  },
  {
    id: 'production-only-bug',
    title: 'Reproduce a production-only bug on purpose',
    difficulty: 'hard',
    prompt:
      'Write an app containing three deliberate production-only failures — a value inlined at build time, a comparison against constructor.name, and a polyfill dropped by a false sideEffects claim — then write the tests that catch each one.',
    requirements: [
      'Each bug passes against the dev server and fails against the production build; show both results.',
      'The tests run against the built output, not the source, and one command produces the build and runs them.',
      'Fix each bug in the way that survives a rebuild: a run time config source, an explicit brand, and an honest sideEffects list.',
      'Write a short note in the repo saying which three checks you would run first on the next production-only bug, in order.',
    ],
  },
]
