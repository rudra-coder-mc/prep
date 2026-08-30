import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'closures',
  title: 'Closures',
  summary:
    'A function remembering the scope it was created in, long after that scope has returned.',
  order: 90,
  tags: ['closure', 'scope', 'functions'],
  prerequisites: ['javascript/scope-and-hoisting'],
}
