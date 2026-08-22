import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'array-methods',
  title: 'Array methods worth knowing cold',
  summary:
    'Which methods mutate and which copy, what each one returns, how sort really compares, and the holes and async callbacks that trip people up.',
  order: 90,
  difficulty: 'medium',
  tags: ['arrays', 'collections', 'iteration'],
  prerequisites: ['javascript/higher-order-functions', 'javascript/value-and-reference'],
}
