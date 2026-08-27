import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'strict-mode-and-globalthis',
  title: 'Strict mode and globalThis',
  summary:
    'What strict mode changes, where the mode comes from now that nobody types the directive, and what is really on the global object.',
  order: 120,
  tags: ['runtime', 'scope', 'this'],
  prerequisites: ['javascript/scope-and-hoisting', 'javascript/this-binding'],
}
