import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'what-a-bundler-changes',
  title: 'What a bundler changes',
  summary:
    'The code that runs is not the code you wrote: module wrapping, tree shaking, code splitting, values inlined at build time, and where dev and production diverge.',
  order: 350,
  difficulty: 'medium',
  tags: ['modules', 'tooling', 'runtime'],
  prerequisites: ['javascript/module-resolution-and-side-effects'],
}
