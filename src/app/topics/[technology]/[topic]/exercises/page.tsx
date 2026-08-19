import type { Route } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExerciseCard } from '@/components/exercise-card'
import { getTopic } from '@/content'
import { exerciseKey } from '@/content/schema'
import { getExerciseProgress } from '@/lib/exercises'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

export default async function ExercisesPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { technology, topic: directory } = await params

  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  const progress = await getExerciseProgress(session.user.id, topic.slug)

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link
        href={`/topics/${technology}/${directory}` as Route}
        className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        &larr; {topic.title}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Exercises</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Solve these in your editor, then record how it went. Nothing runs here.
      </p>

      <div className="mt-8 space-y-4">
        {topic.exercises.map((exercise) => {
          const row = progress.get(exerciseKey(topic.slug, exercise.id))
          return (
            <ExerciseCard
              key={exercise.id}
              technology={technology}
              directory={directory}
              exercise={exercise}
              completed={row?.status === 'completed'}
              savedNotes={row?.notes ?? ''}
            />
          )
        })}
      </div>
    </main>
  )
}
