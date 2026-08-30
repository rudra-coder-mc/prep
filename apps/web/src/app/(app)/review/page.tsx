import { AppLink } from '@/components/chrome/app-link'
import { QuestionSession } from '@/components/question-session'
import { Rise } from '@/components/motion/rise'
import { buttonClass } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageShell } from '@/components/ui/page'
import { getDailyQueue } from '@/lib/review'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Review' }

export default async function ReviewPage() {
  const session = await requireSession()
  const queue = await getDailyQueue(session.user.id)

  return (
    <PageShell width="narrow">
      <Rise>
        <header>
          <p className="text-xs font-medium tracking-wider text-faint uppercase">Active recall</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">Today&rsquo;s review</h1>
          {queue.questions.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {queue.dueToday > queue.questions.length
                ? `${queue.dueToday} due, showing the first ${queue.questions.length}.`
                : `${queue.questions.length} to go.`}
            </p>
          ) : null}
        </header>
      </Rise>

      {queue.questions.length === 0 ? (
        <Rise delay={0.06}>
          <Card className="mt-8">
            <p className="text-lg font-medium">Nothing due</p>
            <p className="mt-1 text-sm text-muted">
              Your queue is empty. Mark another topic as learned to put more questions into
              rotation.
            </p>
            <AppLink
              href="/topics"
              className={buttonClass({ variant: 'secondary', size: 'sm', className: 'mt-5' })}
            >
              Browse topics
            </AppLink>
          </Card>
        </Rise>
      ) : (
        <Rise delay={0.06} className="mt-8">
          <QuestionSession questions={queue.questions} returnHref="/" returnLabel="Dashboard" />
        </Rise>
      )}
    </PageShell>
  )
}
