import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'abortcontroller',
  title: 'Cancellation with AbortController',
  summary:
    'Why promises cannot be cancelled, how fetch and your own async work get stopped through a signal, timeouts that actually abort, and combining signals.',
  order: 280,
  difficulty: 'hard',
  tags: ['promise', 'async', 'abort'],
  prerequisites: ['javascript/promise-combinators', 'javascript/promises'],
}
