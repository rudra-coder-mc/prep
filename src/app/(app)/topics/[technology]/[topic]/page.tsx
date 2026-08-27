import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/chrome/app-link'
import { MarkLearnedButton } from '@/components/mark-learned-button'
import { Rise } from '@/components/motion/rise'
import { buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { PageShell } from '@/components/ui/page'
import { FollowingReader } from '@/components/speech/following-reader'
import type { SpokenSection } from '@/components/speech/narration-audio'
import { NarratedLesson } from '@/components/speech/narrated-lesson'
import { NarrationProvider } from '@/components/speech/narration-player'
import { TopicReader } from '@/components/speech/topic-reader'
import { StatusBadge } from '@/components/ui/status-badge'
import { getTopic } from '@/content'
import type { Narration } from '@/content/schema'
import { getTopicProgress } from '@/lib/progress'
import { scriptKey } from '@/lib/speech'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

/**
 * Addresses each section's audio here, on the server, and sends the address
 * rather than the words. The endpoint resolves a key back to its script, so the
 * player needs nothing else to ask for a recording or to have one made.
 */
function spokenSections(narration: Narration | null): SpokenSection[] {
  return (narration ?? []).map(({ script, ...section }) => ({
    ...section,
    key: scriptKey(script),
  }))
}

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
            <span>{topic.questions.length} questions</span>
            <span aria-hidden>·</span>
            <span>{topic.exercises.length} exercises</span>
            {progress?.learnedAt ? <StatusBadge status="learning" /> : null}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{topic.title}</h1>
          <p className="mt-2 text-lg text-muted text-pretty">{topic.summary}</p>
        </header>
      </Rise>

      {/* The player, the lesson and the bar that follows the reader down it are
          one thing: the same playback drives all three. */}
      <NarrationProvider sections={spokenSections(topic.narration)} title={topic.title}>
        {topic.narration ? (
          <Rise delay={0.04}>
            <div className="mt-8">
              <TopicReader />
            </div>
          </Rise>
        ) : null}

        <Rise delay={0.06}>
          <NarratedLesson>
            <Lesson />
          </NarratedLesson>
        </Rise>

        <FollowingReader />
      </NarrationProvider>

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
