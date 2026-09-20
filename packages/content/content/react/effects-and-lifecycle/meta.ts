import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'effects-and-lifecycle',
  title: 'Effects and Synchronization',
  summary:
    'How useEffect synchronizes React components with external systems, why effects should not be used to calculate derived state, how dependency arrays work, and why cleanup functions are mandatory.',
  order: 30,
  tags: ['react', 'useeffect', 'lifecycle', 'effects'],
  prerequisites: ['react/state-and-rendering'],
}
