'use client'

import { motion } from 'motion/react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setExerciseStatusAction } from '@/actions/exercises'
import {
  DURATION_FAST,
  EASE_SOFT,
  usePrefersReducedMotion,
} from '@/components/motion/reduced-motion'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'

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
  const reducedMotion = usePrefersReducedMotion()

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
      className={cx(
        'rounded-card border bg-surface p-5 transition-colors',
        completed ? 'border-pass/50' : 'border-border',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{exercise.title}</h3>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-faint capitalize">
          {exercise.difficulty}
        </span>
      </header>

      <p className="mt-2 text-sm leading-relaxed">{exercise.prompt}</p>

      <h4 className="mt-4 text-xs font-medium tracking-wider text-faint uppercase">Requirements</h4>
      <ul className="mt-1.5 space-y-1 text-sm">
        {exercise.requirements.map((requirement) => (
          <li key={requirement} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-edge" />
            <span>{requirement}</span>
          </li>
        ))}
      </ul>

      <label className="mt-4 block">
        <span className="text-xs font-medium tracking-wider text-faint uppercase">Notes</span>
        <textarea
          value={notes}
          rows={3}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What was awkward? What would you do differently?"
          aria-label={`Notes for ${exercise.title}`}
          className="mt-1.5 w-full rounded-lg border border-border bg-bg p-2.5 text-sm transition-colors outline-none placeholder:text-faint/70 focus:border-accent"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        {completed ? (
          <>
            <motion.span
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: DURATION_FAST, ease: EASE_SOFT }}
              className="flex items-center gap-1.5 text-sm text-pass"
            >
              <CheckIcon className="size-4" />
              Completed
            </motion.span>
            <Button size="sm" disabled={pending} onClick={() => save('in_progress')}>
              Reopen
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              size="sm"
              disabled={pending}
              onClick={() => save('completed')}
            >
              {pending ? 'Saving...' : 'Mark complete'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => save('in_progress')}
            >
              Save notes
            </Button>
          </>
        )}
      </div>
    </article>
  )
}
