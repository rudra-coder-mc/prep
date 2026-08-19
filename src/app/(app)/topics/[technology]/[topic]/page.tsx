import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/chrome/app-link'
import { MarkLearnedButton } from '@/components/mark-learned-button'
import { Rise } from '@/components/motion/rise'
import { buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { PageShell } from '@/components/ui/page'
import { StatusBadge } from '@/components/ui/status-badge'
import { getTopic } from '@/content'
import { getTopicProgress } from '@/lib/progress'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

/** Lessons live beside their topic in content/, so they are loaded by path. */
async function loadLesson(technology: string, directory: string) {
  const mdx = await import(`../../../../../../content/${technology}/${directory}/lesson.mdx`)
  return mdx.default as () => React.ReactElement
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { technology, topic: directory } = await params
  const topic = await getTopic(technology, directory)
  return { title: topic?.title ?? 'Topic' }
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
    <PageShell width="reading">
      <Rise>
        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
            <span className="rounded-full border border-border px-2 py-0.5 capitalize">
              {topic.difficulty}
            </span>
            <span>{topic.questions.length} questions</span>
            <span aria-hidden>·</span>
            <span>{topic.exercises.length} exercises</span>
            {progress?.learnedAt ? <StatusBadge status="learning" /> : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{topic.title}</h1>
          <p className="mt-2 text-lg text-muted text-pretty">{topic.summary}</p>
        </header>
      </Rise>

      <Rise delay={0.06}>
        <article className="mt-10 text-[0.975rem] leading-7">
          <Lesson />
        </article>
      </Rise>

      <Rise delay={0.1}>
        <Card className="mt-16 border-accent/25 bg-gradient-to-br from-accent-dim to-transparent">
          <SectionLabel>Next</SectionLabel>
          <h2 className="mt-2 text-lg font-medium">Ready to be tested on this?</h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            Marking it learned puts its {topic.questions.length} questions into your recall queue,
            starting today.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <MarkLearnedButton
              technology={technology}
              directory={directory}
              learnedAt={progress?.learnedAt ?? null}
            />
            <AppLink
              href={`/topics/${technology}/${directory}/practice` as Route}
              className={buttonClass({ variant: 'secondary' })}
            >
              Practise now
            </AppLink>
            <AppLink
              href={`/topics/${technology}/${directory}/exercises` as Route}
              className={buttonClass({ variant: 'ghost' })}
            >
              Exercises
            </AppLink>
          </div>
        </Card>
      </Rise>
    </PageShell>
  )
}
