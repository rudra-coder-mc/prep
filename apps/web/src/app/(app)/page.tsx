import type { Route } from 'next'
import { AppLink } from '@/components/chrome/app-link'
import { DeviceSyncList } from '@/components/device-sync-list'
import { Rise } from '@/components/motion/rise'
import { buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { ChevronRightIcon } from '@/components/ui/icons'
import { PageHeader, PageShell } from '@/components/ui/page'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StatusBadge } from '@/components/ui/status-badge'
import { StepUp } from '@/components/step-up'
import { TIER_LABELS, STATUS_LABELS, type TopicStatus } from '@prep/core'
import { getDashboard } from '@/lib/dashboard'
import { getDevices } from '@/lib/devices'
import { requireSession } from '@/lib/session'

const STATUS_ORDER: TopicStatus[] = ['mastered', 'understood', 'learning', 'weak', 'not_started']

const STATUS_DOTS: Record<TopicStatus, string> = {
  mastered: 'bg-pass',
  understood: 'bg-pass/60',
  learning: 'bg-accent',
  weak: 'bg-weak',
  not_started: 'bg-faint/50',
}

function Stat({ label, value, dot }: { label: string; value: number | string; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted">
        {dot ? <span className={`size-1.5 rounded-full ${dot}`} /> : null}
        <span>{label}</span>
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card data-panel={title} className="p-4">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-2 divide-y divide-border/60">{children}</div>
    </Card>
  )
}

export default async function Dashboard() {
  const session = await requireSession()
  const [dashboard, devices] = await Promise.all([
    getDashboard(session.user.id),
    getDevices(session.user.id),
  ])

  const total = dashboard.topics.length
  const started = total - dashboard.byStatus.not_started
  const answered = dashboard.questions.attempted
  const passRate = answered === 0 ? 0 : (dashboard.questions.passed / answered) * 100

  return (
    <PageShell>
      <Rise>
        <PageHeader
          eyebrow="Interview prep"
          title="Dashboard"
          description={`${started} of ${total} topics started. Keep the queue clear and the streak takes care of itself.`}
          actions={
            <p className="text-left sm:text-right" data-streak={dashboard.streak.current}>
              <span className="block text-4xl leading-none font-semibold tabular-nums">
                {dashboard.streak.current}
              </span>
              <span className="mt-1 block text-xs text-muted">
                day streak
                {dashboard.streak.longest > dashboard.streak.current
                  ? ` · best ${dashboard.streak.longest}`
                  : ''}
              </span>
            </p>
          }
        />
      </Rise>

      <Rise delay={0.05}>
        <Card className="mt-8 flex flex-wrap items-center justify-between gap-5 border-accent/25 bg-gradient-to-br from-accent-dim to-transparent">
          <div>
            <SectionLabel>Today</SectionLabel>
            <p className="mt-2 text-xl font-medium">
              {dashboard.weakest.length > 0
                ? 'Some topics are slipping. Ten minutes fixes that.'
                : 'Answer what is due and today counts.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppLink href="/review" className={buttonClass({ variant: 'primary' })}>
              Start review
            </AppLink>
            <AppLink href="/topics" className={buttonClass({ variant: 'secondary' })}>
              Browse topics
            </AppLink>
          </div>
        </Card>
      </Rise>

      <Rise delay={0.08}>
        <section className="mt-8">
          <SectionLabel>Readiness</SectionLabel>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {dashboard.tracks.map((track) => {
              const { tier, retained, total, percent, stepUpTo, stepUpAdds } = track.readiness

              return (
                <li
                  key={track.id}
                  className="rounded-card border border-border bg-surface p-4"
                  data-track={track.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <AppLink href="/topics" className="font-medium hover:text-accent">
                      {track.label}
                    </AppLink>
                    <span className="text-xs text-faint">Preparing for {TIER_LABELS[tier]}</span>
                  </div>
                  <ProgressBar
                    value={percent}
                    tone="pass"
                    className="mt-2.5"
                    label={`${track.label} readiness for ${TIER_LABELS[tier]}`}
                  />
                  {/* The count carries the share, because a tier this bank is
                      thin at would otherwise read as a confident percentage of
                      almost nothing. */}
                  <p className="mt-1.5 text-xs text-faint tabular-nums">
                    {percent}% ready · {retained} of {total} questions retained · {track.started} of{' '}
                    {track.total} topics started
                  </p>
                  {stepUpTo ? (
                    <StepUp
                      technology={track.id}
                      label={track.label}
                      from={tier}
                      to={stepUpTo}
                      adds={stepUpAdds}
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      </Rise>

      <Rise delay={0.1}>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Panel title="Topics">
            {STATUS_ORDER.map((status) => (
              <Stat
                key={status}
                dot={STATUS_DOTS[status]}
                label={STATUS_LABELS[status]}
                value={dashboard.byStatus[status]}
              />
            ))}
          </Panel>

          <Panel title="Questions">
            <Stat label="Attempted" value={dashboard.questions.attempted} />
            <Stat label="Passed" value={dashboard.questions.passed} />
            <Stat label="Weak" value={dashboard.questions.weak} />
            <Stat label="Failed" value={dashboard.questions.failed} />
            <div className="pt-3">
              <ProgressBar value={passRate} tone="pass" label="Share of attempts passed" />
              <p className="mt-1.5 text-xs text-faint">{Math.round(passRate)}% passed</p>
            </div>
          </Panel>

          <Panel title="Practical">
            <Stat label="Completed" value={dashboard.exercises.completed} />
            <Stat label="Remaining" value={dashboard.exercises.remaining} />
          </Panel>
        </div>
      </Rise>

      {dashboard.weakest.length > 0 ? (
        <Rise delay={0.15}>
          <section className="mt-10">
            <SectionLabel>Weakest topics</SectionLabel>
            <ol className="mt-3 space-y-2">
              {dashboard.weakest.map((topic) => (
                <li key={topic.slug}>
                  <AppLink
                    href={`/topics/${topic.technology}/${topic.directory}` as Route}
                    className="group flex items-center gap-4 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-edge hover:bg-raised"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{topic.title}</span>
                        <StatusBadge status={topic.status} />
                      </span>
                      <ProgressBar
                        value={topic.progress}
                        tone="weak"
                        className="mt-2"
                        label={`${topic.title} progress`}
                      />
                    </span>
                    <span className="text-xs text-faint tabular-nums">{topic.progress}%</span>
                    <ChevronRightIcon className="size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                  </AppLink>
                </li>
              ))}
            </ol>
          </section>
        </Rise>
      ) : null}

      {devices.length > 0 ? (
        <Rise delay={0.2}>
          <DeviceSyncList devices={devices} />
        </Rise>
      ) : null}
    </PageShell>
  )
}
