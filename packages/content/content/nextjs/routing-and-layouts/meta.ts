import type { TopicMeta } from '@prep/core'

export const meta: TopicMeta = {
  slug: 'routing-and-layouts',
  title: 'The App Router: Layouts, Pages, and Navigation',
  summary:
    'File-system routing in Next.js, why layouts preserve state across transitions while templates re-mount, and how the root layout replaces the HTML document shell.',
  order: 10,
  tags: ['nextjs', 'routing', 'layouts', 'app-router'],
  prerequisites: ['react/components-and-jsx', 'browser/fetch-and-the-network'],
}
