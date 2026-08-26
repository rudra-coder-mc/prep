import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'weak-references',
  title: 'Weak references: WeakMap, WeakSet and WeakRef',
  summary:
    'Holding an object without keeping it alive, why the weak collections refuse to be iterated, what a strong value still retains, and why WeakRef is a last resort.',
  order: 260,
  difficulty: 'hard',
  tags: ['memory', 'collections', 'weakmap'],
  prerequisites: ['javascript/garbage-collection', 'javascript/map-and-set'],
}
