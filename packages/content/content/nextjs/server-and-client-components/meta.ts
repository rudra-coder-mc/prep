import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'server-and-client-components',
  title: 'Server and Client Components',
  summary:
    'Understanding React Server Components (RSC) vs Client Components, the "use client" boundary, zero client bundle weight, and passing server children through client wrappers.',
  order: 20,
  tags: ['nextjs', 'rsc', 'server-components', 'client-components', 'use-client'],
  prerequisites: ['nextjs/routing-and-layouts', 'react/components-and-jsx'],
}
