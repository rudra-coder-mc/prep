import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'resilient-loader',
    title: 'A loader that survives individual failures',
    difficulty: 'medium',
    prompt:
      'Write loadAll(urls, { concurrency }) that fetches every url with at most `concurrency` requests in flight, retries a failed url once, and resolves with { fulfilled: Map, rejected: Array } where rejected entries carry the url and its last error.',
    requirements: [
      'Never more than `concurrency` requests in flight at any moment; prove it by counting in-flight fetches and asserting the peak.',
      'A failed url is retried exactly once before it lands in rejected. A url that fails twice appears once in rejected.',
      'fulfilled maps each url to its response body, whatever order the responses arrived in.',
      'One permanently failing url must not prevent any other url from being fetched.',
      'Say in a comment why Promise.all alone cannot express this, and which combinator you built it from.',
    ],
  },
  {
    id: 'timeout-and-fallback',
    title: 'Timeout and fallback, wired together',
    difficulty: 'hard',
    prompt:
      'Write withTimeout(promise, ms) and fastestOf(taskFns), where fastestOf runs every task concurrently, ignores individual failures, and rejects only when all tasks have failed or the overall deadline passed.',
    requirements: [
      'withTimeout clears its timer when the promise settles early; assert no timer is left pending afterwards.',
      'fastestOf takes task functions, not promises, so each call happens at invocation time — assert the functions are called exactly once each.',
      'When two tasks fail and one succeeds, fastestOf resolves with the success; assert the value.',
      'When every task fails before the deadline, fastestOf rejects with an AggregateError whose errors array holds one reason per task.',
      'Comment on what still runs after withTimeout rejects a promise, and what mechanism would actually stop it.',
    ],
  },
]
