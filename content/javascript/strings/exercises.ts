import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'count-characters',
    title: 'Count characters three ways',
    difficulty: 'medium',
    prompt:
      'Write countCodeUnits, countCodePoints and countGraphemes, then use them to build a display counter for a field with a limit of 280 of whatever a reader would call a character.',
    requirements: [
      "For 'abc' all three return 3.",
      'For a single thumbs-up emoji they return 2, 1 and 1.',
      'For a family emoji built from three people joined by zero-width joiners they return 8, 5 and 1.',
      'countGraphemes uses Intl.Segmenter, and falls back to the code point count where Segmenter is unavailable.',
      'Say in a comment which count a storage limit should use and which one the counter shown to the user should use, and why they are different.',
    ],
  },
  {
    id: 'match-names',
    title: 'Match two names a user typed the same way',
    difficulty: 'hard',
    prompt:
      'Write sameName(a, b) that decides whether two names are the same name, for input pasted from anywhere.',
    requirements: [
      "'café' typed as one accented letter and 'café' typed as e plus a combining accent are the same name.",
      "'  Ada  Lovelace ' and 'ada lovelace' are the same name.",
      "'Ängela' and 'Angela' are the same name, and 'Angela' and 'Angel' are not.",
      'Normalise once and compare, rather than stripping characters until the two strings happen to match.',
      'Handle the invisible cases: a non-breaking space between the names, and a zero-width space anywhere in either.',
      'Write down which of these rules you would not apply to a legal name field, and why matching and identity are different jobs.',
    ],
  },
]
