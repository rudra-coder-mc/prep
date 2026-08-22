import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'higher-order-functions',
  title: 'Higher order functions',
  summary:
    'Functions that take or return functions, and what changes once a step can be an argument.',
  order: 80,
  difficulty: 'medium',
  tags: ['functions', 'callbacks', 'composition'],
  prerequisites: ['javascript/closures', 'javascript/parameters-and-arguments'],
}
