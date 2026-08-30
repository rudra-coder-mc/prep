import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'measure-the-curve',
    title: 'Measure the curve, not the speed',
    difficulty: 'medium',
    prompt:
      'Write a small harness that times an operation at several input sizes and prints the ratio between them, then use it to show the difference between a nested scan and an indexed lookup. The goal is a number that tells you which curve you are on, not a benchmark result.',
    requirements: [
      'time(label, sizes, build, run) generates input of each size, times only the run, and prints the time and the ratio to the previous size.',
      'Show a linear operation and a quadratic one, and point out that the ratios are about 2 and about 4 for a doubling of size.',
      'Compare joining two lists with find inside map against a Map index, at 1000 and 10000 each, and record the results in a comment.',
      'Compare includes against a Set at sizes 4, 32 and 4096, and say in a comment where the crossover fell on your machine.',
      'Include a comment on one way the harness lies: warm-up and optimisation on the first run, or the engine discarding work whose result is unused.',
    ],
  },
  {
    id: 'fix-four-hot-loops',
    title: 'Fix four hot loops without changing what they return',
    difficulty: 'medium',
    prompt:
      'Take four functions with the classic costs in them, write tests that pin their current output exactly, then rewrite each one to be linear. The tests are the point: a rewrite that is fast and different is a bug.',
    requirements: [
      'A join with find inside map, rewritten with a Map index, including a case where the lookup misses.',
      'A reduce with { ...acc, [key]: value }, rewritten to mutate the accumulator, with a test asserting the input is untouched.',
      'A queue drained with shift, rewritten to advance an index, with a test asserting the jobs run in the same order.',
      'A sort whose comparator parses a date, rewritten as decorate, sort, undecorate, with a test asserting equal keys keep their original order.',
      'Every rewrite has a test written against the original that still passes afterwards, and a comment naming the operation whose count went down.',
    ],
  },
]
