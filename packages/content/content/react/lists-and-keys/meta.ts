import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'lists-and-keys',
  title: 'Lists, Keys, and Reconciliation',
  summary:
    'Rendering dynamic collections with map(), the role of keys in React reconciliation, why using array indices as keys creates severe state bugs, and using stable IDs.',
  order: 50,
  tags: ['react', 'lists', 'keys', 'reconciliation', 'collections'],
  prerequisites: [
    'react/components-and-jsx',
    'react/state-and-rendering',
    'javascript/array-methods',
  ],
}
