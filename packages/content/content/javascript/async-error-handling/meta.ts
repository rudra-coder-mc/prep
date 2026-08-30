import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'async-error-handling',
  title: 'Errors across async boundaries',
  summary:
    'Where try/catch reaches, where it cannot, what finally does and does not change, and how errors get lost between a throw and a handler.',
  order: 370,
  tags: ['promise', 'async', 'error'],
  prerequisites: [
    'javascript/throwing-and-catching',
    'javascript/promises',
    'javascript/promise-combinators',
  ],
}
