import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'debounce-from-scratch',
    title: 'Write debounce, then everything a real one has',
    difficulty: 'medium',
    prompt:
      'Build debounce from nothing, with fake timers so the tests are instant and deterministic, and add each production feature only once a failing test asks for it.',
    requirements: [
      'A burst of calls produces one run, with the arguments of the last call, at the end of the wait.',
      'A test that fails on an implementation which drops the receiver: debounce a method, call it as obj.method(), and assert on what this was inside.',
      'cancel discards the pending run, and flush runs it immediately, each with a test asserting the other did not happen.',
      'A leading edge option, with tests for leading only, trailing only, and the accidental both, which runs twice for a single call.',
      'A promise-returning version where every caller in one burst resolves with the same result, and a comment on why rejecting the superseded callers is worse.',
    ],
  },
  {
    id: 'throttle-and-measure',
    title: 'Throttle a real stream of events and count the runs',
    difficulty: 'hard',
    prompt:
      'Write throttle with both edges, then drive all three of raw, debounced and throttled handlers from the same synthetic stream of five hundred events and compare what each one did.',
    requirements: [
      'throttle(fn, interval, { leading, trailing }) with tests for the first call running immediately and the last event of a burst not being dropped.',
      'A test that the trailing run uses the newest arguments seen during the window, not the ones that scheduled it.',
      'A synthetic stream over two seconds, reporting run counts and the timestamp of the last run for raw, debounced and throttled.',
      'A comment stating which of the three you would use for a scroll indicator, a search box and an autosave, with the reason in one line each.',
      'A requestAnimationFrame version of the visual case, with a note on what it does that a 16ms throttle does not.',
    ],
  },
]
