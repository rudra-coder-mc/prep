import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'refs-and-the-dom',
  title: 'Refs and the DOM',
  summary:
    'Persisting values without re-rendering using useRef, accessing native DOM nodes, safe imperative operations like focus and measurement, and the rules of ref purity.',
  order: 40,
  tags: ['react', 'useref', 'dom', 'escape-hatches'],
  prerequisites: ['react/components-and-jsx', 'react/state-and-rendering', 'browser/the-dom'],
}
