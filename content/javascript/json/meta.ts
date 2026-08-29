import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'json',
  title: 'JSON serialisation and its edges',
  summary:
    'What stringify keeps and drops, how toJSON, the replacer and the reviver hook in, and the values that do not survive a round trip.',
  order: 260,
  tags: ['json', 'serialisation', 'data'],
  prerequisites: ['javascript/value-and-reference', 'javascript/property-descriptors'],
}
