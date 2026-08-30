import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'the-dom',
  title: 'The DOM: a tree the browser owns',
  summary:
    'What the tree is and is not, which collections update themselves behind your back, and why reading a layout property in a loop is the slowest line you will ever write.',
  order: 10,
  tags: ['dom', 'rendering', 'performance'],
  prerequisites: ['javascript/value-and-reference', 'javascript/array-methods'],
}
