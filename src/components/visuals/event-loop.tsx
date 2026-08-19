'use client'

import { motion } from 'motion/react'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type EventLoopStep = {
  note: string
  /** Frames from the bottom of the stack upward. */
  stack?: string[]
  microtasks?: string[]
  macrotasks?: string[]
  output?: string[]
  /** Which lane the loop is working on right now. */
  active?: 'stack' | 'microtasks' | 'macrotasks'
}

const LANES = [
  { key: 'stack', label: 'Call stack' },
  { key: 'microtasks', label: 'Microtasks' },
  { key: 'macrotasks', label: 'Macrotasks' },
] as const

export function EventLoop({
  title = 'Event loop',
  steps,
}: {
  title?: string
  steps: EventLoopStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const step = steps[player.index]

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-3 sm:grid-cols-3">
        {LANES.map((lane) => {
          const items = step?.[lane.key] ?? []
          const isActive = step?.active === lane.key
          return (
            <div
              key={lane.key}
              data-lane={lane.key}
              data-active={isActive || undefined}
              className={`rounded-lg border p-2 ${
                isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'
              }`}
            >
              <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">
                {lane.label}
              </h4>
              <div
                className={`mt-2 flex min-h-24 gap-1 ${
                  lane.key === 'stack' ? 'flex-col-reverse justify-end' : 'flex-col'
                }`}
              >
                {items.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted)]">empty</p>
                ) : (
                  items.map((item, i) => (
                    <motion.div
                      key={`${item}-${i}`}
                      layout={!reducedMotion}
                      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 font-mono text-xs"
                    >
                      {item}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-sm leading-relaxed">{step?.note}</p>

      {step?.output && step.output.length > 0 ? (
        <div className="mt-3">
          <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Output</h4>
          <pre className="mt-1 rounded bg-[var(--color-bg)] p-2 font-mono text-xs">
            {step.output.join('\n')}
          </pre>
        </div>
      ) : null}
    </VisualFrame>
  )
}
