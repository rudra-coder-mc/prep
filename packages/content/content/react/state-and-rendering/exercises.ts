import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'refactor-redundant-state',
    title: 'Refactor redundant and duplicated state into derived values',
    difficulty: 'easy',
    prompt:
      'Given a shopping cart component that maintains separate state variables for items, totalItemCount, subtotal, and tax, eliminate the redundant state variables by calculating derived values during render.',
    requirements: [
      'Store only the raw cart items array in useState; remove separate useState hooks for total count, subtotal, and tax.',
      'Derive totalItemCount, subtotal, and calculated tax on the fly during the render function execution.',
      'Ensure adding, removing, or changing item quantities immediately updates all calculated totals without synchronization useEffect hooks.',
      'Include a unit test verifying that totals remain completely accurate across multiple simulated cart operations.',
    ],
  },
  {
    id: 'build-rock-solid-interval-timer',
    title: 'Implement a drift-free interval timer resilient to stale closures',
    difficulty: 'medium',
    prompt:
      'Build a stopwatch component that accurately increments elapsed seconds and laps every 100 milliseconds without suffering from stale closures or re-registering intervals on every tick.',
    requirements: [
      'Use an updater function (prev => ...) inside the timer tick handler so the interval does not require the current seconds variable in its closure.',
      'Provide start, pause, reset, and lap buttons that correctly manipulate timer state without desynchronizing.',
      'Ensure the interval is cleared when paused or unmounted to prevent memory leaks.',
      'Demonstrate that rapid consecutive button clicks do not trigger race conditions or jump time backwards.',
    ],
  },
]
