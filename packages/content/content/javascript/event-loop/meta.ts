import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'event-loop',
  title: 'Event loop and microtasks',
  summary:
    'Why a promise callback always beats a zero-millisecond timer, and what "non-blocking" actually means.',
  order: 330,
  tags: ['event-loop', 'async', 'promise'],
  prerequisites: ['javascript/closures'],
}
