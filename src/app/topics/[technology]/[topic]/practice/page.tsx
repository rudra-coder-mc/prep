import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QuestionSession, type SessionQuestion } from '@/components/question-session'
import { getTopic } from '@/content'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

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
  }))

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={`/topics/${technology}/${directory}` as Parameters<typeof Link>[0]['href']}
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        &larr; {topic.title}
      </Link>
      <h1 className="mt-4 mb-8 text-2xl font-semibold tracking-tight">Practice</h1>

      <QuestionSession questions={questions} />
    </main>
  )
}
