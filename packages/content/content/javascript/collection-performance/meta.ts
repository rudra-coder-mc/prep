import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'collection-performance',
  title: 'What a collection operation costs',
  summary:
    'Which operations are constant and which scan, the nested loop that turns slow at ten thousand rows, the copies a spread makes, and when the constant beats the curve.',
  order: 250,
  tags: ['performance', 'collections', 'complexity'],
  prerequisites: ['javascript/map-and-set', 'javascript/array-methods'],
}
