import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'fetch-and-the-network',
  title: '`fetch` and the network',
  summary:
    'Two promises rather than one, why a 500 is not an error, the body you can only read once, and the cross-origin rules that are enforced in the browser rather than on the server.',
  order: 30,
  tags: ['fetch', 'network', 'async'],
  prerequisites: [
    'browser/the-dom',
    'javascript/promises',
    'javascript/abortcontroller',
    'javascript/async-error-handling',
  ],
}
