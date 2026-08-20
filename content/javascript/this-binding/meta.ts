import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'this-binding',
  title: '`this`, call, apply and bind',
  summary: 'What decides the value of `this`, and why pulling a method off its object breaks it.',
  order: 80,
  difficulty: 'medium',
  tags: ['this', 'functions', 'objects'],
  prerequisites: ['javascript/closures'],
}
