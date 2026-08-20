import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'parse-user-number',
    title: 'Parse a number from user input',
    difficulty: 'easy',
    prompt:
      'Write parseCount(input) that turns text typed into a form into a number, or returns null if the text is not one.',
    requirements: [
      "'12' returns 12, and ' 12 ' returns 12.",
      "'', '   ', 'abc' and '12px' all return null.",
      "'0' returns 0, not null - a valid zero is not a failure.",
      'Say in a comment why Number and parseInt disagree about "12px", and which one you chose.',
    ],
  },
  {
    id: 'loose-equality',
    title: 'Reimplement loose equality',
    difficulty: 'hard',
    prompt:
      'Write looseEquals(a, b) that reproduces == for primitives, using only === and explicit conversions.',
    requirements: [
      'Same type on both sides falls through to ===.',
      'null and undefined are equal to each other and to nothing else.',
      'A number compared with a string converts the string to a number.',
      'A boolean on either side becomes a number before anything else is decided.',
      'Check it against == for at least these pairs: 0 and "", 1 and true, null and 0, NaN and NaN.',
    ],
  },
]
