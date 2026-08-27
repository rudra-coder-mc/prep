import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'value-and-reference',
  title: 'Values, references and copying',
  summary:
    'What a variable actually holds, why two identical objects are not equal, and how deep a copy goes.',
  order: 30,
  tags: ['objects', 'memory', 'immutability'],
  prerequisites: ['javascript/types-and-coercion'],
}
