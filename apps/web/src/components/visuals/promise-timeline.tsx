'use client'

import { motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { OutputLog, SETTLE, StepNote } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type PromiseTimelineStep = {
  note: string
  promises: { id: string; label: string; state: PromiseState; value?: string }[]
  output?: string[]
}

const STATE_STYLES: Record<PromiseState, string> = {
  pending: 'border-border text-muted',
  fulfilled: 'border-pass text-pass',
  rejected: 'border-fail text-fail',
}

const STATE_FILL: Record<PromiseState, string> = {
  pending: 'var(--color-border)',
  fulfilled: 'var(--color-pass)',
  rejected: 'var(--color-fail)',
}

/**
 * A promise is a value that has not arrived, so the row shows the waiting as
 * well as the result: pending sweeps, settling fills the row in its final
 * colour, and a rejection lands hard enough to notice.
 */
function StateBar({ state, reducedMotion }: { state: PromiseState; reducedMotion: boolean }) {
  if (reducedMotion) return null

  return (
    <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-lg">
      {state === 'pending' ? (
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="h-full w-1/2 bg-edge"
        />
      ) : (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={SETTLE}
          style={{ transformOrigin: 'left', backgroundColor: STATE_FILL[state] }}
          className="h-full w-full"
        />
      )}
    </div>
  )
}

export function PromiseTimeline({
  title = 'Promises',
  steps,
}: {
  title?: string
  steps: PromiseTimelineStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const step = steps[player.index]

  return (
    <VisualFrame title={title} player={player}>
      <ul className="space-y-1.5">
        {(step?.promises ?? []).map((promise) => (
          <motion.li
            key={promise.id}
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={
              promise.state === 'rejected' && !reducedMotion
                ? { opacity: 1, y: 0, x: [0, -4, 4, 0] }
                : { opacity: 1, y: 0 }
            }
            transition={SETTLE}
            data-promise={promise.id}
            data-state={promise.state}
            className={cx(
              'relative flex items-center justify-between gap-3 overflow-hidden rounded-lg border bg-bg px-2 py-1.5 font-mono text-xs',
              STATE_STYLES[promise.state],
            )}
          >
            <span className="text-fg">{promise.label}</span>
            <motion.span
              // Remounts when the state changes, so settling reads as an event
              // rather than as a word quietly being replaced.
              key={`${promise.state}-${promise.value ?? ''}`}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SETTLE}
            >
              {promise.state}
              {promise.value !== undefined ? ` (${promise.value})` : ''}
            </motion.span>

            <StateBar state={promise.state} reducedMotion={reducedMotion} />
          </motion.li>
        ))}
      </ul>

      <StepNote
        note={step?.note ?? ''}
        stepKey={player.index}
        direction={player.direction}
        reducedMotion={reducedMotion}
      />

      <OutputLog lines={step?.output ?? []} reducedMotion={reducedMotion} className="mt-3" />
    </VisualFrame>
  )
}
