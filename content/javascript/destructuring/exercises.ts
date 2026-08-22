import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'partial-response',
    title: 'Flatten a response that is never quite complete',
    difficulty: 'medium',
    prompt:
      'Write parseUser(response) that turns a nested API response into a flat { id, name, email, roles, city } object using destructuring, and never throws whatever the response is missing.',
    requirements: [
      'Handle a missing branch, a branch that is null, and a field that is an empty string, and say in a comment which of those a pattern default covers and which it does not.',
      'Every output field has a sensible default, and the empty string is kept as an empty string rather than replaced.',
      'Do it in one pattern where that stays readable, and say where you stopped and why.',
      'Prove it with assertions for the full response, an empty object, and a response where data is null.',
    ],
  },
  {
    id: 'positional-to-options',
    title: 'Turn positional arguments into an options object',
    difficulty: 'easy',
    prompt:
      'Take a function createServer(host, port, ssl, maxConnections) with four positional parameters and refactor it to take one options object with destructured defaults, keeping every existing call working through a thin wrapper.',
    requirements: [
      'The new function can be called with no argument at all, and with an object that sets only some of the fields.',
      'A caller passing 0 for maxConnections or false for ssl gets that value, not the default.',
      'The wrapper that keeps the old positional calls working is written with rest and spread, not by naming each parameter twice.',
      'Include a call for each of the three shapes and assert what the function received.',
    ],
  },
]
