import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'server-actions',
  title: 'Server Actions and Mutations',
  summary:
    'Executing server-side mutations without API routes using the "use server" directive, progressive enhancement with HTML forms, and handling pending state with useActionState.',
  order: 40,
  tags: ['nextjs', 'server-actions', 'use-server', 'forms', 'mutations'],
  prerequisites: ['nextjs/server-and-client-components', 'nextjs/data-fetching-and-caching'],
}
