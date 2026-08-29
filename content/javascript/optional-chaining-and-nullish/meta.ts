import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'optional-chaining-and-nullish',
  title: 'Optional chaining and nullish handling',
  summary:
    'Reading into something that might not be there, choosing a fallback without clobbering 0 and the empty string, and where ?. stops.',
  order: 70,
  tags: ['syntax', 'null', 'defaults'],
  prerequisites: ['javascript/types-and-coercion'],
}
