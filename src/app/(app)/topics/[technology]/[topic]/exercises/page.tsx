import { notFound } from 'next/navigation'
import { ExerciseCard } from '@/components/exercise-card'
import { Rise } from '@/components/motion/rise'
import { PageShell } from '@/components/ui/page'
import { getTopic } from '@/content'
import { exerciseKey } from '@/content/schema'
import { getExerciseProgress } from '@/lib/exercises'
import { requireSession } from '@/lib/session'

type Params = { technology: string; topic: string }

export const metadata = { title: 'Exercises' }

export default async function ExercisesPage({ params }: { params: Promise<Params> }) {
  const session = await requireSession()
  const { technology, topic: directory } = await params

  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  const progress = await getExerciseProgress(session.user.id, topic.slug)

  return (
    <PageShell width="narrow">
      <Rise>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
          <p className="mt-1 text-sm text-muted">
            Solve these in your editor, then record how it went. Nothing runs here.
          </p>
        </header>
      </Rise>

      <div className="mt-8 space-y-3">
        {topic.exercises.map((exercise, index) => {
          const row = progress.get(exerciseKey(topic.slug, exercise.id))
          return (
            <Rise key={exercise.id} delay={0.06 + index * 0.04}>
              <ExerciseCard
                technology={technology}
                directory={directory}
                exercise={exercise}
                completed={row?.status === 'completed'}
                savedNotes={row?.notes ?? ''}
              />
            </Rise>
          )
        })}
      </div>
    </PageShell>
  )
}
