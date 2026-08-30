import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'property-descriptors',
  title: 'Properties, descriptors and accessors',
  summary:
    'The three flags every property carries, getters and setters, which operations see which properties, and what freeze really promises.',
  order: 170,
  tags: ['objects', 'descriptors', 'immutability'],
  prerequisites: ['javascript/prototypes', 'javascript/value-and-reference'],
}
