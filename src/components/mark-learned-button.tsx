'use client'

import { useTransition } from 'react'
import { markLearnedAction } from '@/app/topics/actions'

export function MarkLearnedButton({
  technology,
  directory,
  learnedAt,
}: {
  technology: string
  directory: string
  learnedAt: Date | null
}) {
  const [pending, startTransition] = useTransition()

  if (learnedAt) {
    return (
      <p className="text-sm text-[var(--color-pass)]">
        Marked learned. Its questions are in your recall queue.
      </p>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => markLearnedAction(technology, directory))}
      className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-bg)] disabled:opacity-60"
    >
      {pending ? 'Saving...' : 'Mark as learned'}
    </button>
  )
}
