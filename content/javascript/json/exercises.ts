import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'tagged-round-trip',
    title: 'Make state survive a round trip',
    difficulty: 'medium',
    prompt:
      'Write save(state) and load(text) for a state object that contains a Date, a Map, a Set and a BigInt, so that load(save(state)) is structurally equal to state, using a replacer and a reviver with type tags.',
    requirements: [
      'Each unsupported type is written as a tagged object such as { $type: "Date", value: ... } and revived back to the right type.',
      'A plain object that happens to have a $type key is not mistaken for a tag, and say in a comment how you told them apart.',
      'The replacer handles a Date correctly even though toJSON has already run by the time the replacer sees it, and explain in a comment how you got at the original.',
      'Assert the round trip for each type, including a Map whose keys are objects, and a nested Set inside a Map value.',
    ],
  },
  {
    id: 'loss-audit',
    title: 'Catalogue what a round trip loses',
    difficulty: 'easy',
    prompt:
      'Build one object containing every edge value the lesson lists, pass it through JSON.parse(JSON.stringify(value)), and produce a table of what came back for each.',
    requirements: [
      'Cover undefined in an object and in an array, a function, a symbol value, NaN, Infinity, -0, a Date, a Map, a RegExp, a class instance and an integer above 2 ** 53.',
      'Add the two cases that throw, catching each and recording the error name.',
      'For each row, record the value in, the value out, and whether the change is silent or loud.',
      'Finish with the same object through structuredClone and note every row where the two copies differ.',
    ],
  },
]
