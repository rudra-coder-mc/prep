import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'predict-and-verify',
    title: 'Predict, then verify',
    difficulty: 'medium',
    prompt:
      'Write a script mixing synchronous logs, two setTimeout(fn, 0) calls, a resolved promise chain of three .then steps, and a queueMicrotask. Write down the expected output first, then run it.',
    requirements: [
      'Predict the full output in a comment before running anything.',
      'The script must contain at least two macrotasks and three microtasks.',
      'Explain in a comment why every microtask runs before the first timer.',
      'If your prediction was wrong, keep it in the file and note what you got wrong.',
    ],
  },
  {
    id: 'starve-the-loop',
    title: 'Starve the event loop',
    difficulty: 'hard',
    prompt:
      'Write a function that schedules itself with queueMicrotask forever, and a second version using setTimeout. Observe what each does to the page.',
    requirements: [
      'The microtask version must make the page unresponsive.',
      'The setTimeout version must leave the page usable.',
      'Explain in a comment why the two behave differently.',
      'Include a way to stop each one after a fixed number of iterations so the file is safe to run.',
    ],
  },
]
