import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'promise-combinators',
  title: 'Promise combinators in practice',
  summary:
    'Fan-out, fallbacks, timeouts and retries built from all, allSettled, race and any, and what happens to the promises left behind.',
  order: 330,
  tags: ['promise', 'async'],
  prerequisites: ['javascript/promises'],
}
