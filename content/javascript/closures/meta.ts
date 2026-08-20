import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'closures',
  title: 'Closures',
  summary:
    'A function remembering the scope it was created in, long after that scope has returned.',
  order: 40,
  difficulty: 'medium',
  tags: ['closure', 'scope', 'functions'],
  prerequisites: ['javascript/scope-and-hoisting'],
}
