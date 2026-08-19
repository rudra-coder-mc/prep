import { AppLink } from '@/components/chrome/app-link'
import { Rise } from '@/components/motion/rise'
import { buttonClass } from '@/components/ui/button'
import { Card, SectionLabel } from '@/components/ui/card'
import { PageHeader, PageShell } from '@/components/ui/page'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Learning' }

const PLANNED = [
  'Topics ordered as a path, so there is a sensible next thing rather than a queue.',
  'Reading without the clock: no recall schedule, no streak, nothing due.',
  'Longer worked examples than an interview answer would ever need.',
]

export default async function LearningPage() {
  await requireSession()

  return (
    <PageShell width="reading">
      <Rise>
        <PageHeader
          eyebrow="Coming soon"
          title="Learning"
          description="Prep is built for interview preparation first. Learning is the other half: working through a technology to understand it, rather than drilling it before an interview."
        />
      </Rise>

      <Rise delay={0.06}>
        <Card className="mt-8">
          <SectionLabel>What it will be</SectionLabel>
          <ul className="mt-3 space-y-2.5 text-sm text-muted">
            {PLANNED.map((item) => (
              <li key={item} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-faint/60" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-border pt-4 text-sm text-faint">
            Nothing here is built yet. Interview preparation gets the work until it is finished.
          </p>
        </Card>
      </Rise>

      <Rise delay={0.1}>
        <div className="mt-6 flex flex-wrap gap-2">
          <AppLink href="/" className={buttonClass({ variant: 'primary' })}>
            Back to interview prep
          </AppLink>
          <AppLink href="/topics" className={buttonClass({ variant: 'secondary' })}>
            Browse topics
          </AppLink>
        </div>
      </Rise>
    </PageShell>
  )
}
