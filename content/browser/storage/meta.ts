import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'storage',
  title: 'Storage: `localStorage`, cookies and IndexedDB',
  summary:
    'Four places to put data, what each one costs, why everything in web storage is a string, and the question about where a token belongs that has no comfortable answer.',
  order: 40,
  tags: ['storage', 'cookies', 'indexeddb'],
  prerequisites: ['browser/the-dom', 'javascript/json', 'javascript/event-loop'],
}
