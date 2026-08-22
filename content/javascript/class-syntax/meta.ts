import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'class-syntax',
  title: 'Classes: what the syntax makes',
  summary:
    'What a class declaration creates, where fields and methods land, the order the constructor runs in, and the ways a class is not just sugar.',
  order: 140,
  difficulty: 'medium',
  tags: ['classes', 'objects', 'prototype'],
  prerequisites: ['javascript/prototypes', 'javascript/this-binding'],
}
