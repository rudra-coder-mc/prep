import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'immutable-update',
    title: 'Update one field, deep in a tree',
    difficulty: 'medium',
    prompt:
      'Given a nested settings object, write setIn(object, path, value) that returns a new object with one leaf changed and everything off the path shared with the original.',
    requirements: [
      'The original object is unchanged, at every level.',
      'Objects that are not on the path are the same references in the result, not copies.',
      'A path that does not exist yet is created rather than throwing.',
      'Prove both halves with assertions: the changed leaf differs, and an untouched branch passes ===.',
    ],
  },
  {
    id: 'copy-comparison',
    title: 'Compare four ways of copying',
    difficulty: 'easy',
    prompt:
      'Build one object containing a nested object, an array, a Date, a Map, an undefined value and a method, then copy it with spread, Object.assign, structuredClone and a JSON round trip.',
    requirements: [
      'For each copy, record what is shared, what is duplicated and what is lost or changed type.',
      'Include the case that throws, and say why it throws rather than dropping the value.',
      'Mutate the nested object afterwards and note which copies see the change.',
      'End with one sentence on which copy you would reach for by default, and when you would not.',
    ],
  },
]
