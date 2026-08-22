import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'recursion-and-the-call-stack',
  title: 'Recursion and the call stack',
  summary:
    'What a call costs, what a function calling itself costs, and what runs out when it does not stop.',
  order: 220,
  difficulty: 'medium',
  tags: ['functions', 'recursion', 'call-stack'],
  prerequisites: ['javascript/parameters-and-arguments', 'javascript/closures'],
}
