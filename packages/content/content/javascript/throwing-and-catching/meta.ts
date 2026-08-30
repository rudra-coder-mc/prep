import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'throwing-and-catching',
  title: 'Throwing, catching and finally',
  summary:
    'What throw does to the stack, the exact order try, catch and finally run in, and the return value finally quietly replaces.',
  order: 300,
  tags: ['error', 'control-flow'],
  prerequisites: ['javascript/recursion-and-the-call-stack', 'javascript/scope-and-hoisting'],
}
