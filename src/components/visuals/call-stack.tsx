'use client'

import { motion } from 'motion/react'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type CallStackStep = {
  /** Frames from the bottom of the stack upward. */
  frames: string[]
  note: string
  output?: string[]
}

export function CallStack({
  title = 'Call stack',
  steps,
}: {
  title?: string
  steps: CallStackStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const step = steps[player.index]
  const frames = step?.frames ?? []

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Stack</h4>
          <div className="mt-2 flex min-h-40 flex-col-reverse justify-start gap-1 rounded-lg bg-[var(--color-bg)] p-2">
            {frames.length === 0 ? (
              <p className="self-center py-6 text-xs text-[var(--color-muted)]">empty</p>
            ) : (
              frames.map((frame, depth) => (
                <motion.div
                  key={`${frame}-${depth}`}
                  layout={!reducedMotion}
                  initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  data-frame={frame}
                  className={`rounded border px-2 py-1 font-mono text-xs ${
                    depth === frames.length - 1
                      ? 'border-[var(--color-accent)] text-[var(--color-fg)]'
                      : 'border-[var(--color-border)] text-[var(--color-muted)]'
                  }`}
                >
                  {frame}
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p className="leading-relaxed">{step?.note}</p>
          {step?.output && step.output.length > 0 ? (
            <div>
              <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Output</h4>
              <pre className="mt-1 rounded bg-[var(--color-bg)] p-2 font-mono text-xs">
                {step.output.join('\n')}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </VisualFrame>
  )
}
