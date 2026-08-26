import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'static-and-private',
  title: 'Static and private members',
  summary:
    'What belongs to the class rather than the instance, what #private really guarantees, the brand check, and where each one breaks.',
  order: 170,
  difficulty: 'medium',
  tags: ['classes', 'encapsulation', 'static'],
  prerequisites: ['javascript/class-syntax', 'javascript/extends-and-super'],
}
