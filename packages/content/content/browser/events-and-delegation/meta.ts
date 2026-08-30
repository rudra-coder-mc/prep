import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'events-and-delegation',
  title: 'Events, propagation and delegation',
  summary:
    'The path an event takes through the tree, why one listener on a container beats a thousand on rows, and the difference between stopping propagation and preventing the default.',
  order: 20,
  tags: ['events', 'dom', 'delegation'],
  prerequisites: ['browser/the-dom', 'javascript/event-loop', 'javascript/this-binding'],
}
