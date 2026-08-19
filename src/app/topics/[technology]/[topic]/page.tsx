import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTopic } from '@/content'
import { MarkLearnedButton } from '@/components/mark-learned-button'
import { getTopicProgress } from '@/lib/progress'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

/** Lessons live beside their topic in content/, so they are loaded by path. */
async function loadLesson(technology: string, directory: string) {
  const mdx = await import(`../../../../../content/${technology}/${directory}/lesson.mdx`)
  return mdx.default as () => React.ReactElement
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { technology, topic: directory } = await params

  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  const [Lesson, progress] = await Promise.all([
    loadLesson(technology, directory),
    getTopicProgress(session.user.id, topic.slug),
  ])

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/topics"
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        &larr; JavaScript
      </Link>

      <header className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">{topic.title}</h1>
        <p className="mt-2 text-[var(--color-muted)]">{topic.summary}</p>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          {topic.difficulty} · {topic.questions.length} questions · {topic.exercises.length}{' '}
          exercises
        </p>
      </header>

      <article className="mt-8">
        <Lesson />
      </article>

      <section className="mt-14 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="font-medium">Ready to be tested on this?</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Marking it learned puts its {topic.questions.length} questions into your recall queue,
          starting today.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <MarkLearnedButton
            technology={technology}
            directory={directory}
            learnedAt={progress?.learnedAt ?? null}
          />
          <Link
            href={
              `/topics/${technology}/${directory}/practice` as Parameters<typeof Link>[0]['href']
            }
            className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]"
          >
            Practise now
          </Link>
        </div>
      </section>
    </main>
  )
}
