import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'array-methods',
  title: 'Array methods worth knowing cold',
  summary:
    'Which methods mutate and which copy, what each one returns, how sort really compares, and the holes and async callbacks that trip people up.',
  order: 80,
  tags: ['arrays', 'collections', 'iteration'],
  prerequisites: ['javascript/value-and-reference'],
}
