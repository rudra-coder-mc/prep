import { notFound } from 'next/navigation'
import { getTopic } from '@/content'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  await requireSession()
  const { technology, topic: directory } = await params

  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
        {topic.technology}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{topic.title}</h1>
      <p className="mt-3 text-[var(--color-muted)]">{topic.summary}</p>

      <section className="mt-10">
        <h2 className="text-sm tracking-wide text-[var(--color-muted)] uppercase">Questions</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {topic.questions.map((question) => (
            <li key={question.id} className="text-[var(--color-muted)]">
              <span className="text-[var(--color-fg)]">{question.type}</span> ·{' '}
              {question.difficulty}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
