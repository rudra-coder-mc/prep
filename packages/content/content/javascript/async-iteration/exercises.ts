import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'emitter-converter',
    title: 'Turn push into pull',
    difficulty: 'hard',
    prompt:
      'Write events(emitter, eventNames, signal) as an async generator that yields values from any of the given emitter events, forwards an "error" event as a rejection, and unsubscribes everything when the consuming loop exits — by break, throw, or exhaustion.',
    requirements: [
      'Values arriving while the consumer processes the previous one are queued, not dropped; assert nothing is lost with a burst of three rapid events.',
      'An empty queue suspends the generator until the next event; no polling, no timers.',
      'The "error" event surfaces as a throw at the for-await statement, catchable around the loop.',
      'Breaking out of the loop removes every listener added — assert with emitter.listenerCount() returning zero.',
      'Passing a signal aborts the wait: the generator completes cleanly and listeners are still removed.',
    ],
  },
  {
    id: 'lazy-pagination',
    title: 'Pages fetched only when needed',
    difficulty: 'medium',
    prompt:
      'Write pages(fetchPage) as an async generator that walks a paginated API lazily: each page is fetched only after the previous page is fully consumed, and iteration ends when a page comes back empty. Prove the laziness.',
    requirements: [
      'A consumer that breaks after the first matching item causes exactly two fetches for a five-page dataset — count and assert it.',
      'A consumer that runs to exhaustion sees every item in page order and triggers one fetch per page plus the final empty one.',
      'Two independent consumers iterating the same pages() call each drive their own fetches; state in a comment what this says about generator reuse.',
      'fetchPage receives the page number, and the generator awaits its result — a slow second page must not be requested early.',
    ],
  },
]
