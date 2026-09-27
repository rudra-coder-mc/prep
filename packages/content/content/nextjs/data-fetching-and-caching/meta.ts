import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'data-fetching-and-caching',
  title: 'Data Fetching, Caching, and Revalidation',
  summary:
    'Fetching data directly inside async Server Components, request deduplication, static vs dynamic rendering, time-based and on-demand cache revalidation.',
  order: 30,
  tags: ['nextjs', 'data-fetching', 'caching', 'revalidation', 'static-rendering'],
  prerequisites: ['nextjs/server-and-client-components', 'browser/fetch-and-the-network'],
}
