import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'the-request-wrapper',
    title: 'Write the wrapper every request goes through',
    difficulty: 'hard',
    prompt:
      'Build the request function described in the interview question, against a local server you can make fail on demand, and test every failure path rather than only the happy one.',
    requirements: [
      'A typed error per case, HttpError with a status and body, NetworkError, TimeoutError, and AbortError passed through untouched, each asserted against a server that produces it.',
      'A timeout built from AbortSignal.any over the caller signal and a deadline, with a test that the caller can still cancel before the deadline and that the right error name arrives in each case.',
      'Retries with exponential backoff and jitter on 502, 503, 504 and network failure, and a test proving a POST is not retried unless an idempotency key was supplied.',
      'JSON and FormData bodies both handled, with an assertion that the FormData request has a boundary in its content type and that the JSON one has the header you set.',
      'A written list of what you decided to leave out and why, with caching and 401 refresh addressed explicitly.',
    ],
  },
  {
    id: 'racing-responses',
    title: 'Make an out-of-order response happen, then stop it three ways',
    difficulty: 'medium',
    prompt:
      'Build a search box against a server that answers slowly and unpredictably, reproduce a stale result reliably, then fix it with abort, with a sequence number, and with both plus a debounce, and compare.',
    requirements: [
      'A server that delays each response by an amount that makes the stale render reproducible rather than occasional, and a test that fails without a fix.',
      'The abort version, with a test that no render runs for a cancelled query and that an AbortError never reaches the error reporter.',
      'The sequence number version, with a measurement of how much network traffic it does that the abort version does not.',
      'A debounce added to the abort version, with a written argument about what each of the two is responsible for and why neither replaces the other.',
      'A note on what changes if the requests are not idempotent, and what you would do instead of cancelling.',
    ],
  },
]
