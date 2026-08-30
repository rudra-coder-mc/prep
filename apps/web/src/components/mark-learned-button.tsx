'use client'

import { motion } from 'motion/react'
import { useTransition } from 'react'
import { markLearnedAction } from '@/actions/topics'
import {
  DURATION_BASE,
  EASE_SOFT,
  usePrefersReducedMotion,
} from '@/components/motion/reduced-motion'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@/components/ui/icons'

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
  const reducedMotion = usePrefersReducedMotion()

  if (learnedAt) {
    return (
      <motion.p
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION_BASE, ease: EASE_SOFT }}
        className="flex items-center gap-2 rounded-lg border border-pass/40 bg-pass/10 px-3 py-2 text-sm text-pass"
      >
        <CheckIcon className="size-4" />
        Marked learned. Its questions are in your recall queue.
      </motion.p>
    )
  }

  return (
    <Button
      variant="primary"
      disabled={pending}
      onClick={() => startTransition(() => markLearnedAction(technology, directory))}
    >
      {pending ? 'Saving...' : 'Mark as learned'}
    </Button>
  )
}
