import { notFound } from 'next/navigation'
import { QuestionSession, type SessionQuestion } from '@/components/question-session'
import { Rise } from '@/components/motion/rise'
import { PageShell } from '@/components/ui/page'
import { getTopic } from '@/content'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

export const metadata = { title: 'Practice' }

export default async function PracticePage({ params }: { params: Promise<Params> }) {
  await requireSession()
  const { technology, topic: directory } = await params

  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  // Answers and explanations are fetched on reveal, never sent up front.
  const questions: SessionQuestion[] = topic.questions.map((question) => ({
    id: question.id,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    type: question.type,
    difficulty: question.difficulty,
    prompt: question.prompt,
    code: question.code,
    hints: question.hints,
    options: question.options,
    checksOutput: question.expectedOutput !== undefined,
  }))

  return (
    <PageShell width="narrow">
      <Rise>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
          <p className="mt-1 text-sm text-muted">
            {topic.title} · answer from memory, then grade yourself honestly.
          </p>
        </header>
      </Rise>

      <Rise delay={0.06} className="mt-8">
        <QuestionSession
          questions={questions}
          returnHref={`/topics/${technology}/${directory}`}
          returnLabel="Back to the lesson"
        />
      </Rise>
    </PageShell>
  )
}
