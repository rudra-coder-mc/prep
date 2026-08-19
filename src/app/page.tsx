import type { Route } from 'next'
import Link from 'next/link'
import { SignOutButton } from '@/components/sign-out-button'
import { getDashboard } from '@/lib/dashboard'
import { requireSession } from '@/lib/session'
import { STATUS_LABELS, type TopicStatus } from '@/lib/topic-status'

const STATUS_ORDER: TopicStatus[] = ['mastered', 'understood', 'learning', 'weak', 'not_started']

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--color-border)] py-1.5 text-sm last:border-b-0">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      data-panel={title}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h2 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export default async function Dashboard() {
  const session = await requireSession()
  const dashboard = await getDashboard(session.user.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">JavaScript</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{session.user.email}</p>
        </div>
        <p className="text-right" data-streak={dashboard.streak.current}>
          <span className="text-3xl font-semibold tabular-nums">{dashboard.streak.current}</span>
          <span className="block text-xs text-[var(--color-muted)]">
            day streak
            {dashboard.streak.longest > dashboard.streak.current
              ? ` · best ${dashboard.streak.longest}`
              : ''}
          </span>
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Panel title="Topics">
          {STATUS_ORDER.map((status) => (
            <Stat key={status} label={STATUS_LABELS[status]} value={dashboard.byStatus[status]} />
          ))}
        </Panel>

        <Panel title="Questions">
          <Stat label="Attempted" value={dashboard.questions.attempted} />
          <Stat label="Passed" value={dashboard.questions.passed} />
          <Stat label="Weak" value={dashboard.questions.weak} />
          <Stat label="Failed" value={dashboard.questions.failed} />
        </Panel>

        <Panel title="Practical">
          <Stat label="Completed" value={dashboard.exercises.completed} />
          <Stat label="Remaining" value={dashboard.exercises.remaining} />
        </Panel>
      </div>

      <nav className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/review"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-bg)]"
        >
          Review weak topics
        </Link>
        <Link href="/topics" className="rounded-md border border-[var(--color-border)] px-4 py-2">
          Continue learning
        </Link>
      </nav>

      {dashboard.weakest.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
            Weakest topics
          </h2>
          <ol className="mt-3 space-y-1">
            {dashboard.weakest.map((topic) => (
              <li key={topic.slug}>
                <Link
                  href={`/topics/${topic.technology}/${topic.directory}` as Route}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-accent)]"
                >
                  <span>{topic.title}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {STATUS_LABELS[topic.status]} · {topic.progress}%
                    {topic.lastConfidence !== null ? ` · confidence ${topic.lastConfidence}/5` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-12">
        <SignOutButton />
      </div>
    </main>
  )
}
