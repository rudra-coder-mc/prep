import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'event-loop',
  title: 'Event loop and microtasks',
  summary:
    'Why a promise callback always beats a zero-millisecond timer, and what "non-blocking" actually means.',
  order: 20,
  difficulty: 'hard',
  tags: ['event-loop', 'async', 'promise'],
  prerequisites: ['javascript/closures'],
}
