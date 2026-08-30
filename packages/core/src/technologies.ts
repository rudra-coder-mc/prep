/**
 * How a content directory is spelled in the interface. A technology is only a
 * directory name, so this is the one place that knows `nextjs` is written
 * "Next.js". Anything unlisted is title cased, which means adding a track stays
 * a content change even before anyone names it here.
 */
const LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  react: 'React',
  nextjs: 'Next.js',
  node: 'Node',
  express: 'Express',
  fastify: 'Fastify',
  nestjs: 'NestJS',
  mongodb: 'MongoDB',
  postgresql: 'PostgreSQL',
  sql: 'SQL',
}

export function technologyLabel(id: string): string {
  return (
    LABELS[id] ??
    id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}
