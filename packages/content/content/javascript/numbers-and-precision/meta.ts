import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'numbers-and-precision',
  title: 'Numbers and precision',
  summary: 'One number type, why `0.1 + 0.2` misses, and what to reach for when money is involved.',
  order: 20,
  tags: ['numbers', 'precision', 'bigint', 'money'],
  prerequisites: ['javascript/types-and-coercion'],
}
