import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'isolate-client-interactivity',
    title: 'Extract interactive controls to preserve server component benefits',
    difficulty: 'easy',
    prompt:
      'Refactor a monolithic profile page component that accesses the database and includes an interactive bookmark button into a Server Component page and an isolated Client Component button.',
    requirements: [
      'Create an asynchronous Server Component page that loads user profile data directly without client-side fetching.',
      'Create a dedicated BookmarkButton component marked with the "use client" directive.',
      'Implement state and an onClick handler in BookmarkButton to toggle the saved state.',
      'Render the BookmarkButton inside the Server Component page, passing the minimal required primitive ID prop.',
    ],
  },
  {
    id: 'modal-wrapper-with-server-content',
    title: 'Compose server content inside a client dialog wrapper using children',
    difficulty: 'medium',
    prompt:
      'Build a reusable client-side modal dialog wrapper that accepts Server Component content via the children prop, ensuring zero server-code leakage into the client bundle.',
    requirements: [
      'Implement a ClientModal component marked with "use client" that manages open/close state with useState.',
      'Ensure ClientModal accepts and renders children: React.ReactNode without importing server dependencies.',
      'Create a ServerDetails component that simulates reading large backend dataset information.',
      'In a parent Server Component page, compose ServerDetails inside ClientModal and verify that the server component runs only on the server.',
    ],
  },
]
