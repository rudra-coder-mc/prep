import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'regular-expressions',
  title: 'Regular expressions',
  summary:
    'Groups, greedy against lazy, the `lastIndex` a global regex carries between calls, and when not to reach for one.',
  order: 140,
  tags: ['regex', 'strings'],
  prerequisites: ['javascript/strings'],
}
