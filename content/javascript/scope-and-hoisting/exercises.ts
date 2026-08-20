import type { Exercise } from '@/content/schema'

export const exercises: Exercise[] = [
  {
    id: 'predict-then-run',
    title: 'Predict the declaration errors',
    difficulty: 'easy',
    prompt:
      'Write a file with five reads that each happen before their declaration - one var, one let, one const, one class and one function declaration - and predict each result before running it.',
    requirements: [
      'Write your prediction as a comment above each read before you run anything.',
      'Each case is isolated, so one throw does not hide the next.',
      'Note which two cases print a value rather than throwing, and why they differ from each other.',
      'Add a sixth case reading a name that is never declared, and explain why typeof behaves differently there.',
    ],
  },
  {
    id: 'remove-the-globals',
    title: 'Contain a script that leaks',
    difficulty: 'medium',
    prompt:
      'Take a non-strict script that declares everything with var and assigns to at least one undeclared name, and rewrite it so nothing reaches globalThis.',
    requirements: [
      'The rewrite keeps the same behaviour and the same public entry point.',
      'Everything that is not the entry point is unreachable from outside.',
      'Add "use strict" and show which line the accidental global was on by the error it now produces.',
      'In a comment, say what the equivalent file would need if it were an ES module instead.',
    ],
  },
]
