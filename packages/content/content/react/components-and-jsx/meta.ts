import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'components-and-jsx',
  title: 'Components, JSX, and Purity',
  summary:
    'How JSX compiles to function calls, why components must be pure functions of props, how props differ from state, and why rendering returns an element tree rather than DOM nodes directly.',
  order: 10,
  tags: ['react', 'jsx', 'components', 'rendering'],
  prerequisites: ['javascript/closures', 'javascript/destructuring', 'browser/the-dom'],
}
