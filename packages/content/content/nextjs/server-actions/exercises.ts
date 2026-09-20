import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'newsletter-signup-action',
    title: 'Build a newsletter signup form with Server Action validation',
    difficulty: 'easy',
    prompt:
      'Implement a newsletter subscription form using a Server Action that accepts FormData, validates the email address on the server, and returns descriptive feedback.',
    requirements: [
      'Create a dedicated actions file with the "use server" directive exporting a subscribeEmail action.',
      'Extract and validate the email input from the passed FormData instance.',
      'Return an error object if the email format is invalid or empty, and a success confirmation if valid.',
      'Wire the action to an HTML form and display the returned message cleanly.',
    ],
  },
  {
    id: 'task-manager-with-optimistic-feedback',
    title: 'Implement task creation with pending submission status and revalidation',
    difficulty: 'medium',
    prompt:
      'Create a task management form using a Server Action that updates the database, invalidates the task list cache using revalidatePath, and uses useFormStatus to disable submission controls while pending.',
    requirements: [
      'Create a Server Action that writes a new task record and calls revalidatePath("/tasks").',
      'Create a Client Component SubmitButton that invokes useFormStatus to display a loading state and disable the button while submitting.',
      'Render the task creation form and the dynamic task list in the route page.',
      'Verify that submitting a task updates the UI list without a full-page reload.',
    ],
  },
]
