import type { Exercise } from '@prep/core'

export const exercises: Exercise[] = [
  {
    id: 'parallel-dashboard-data-fetching',
    title: 'Parallelize independent data fetches in an async Server Component',
    difficulty: 'easy',
    prompt:
      'Refactor an analytics dashboard page from sequential awaiting to parallel data fetching using Promise.all, measuring the performance improvement.',
    requirements: [
      'Create an asynchronous Server Component page that fetches user profile metrics and recent activity events.',
      'Refactor any sequential await calls into a concurrent Promise.all execution.',
      'Render the fetched user metrics and activity list cleanly in the component JSX.',
      'Add error handling or test assertions verifying that failure in one promise is caught appropriately.',
    ],
  },
  {
    id: 'tagged-cache-revalidation',
    title: 'Implement tag-based cache revalidation for an inventory catalog',
    difficulty: 'medium',
    prompt:
      'Build a product catalog page using tagged fetch requests and implement a revalidation Server Action that purges the catalog cache on demand.',
    requirements: [
      'Create a Server Component page that fetches inventory items with the tag "inventory-items".',
      'Configure the fetch with time-based revalidation (e.g. 120 seconds) as a fallback.',
      'Implement a Server Action updateStock() that modifies an item and calls revalidateTag("inventory-items").',
      'Verify that calling the action immediately busts the cached catalog without requiring a server reboot.',
    ],
  },
]
