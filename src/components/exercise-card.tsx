'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setExerciseStatusAction } from '@/app/topics/exercise-actions'

export type ExerciseCardProps = {
  technology: string
  directory: string
  exercise: {
    id: string
    title: string
    difficulty: string
    prompt: string
    requirements: string[]
  }
  completed: boolean
  savedNotes: string
}

export function ExerciseCard({
  technology,
  directory,
  exercise,
  completed,
  savedNotes,
}: ExerciseCardProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(savedNotes)
  const [pending, startTransition] = useTransition()

  function save(status: 'in_progress' | 'completed') {
    startTransition(async () => {
      await setExerciseStatusAction({
        technology,
        directory,
        exerciseId: exercise.id,
        status,
        notes,
      })
      router.refresh()
    })
  }

  return (
    <article
      data-exercise={exercise.id}
      data-completed={completed || undefined}
      className={`rounded-xl border p-5 ${
        completed ? 'border-[var(--color-pass)]' : 'border-[var(--color-border)]'
      } bg-[var(--color-surface)]`}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{exercise.title}</h3>
        <span className="text-xs text-[var(--color-muted)]">{exercise.difficulty}</span>
      </header>

      <p className="mt-2 text-sm leading-relaxed">{exercise.prompt}</p>

      <h4 className="mt-4 text-xs tracking-wide text-[var(--color-muted)] uppercase">
        Requirements
      </h4>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
        {exercise.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>

      <label className="mt-4 block">
        <span className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Notes</span>
        <textarea
          value={notes}
          rows={3}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What was awkward? What would you do differently?"
          aria-label={`Notes for ${exercise.title}`}
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
      </label>

      <div className="mt-3 flex items-center gap-3">
        {completed ? (
          <>
            <span className="text-sm text-[var(--color-pass)]">Completed</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => save('in_progress')}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Reopen
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => save('completed')}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-50"
          >
            {pending ? 'Saving...' : 'Mark complete'}
          </button>
        )}
        {completed ? null : (
          <button
            type="button"
            disabled={pending}
            onClick={() => save('in_progress')}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-50"
          >
            Save notes
          </button>
        )}
      </div>
    </article>
  )
}
