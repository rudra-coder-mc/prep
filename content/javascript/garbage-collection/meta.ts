import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'garbage-collection',
  title: 'Garbage collection and the shapes of a leak',
  summary:
    'What keeps an object alive, why a cycle is not a problem, the four leaks that actually happen in real code, and how to tell a leak from a cache.',
  order: 280,
  tags: ['memory', 'performance', 'gc'],
  prerequisites: ['javascript/value-and-reference', 'javascript/closures'],
}
