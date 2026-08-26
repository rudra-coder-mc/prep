import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'error-types',
  title: 'Error objects and the built-in types',
  summary:
    'What an Error actually holds, which of the seven built-in types the engine throws and when, what cause is for, and why instanceof is not always the right check.',
  order: 250,
  difficulty: 'medium',
  tags: ['error'],
  prerequisites: ['javascript/throwing-and-catching', 'javascript/prototypes'],
}
