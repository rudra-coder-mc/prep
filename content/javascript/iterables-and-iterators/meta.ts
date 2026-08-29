import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'iterables-and-iterators',
  title: 'Iterables and the iteration protocol',
  summary:
    'The two-method contract behind for...of, spread and destructuring, what is iterable and what is not, and how to make your own object play along.',
  order: 220,
  tags: ['iteration', 'protocols', 'collections'],
  prerequisites: ['javascript/prototypes', 'javascript/destructuring'],
}
