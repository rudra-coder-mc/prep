import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'custom-errors',
  title: 'Custom error types',
  summary:
    'Extending Error properly, why the name is wrong until you set it, carrying data a caller can act on, and when a code beats a class.',
  order: 320,
  tags: ['error', 'class'],
  prerequisites: ['javascript/error-types', 'javascript/extends-and-super'],
}
