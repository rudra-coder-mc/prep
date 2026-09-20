import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'state-and-rendering',
  title: 'State, Batching, and the Render Loop',
  summary:
    'How useState schedules re-renders, why state is a snapshot within a single render pass, how automatic batching works, and when to use updater functions.',
  order: 20,
  tags: ['react', 'state', 'rendering', 'usestate'],
  prerequisites: ['react/components-and-jsx'],
}
