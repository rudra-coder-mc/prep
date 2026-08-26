import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'module-resolution-and-side-effects',
  title: 'Module resolution and side effects',
  summary:
    'How a specifier becomes a file, why a module evaluates exactly once, and what importing for a side effect really promises.',
  order: 310,
  difficulty: 'medium',
  tags: ['modules', 'runtime', 'tooling'],
  prerequisites: ['javascript/es-modules-and-commonjs'],
}
