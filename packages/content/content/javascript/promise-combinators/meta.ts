import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'promise-combinators',
  title: 'Promise combinators in practice',
  summary:
    'Fan-out, fallbacks, timeouts and retries built from all, allSettled, race and any, and what happens to the promises left behind.',
  order: 360,
  tags: ['promise', 'async'],
  prerequisites: ['javascript/promises'],
}
