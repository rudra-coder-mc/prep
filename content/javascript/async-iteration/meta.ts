import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'async-iteration',
  title: 'Async iteration and async generators',
  summary:
    'for await...of, Symbol.asyncIterator, async generators as producers, the pull model behind them, cleanup on early exit, and what stays sequential.',
  order: 280,
  difficulty: 'hard',
  tags: ['async', 'generators', 'iteration'],
  prerequisites: [
    'javascript/generators',
    'javascript/promises',
    'javascript/iterables-and-iterators',
  ],
}
