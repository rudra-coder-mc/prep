import type { Route } from 'next'
import { AppLink } from '@/components/chrome/app-link'
import { Rise } from '@/components/motion/rise'
import { SectionLabel } from '@/components/ui/card'
import { ChevronRightIcon } from '@/components/ui/icons'
import { PageHeader, PageShell } from '@/components/ui/page'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatusBadge } from '@/components/ui/status-badge'
import { getAllTopics, type Topic } from '@/content'
import { technologyLabel } from '@/content/technologies'
import { getDashboard } from '@/lib/dashboard'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Topics' }

/** Preserves the loader's ordering inside each technology. */
function groupByTechnology(topics: Topic[]) {
  const grouped = new Map<string, Topic[]>()

  for (const topic of topics) {
    const group = grouped.get(topic.technology) ?? []
    group.push(topic)
    grouped.set(topic.technology, group)
  }

  return [...grouped.entries()]
    .map(([id, group]) => ({ id, label: technologyLabel(id), topics: group }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export default async function TopicsPage() {
  const session = await requireSession()
  const [topics, dashboard] = await Promise.all([getAllTopics(), getDashboard(session.user.id)])

  const overviews = new Map(dashboard.topics.map((overview) => [overview.slug, overview]))
  const started = topics.length - dashboard.byStatus.not_started
  const tracks = groupByTechnology(topics)

  return (
    <PageShell width="reading">
      <Rise>
        <PageHeader
          eyebrow="Interview prep"
          title="Topics"
          description={`${topics.length} topics, ${started} started. Read one, mark it learned, and it joins your daily recall.`}
        />
      </Rise>

      {tracks.map((track) => (
        <section key={track.id} className="mt-10">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{track.label}</h2>
            <SectionLabel>{track.topics.length} topics</SectionLabel>
          </div>

          <ul className="mt-3 space-y-2.5">
            {track.topics.map((topic, index) => {
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
                          <h3 className="font-medium">{topic.title}</h3>
                          <p className="mt-1 text-sm text-muted">{topic.summary}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {overview ? <StatusBadge status={overview.status} /> : null}
                          <ChevronRightIcon className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-faint">
                        {topic.questions.length} questions · {topic.exercises.length} exercises
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
        </section>
      ))}
    </PageShell>
  )
}
