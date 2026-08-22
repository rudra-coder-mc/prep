import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'mutation-audit',
    title: 'Prove which methods mutate',
    difficulty: 'easy',
    prompt:
      'Write a script that calls every array method from the lesson on a frozen array inside a try block, and prints a table of which ones threw, what each returned, and whether the return value is the same reference as the input.',
    requirements: [
      'Cover the nine mutating methods, their four copying twins, and at least map, filter, slice, concat, flat, find, some, every, includes and join.',
      'For each method record: threw or not, the return value, and whether return === input.',
      'The table must show sort and reverse returning the same reference and toSorted and toReversed returning a different one.',
      'Add a comment on the one method that throws on a frozen array even though it did not need to change anything, and say why.',
    ],
  },
  {
    id: 'multi-key-sort',
    title: 'Sort by several keys without a library',
    difficulty: 'medium',
    prompt:
      'Write sortBy(items, ...keys) where each key is a field name, optionally prefixed with - for descending, so sortBy(users, "-age", "name") orders by age descending and then name ascending within ties.',
    requirements: [
      'Never mutate the input; return a new array.',
      'Strings compare with localeCompare, numbers with subtraction, and a comparison that returns NaN is treated as a tie rather than breaking the sort.',
      'Prove stability: sort a list where every item has the same age and assert the original order is preserved.',
      'Write the comparator so a reader can see the "first non-zero comparison wins" rule in one line, and say in a comment why a boolean comparator would have broken it.',
    ],
  },
]
