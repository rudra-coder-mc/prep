import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'pipe',
    title: 'Feed a value through a list of steps',
    difficulty: 'easy',
    prompt:
      'Write pipe(...fns), which returns a function that passes its argument through each function in order, left to right.',
    requirements: [
      'pipe(trim, toLowerCase, capitalise)("  ADA ") returns "Ada".',
      'pipe() with no functions returns a function that gives back whatever it was passed.',
      'The first function receives every argument the returned function was called with; the rest receive one value each.',
      'Build it with reduce rather than a loop, and keep it to a handful of lines.',
      'Add a one-line comment saying why the order is left to right here and right to left in a compose.',
    ],
  },
  {
    id: 'debounce',
    title: 'Debounce a function',
    difficulty: 'medium',
    prompt:
      'Write debounce(fn, wait), which returns a function that only calls fn once the returned function has stopped being called for wait milliseconds.',
    requirements: [
      'Calling the debounced function five times in quick succession calls fn once, with the arguments from the last call.',
      'The timer restarts on every call rather than running from the first one.',
      'fn is called with the same this the debounced function was called with.',
      'The returned function exposes a cancel() that stops a pending call from happening.',
      'Write down, in a comment, the one line you would change to make it a throttle instead, and say what the difference means for a scroll handler.',
    ],
  },
]
