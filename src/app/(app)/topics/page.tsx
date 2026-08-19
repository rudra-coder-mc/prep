import type { Route } from 'next'
import { AppLink } from '@/components/chrome/app-link'
import { Rise } from '@/components/motion/rise'
import { ChevronRightIcon } from '@/components/ui/icons'
import { PageHeader, PageShell } from '@/components/ui/page'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatusBadge } from '@/components/ui/status-badge'
import { getTechnology } from '@/content'
import { getDashboard } from '@/lib/dashboard'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Topics' }

export default async function TopicsPage() {
  const session = await requireSession()
  const [{ topics }, dashboard] = await Promise.all([
    getTechnology('javascript'),
    getDashboard(session.user.id),
  ])

  const overviews = new Map(dashboard.topics.map((overview) => [overview.slug, overview]))
  const started = topics.length - dashboard.byStatus.not_started

  return (
    <PageShell width="reading">
      <Rise>
        <PageHeader
          eyebrow="Track"
          title="JavaScript"
          description={`${topics.length} topics, ${started} started. Read one, mark it learned, and it joins your daily recall.`}
        />
      </Rise>

      <ul className="mt-8 space-y-2.5">
        {topics.map((topic, index) => {
          const overview = overviews.get(topic.slug)

          return (
            <li key={topic.slug}>
              <Rise delay={Math.min(index, 8) * 0.035}>
                <AppLink
                  href={`/topics/${topic.technology}/${topic.directory}` as Route}
                  className="group block rounded-card border border-border bg-surface p-4 transition-colors hover:border-edge hover:bg-raised"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-medium">{topic.title}</h2>
                      <p className="mt-1 text-sm text-muted">{topic.summary}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {overview ? <StatusBadge status={overview.status} /> : null}
                      <ChevronRightIcon className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-faint">
                    {topic.questions.length} questions · {topic.exercises.length} exercises ·{' '}
                    {topic.difficulty}
                  </p>

                  {overview && overview.progress > 0 ? (
                    <ProgressBar
                      value={overview.progress}
                      className="mt-2"
                      label={`${topic.title} progress`}
                    />
                  ) : null}
                </AppLink>
              </Rise>
            </li>
          )
        })}
      </ul>
    </PageShell>
  )
}
