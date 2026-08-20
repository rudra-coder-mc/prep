import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'promises',
  title: 'Promises and async/await',
  summary: 'Composing asynchronous work, and the error handling most code gets wrong.',
  order: 120,
  difficulty: 'medium',
  tags: ['promise', 'async'],
  prerequisites: ['javascript/event-loop'],
}
