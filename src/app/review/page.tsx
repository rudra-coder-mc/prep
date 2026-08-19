import Link from 'next/link'
import { QuestionSession } from '@/components/question-session'
import { getDailyQueue } from '@/lib/review'
import { requireSession } from '@/lib/session'

export default async function ReviewPage() {
  const session = await requireSession()
  const queue = await getDailyQueue(session.user.id)

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        &larr; Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Today&rsquo;s review</h1>

      {queue.questions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-medium">Nothing due</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Your queue is empty. Mark another topic as learned to put more questions into rotation.
          </p>
          <Link
            href="/topics"
            className="mt-4 inline-block rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm"
          >
            Browse topics
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {queue.dueToday > queue.questions.length
              ? `${queue.dueToday} due, showing the first ${queue.questions.length}.`
              : `${queue.questions.length} to go.`}
          </p>
          <div className="mt-8">
            <QuestionSession questions={queue.questions} />
          </div>
        </>
      )}
    </main>
  )
}
