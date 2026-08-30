import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'this-binding',
  title: '`this`, call, apply and bind',
  summary: 'What decides the value of `this`, and why pulling a method off its object breaks it.',
  order: 130,
  tags: ['this', 'functions', 'objects'],
  prerequisites: ['javascript/closures'],
}
