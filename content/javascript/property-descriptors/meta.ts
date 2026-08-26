import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'property-descriptors',
  title: 'Properties, descriptors and accessors',
  summary:
    'The three flags every property carries, getters and setters, which operations see which properties, and what freeze really promises.',
  order: 140,
  difficulty: 'medium',
  tags: ['objects', 'descriptors', 'immutability'],
  prerequisites: ['javascript/prototypes', 'javascript/value-and-reference'],
}
