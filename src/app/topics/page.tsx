import type { Route } from 'next'
import Link from 'next/link'
import { getTechnology } from '@/content'
import { requireSession } from '@/lib/session'

export default async function TopicsPage() {
  await requireSession()
  const { topics } = await getTechnology('javascript')

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">JavaScript</h1>
      <ul className="mt-8 space-y-2">
        {topics.map((topic) => (
          <li key={topic.slug}>
            <Link
              href={`/topics/${topic.technology}/${topic.directory}` as Route}
              className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-accent)]"
            >
              <span className="font-medium">{topic.title}</span>
              <span className="mt-1 block text-sm text-[var(--color-muted)]">{topic.summary}</span>
              <span className="mt-2 block text-xs text-[var(--color-muted)]">
                {topic.questions.length} questions · {topic.exercises.length} exercises ·{' '}
                {topic.difficulty}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
