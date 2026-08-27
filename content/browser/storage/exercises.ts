import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'the-storage-you-can-trust',
    title: 'Write the read and write every key goes through',
    difficulty: 'medium',
    prompt:
      'Build the small module that stands between your app and localStorage, then break storage on purpose and prove each failure is handled rather than thrown at the user.',
    requirements: [
      'A read that returns the default for a missing key, catches a parse failure, removes the bad key, and is proved against a value written as an object rather than as JSON.',
      'A write that reports failure instead of throwing, with a test that fills the origin until the quota is gone and asserts the caller is told.',
      'A version stamped into the stored value, and a test that a value from the previous version is migrated or discarded rather than parsed into something the app misreads.',
      'Cross-tab behaviour: a storage listener that keeps a second tab in step, and a test proving the writing tab updates itself, since the event never reaches it.',
      'A written note on which of these you would keep if the data moved to IndexedDB tomorrow, and which exist only because web storage is strings.',
    ],
  },
  {
    id: 'the-same-data-four-ways',
    title: 'Store one object in all four places and measure what it costs',
    difficulty: 'hard',
    prompt:
      'Take one record with a date, a Set of tags and an image in it, store it in localStorage, sessionStorage, a cookie and IndexedDB, and record what each one does to it and to the page.',
    requirements: [
      'What survives the round trip in each, with the date, the Set and the image each checked by type rather than by eye, and an explanation of why IndexedDB keeps what JSON loses.',
      'A measurement of the blocking cost: a large localStorage read timed against the same read from IndexedDB, taken on a throttled CPU, with the effect on first paint stated.',
      'The cookie version sent to a local server, with the request size of a page of twenty assets measured with the cookie set and without it.',
      'The quota of each, found by writing until it fails rather than by looking it up, in a normal window and in a private one.',
      'A one-page recommendation for where a session token, a theme, a draft and an offline cache each belong, with the reason for each and the case against the runner-up.',
    ],
  },
]
