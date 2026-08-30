import type { Route } from 'next'
import { AppLink } from '@/components/chrome/app-link'
import { Rise } from '@/components/motion/rise'
import { TierPicker } from '@/components/tier-picker'
import { SectionLabel } from '@/components/ui/card'
import { ChevronRightIcon } from '@/components/ui/icons'
import { PageHeader, PageShell } from '@/components/ui/page'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatusBadge } from '@/components/ui/status-badge'
import { getAllTopics, type Topic } from '@/content'
import { TIER_LABELS, technologyLabel, DEFAULT_TIER } from '@prep/core'
import { getDashboard } from '@/lib/dashboard'
import { requireSession } from '@/lib/session'
import { getTrackTiers } from '@/lib/track-tier'

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
  const [topics, dashboard, tiers] = await Promise.all([
    getAllTopics(),
    getDashboard(session.user.id),
    getTrackTiers(session.user.id),
  ])

  // The dashboard decides what the tier covers, so membership of the path is
  // read from it rather than worked out a second time here.
  const overviews = new Map(dashboard.topics.map((overview) => [overview.slug, overview]))
  const onPath = dashboard.topics.length
  const started = onPath - dashboard.byStatus.not_started
  const tracks = groupByTechnology(topics)

  return (
    <PageShell width="reading">
      <Rise>
        <PageHeader
          eyebrow="Interview prep"
          title="Topics"
          description={`${onPath} topics on your path, ${started} started. Read one, mark it learned, and its questions join your daily recall.`}
        />
      </Rise>

      {tracks.map((track) => {
        const tier = tiers.get(track.id) ?? DEFAULT_TIER
        const onTrack = track.topics.filter((topic) => overviews.has(topic.slug))
        const above = track.topics.filter((topic) => !overviews.has(topic.slug))

        return (
          <section key={track.id} data-track={track.id} className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold tracking-tight">{track.label}</h2>
                <SectionLabel>
                  {onTrack.length} {onTrack.length === 1 ? 'topic' : 'topics'} at{' '}
                  {TIER_LABELS[tier]}
                </SectionLabel>
              </div>
              <TierPicker technology={track.id} label={track.label} tier={tier} />
            </div>

            <ul className="mt-3 space-y-2.5">
              {onTrack.map((topic, index) => {
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
                          {overview?.questions ?? 0} questions · {topic.exercises.length} exercises
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

            {/* A topic asked only above the pick is off the path, not gone: a
                lesson costs nothing to read at any level, and hiding it outright
                would make part of the track unreachable. */}
            {above.length > 0 ? (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs text-faint hover:text-muted">
                  {above.length} {above.length === 1 ? 'topic is' : 'topics are'} asked above{' '}
                  {TIER_LABELS[tier]}
                </summary>
                <ul className="mt-2 space-y-1">
                  {above.map((topic) => (
                    <li key={topic.slug}>
                      <AppLink
                        href={`/topics/${topic.technology}/${topic.directory}` as Route}
                        className="text-muted underline-offset-4 hover:text-fg hover:underline"
                      >
                        {topic.title}
                      </AppLink>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        )
      })}
    </PageShell>
  )
}
