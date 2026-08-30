import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'es-modules-and-commonjs',
  title: 'ES modules and CommonJS',
  summary:
    'Two module systems in one ecosystem: live bindings against copied values, static structure against runtime require, cycles, dynamic import and top level await.',
  order: 400,
  tags: ['modules', 'runtime'],
  prerequisites: ['javascript/strict-mode-and-globalthis', 'javascript/promises'],
}
