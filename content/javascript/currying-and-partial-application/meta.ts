import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'currying-and-partial-application',
  title: 'Currying and partial application',
  summary:
    'Fixing some arguments now and the rest later, and why the two names are not the same technique.',
  order: 120,
  tags: ['functions', 'currying', 'closures', 'bind'],
  prerequisites: ['javascript/higher-order-functions', 'javascript/parameters-and-arguments'],
}
