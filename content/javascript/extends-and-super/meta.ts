import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'extends-and-super',
  title: '`extends`, `super` and the order of construction',
  summary:
    'The two chains extends links, why this does not exist until super() returns, how super finds a method, and what goes wrong extending Array and Error.',
  order: 150,
  difficulty: 'medium',
  tags: ['classes', 'inheritance', 'prototype'],
  prerequisites: ['javascript/class-syntax', 'javascript/prototypes'],
}
