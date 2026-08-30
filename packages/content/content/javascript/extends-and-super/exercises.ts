import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'error-hierarchy',
    title: 'A small error hierarchy that survives everything',
    difficulty: 'medium',
    prompt:
      'Write an AppError base extending Error, with NotFound and Validation extending it, so that each carries a status code and extra data, prints a correct name in its stack, and can be told apart by a handler.',
    requirements: [
      'Each subclass calls super with a message and sets name. Assert that String(err) and err.stack both start with the subclass name.',
      'Assert err instanceof NotFound, err instanceof AppError and err instanceof Error all hold, and that a NotFound is not a Validation.',
      'Write one handler that switches on instanceof to pick a status code, and a test that shows a plain Error falls through to 500.',
      'Show what JSON.stringify(err) produces, explain in a comment why message is missing, and add a toJSON that includes name, message and the extra data.',
    ],
  },
  {
    id: 'constructor-order-fix',
    title: 'Fix the base constructor that calls an override',
    difficulty: 'medium',
    prompt:
      'Start from a Base whose constructor calls this.validate(), and a Derived with a field rules = [] and an overriding validate that reads this.rules. Reproduce the failure, then fix it two different ways.',
    requirements: [
      'Reproduce the TypeError and write a comment that gives the exact order of events: derived constructor, super, base constructor, overridden validate, field initialiser.',
      'Fix one: move the call out of the constructor into a method the caller invokes after new. Show the call site.',
      'Fix two: keep the call in the constructor and pass the rules as a constructor argument that Base stores before calling validate. Say in a comment what the subclass gave up.',
      'Add a test that constructs each fixed version and asserts validate saw a non-empty rules array.',
    ],
  },
]
