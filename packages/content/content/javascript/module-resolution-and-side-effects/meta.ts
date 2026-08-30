import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'module-resolution-and-side-effects',
  title: 'Module resolution and side effects',
  summary:
    'How a specifier becomes a file, why a module evaluates exactly once, and what importing for a side effect really promises.',
  order: 410,
  tags: ['modules', 'runtime', 'tooling'],
  prerequisites: ['javascript/es-modules-and-commonjs'],
}
