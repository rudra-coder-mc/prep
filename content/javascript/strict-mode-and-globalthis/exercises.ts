import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'mode-differences-harness',
    title: 'Prove the mode changes behaviour',
    difficulty: 'medium',
    prompt:
      'Write two files that export the same four functions — an undeclared assignment, a write to a frozen object, a plain call reporting its this, and a parameter reassignment reporting arguments[0] — one file sloppy and one strict. Then write a test that runs both and asserts every difference.',
    requirements: [
      'The sloppy file is a CommonJS file with no directive; the strict file is an ES module. State in a comment why the module needs no directive.',
      'Assert the sloppy undeclared assignment creates a property on globalThis, and that the strict one throws a ReferenceError naming the identifier.',
      'Assert the sloppy write to a frozen object returns normally and changes nothing, and that the strict one throws a TypeError.',
      'Assert the plain call reports globalThis in one file and undefined in the other.',
      'Assert arguments[0] follows the reassigned parameter in the sloppy file and not in the strict one, then add a default value to the sloppy parameter and assert the aliasing has gone.',
      'Clean up any global the sloppy tests create, so the tests pass in any order.',
    ],
  },
  {
    id: 'realm-registry',
    title: 'A registry that survives two copies',
    difficulty: 'medium',
    prompt:
      'Write registry.js, exporting get(name) and register(name, value), backed by one object per realm on globalThis so that two independent copies of the module share the same entries. Prove both halves: that the copies share, and that a second realm does not.',
    requirements: [
      'The property name is namespaced and created once; a second import must reuse the existing object rather than replace it.',
      'Load the module twice under different specifiers so the module registry treats them as separate modules, and assert a value registered through one is visible through the other.',
      'Assert the module works when globalThis already holds a registry created by an older copy, so the shape has to stay compatible.',
      'Run the same module in a worker or a child process and assert its registry is empty, then say in a comment what that proves about realms.',
      'Add a test asserting the module never reads window or global directly.',
    ],
  },
]
