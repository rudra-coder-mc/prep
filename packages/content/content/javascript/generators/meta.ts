import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'generators',
  title: 'Generators',
  summary:
    'Functions that pause at yield and resume on next, what they give the iteration protocol, two-way communication, and yield* for delegation.',
  order: 230,
  tags: ['generators', 'iteration', 'lazy'],
  prerequisites: ['javascript/iterables-and-iterators', 'javascript/closures'],
}
