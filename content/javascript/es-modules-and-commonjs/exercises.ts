import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'live-binding-proof',
    title: 'Prove the binding is live',
    difficulty: 'medium',
    prompt:
      'Write the same counter twice — once as an ES module exporting a mutable count, once as a CommonJS file — and a test for each that shows what an importer sees after the count changes.',
    requirements: [
      'The module version asserts the imported binding reflects the change, and that assigning to it throws a TypeError.',
      'The CommonJS version asserts a destructured require goes stale, and that reading the property off the required object does not.',
      'Add a third CommonJS variant that reassigns module.exports after evaluation, and assert the importer never sees the new object. Say in a comment why.',
      'One test asserts the namespace object from import * as is frozen, listing which operations on it throw.',
    ],
  },
  {
    id: 'lazy-feature-loader',
    title: 'Load a feature only when it is asked for',
    difficulty: 'medium',
    prompt:
      'Write loadFeature(name) that dynamically imports one of several feature modules, caches the result so a second call does not import again, and surfaces a failed load as a typed error the caller can retry.',
    requirements: [
      'The name is validated against a known map of specifiers rather than interpolated into the import, and a test asserts an unknown name rejects without attempting a load.',
      'The default export is unwrapped for the caller; a test asserts the returned value is the feature and not the namespace object.',
      'Two concurrent calls for the same feature share one import — count the loads and assert it is one.',
      'A rejected import is not cached: assert a second call after a failure tries again and can succeed.',
      'A test asserts nothing is loaded until loadFeature is called, using a module that records its own evaluation.',
    ],
  },
]
