import type { TopicMeta } from '@/content/schema'

export const meta: TopicMeta = {
  slug: 'debounce-and-throttle',
  title: 'Debounce and throttle',
  summary:
    'Two ways to cut the rate of a callback, which one a search box wants and which one a scroll handler wants, and everything a real implementation has to keep: this, the arguments, cancel and the trailing call.',
  order: 310,
  difficulty: 'medium',
  tags: ['functions', 'timers', 'closures', 'performance'],
  prerequisites: ['javascript/closures', 'javascript/event-loop', 'javascript/this-binding'],
}
