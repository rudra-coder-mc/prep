import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'composition-over-inheritance',
  title: 'Composition against inheritance',
  summary:
    'What an extends chain couples, what composition and mixins give instead, and the question that decides between them.',
  order: 210,
  tags: ['classes', 'design', 'inheritance'],
  prerequisites: ['javascript/extends-and-super', 'javascript/higher-order-functions'],
}
