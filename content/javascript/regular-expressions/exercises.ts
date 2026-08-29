import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'parse-a-log-with-named-groups',
    title: 'Pull structured fields out of a log',
    difficulty: 'medium',
    prompt:
      'Write parseLog(text) that turns a raw log into an array of objects, using one regex with named groups and matchAll.',
    requirements: [
      "A line looks like '2024-05-01T10:00:00Z [error] Payment failed', and each parsed entry is { time, level, message }.",
      'One pattern with named groups, read with matchAll. No exec loop, no split-then-slice.',
      'Anchor the pattern per line with the m flag, so a bracketed word inside a message does not start a new entry.',
      'A line that does not fit the shape is skipped, and a log with no valid lines returns [], not null.',
      'Prove the skip: a three-line log with one malformed line in the middle returns exactly two entries.',
    ],
  },
  {
    id: 'defuse-a-backtracking-validator',
    title: 'Defuse a catastrophic validator',
    difficulty: 'hard',
    prompt:
      'The validator /^(\\w+\\s?)*$/ hangs on hostile input. Demonstrate the blowup, rewrite the pattern, and prove the rewrite accepts the language you actually meant.',
    requirements: [
      "Time the original against 'a'.repeat(n) + '!' for growing n, and show the time roughly doubling with each extra character. Stop while a run still finishes in under a second.",
      'Rewrite the pattern so the repetitions cannot overlap, and say in a comment why the new shape leaves the engine only one way to consume any input.',
      'Show the rewrite is flat: the timing no longer grows with n on the same hostile inputs.',
      'The original quietly accepted the empty string and a trailing space. Decide what the validator should do with each, write the decision down, and test both.',
      'Check the two patterns against single words, multiple words, and a double space, so the rewrite provably matches everything it should.',
      'Bound the input length before matching, and say in a comment why the bound is defence in depth rather than the fix.',
    ],
  },
]
