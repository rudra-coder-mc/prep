import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'map-and-set',
  title: 'Map, Set and their weak counterparts',
  summary:
    'Keyed collections that take any key, keep insertion order and count their own size, when they beat an object or an array, and what makes WeakMap different.',
  order: 210,
  difficulty: 'medium',
  tags: ['collections', 'map', 'set', 'weakmap'],
  prerequisites: ['javascript/iterables-and-iterators', 'javascript/value-and-reference'],
}
