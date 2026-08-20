'use client'

import { motion } from 'motion/react'
import { FLOW, OutputLog, SETTLE, StepNote } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type WalkthroughStep = {
  /** One-based line numbers to highlight for this step. */
  lines: number[]
  note: string
  /** Variable names and their values as they stand after this step. */
  variables?: Record<string, string>
  output?: string[]
}

export type CodeWalkthroughProps = {
  title?: string
  code: string
  steps: WalkthroughStep[]
}

/** Matches `leading-6`. The marker is positioned by arithmetic rather than by
 * measuring, so it can slide smoothly without waiting for a layout pass. */
const LINE_HEIGHT = 24
/** Matches the `p-3` on the code block. */
const CODE_PADDING = 12

/**
 * Runs of adjacent line numbers. A step that points at two places in the file,
 * the call and the line it lands on, gets a band over each, rather than one
 * band swallowing everything in between.
 */
function contiguousRuns(lines: number[]): { start: number; span: number }[] {
  const sorted = [...new Set(lines)].sort((a, b) => a - b)

  return sorted.reduce<{ start: number; span: number }[]>((runs, line) => {
    const last = runs.at(-1)
    if (last && line === last.start + last.span) {
      last.span += 1
      return runs
    }
    return [...runs, { start: line, span: 1 }]
  }, [])
}

/**
 * The generic explainer. A lesson describes what happens at each step and this
 * plays it back; it never runs the code, so what is shown is always what the
 * author meant to say.
 */
export function CodeWalkthrough({ title = 'Walkthrough', code, steps }: CodeWalkthroughProps) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const lines = code.replace(/\n$/, '').split('\n')
  const step = steps[player.index]
  const active = step?.lines ?? []
  const highlighted = new Set(active)

  const runs = contiguousRuns(active)

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <pre className="relative overflow-x-auto rounded-lg bg-bg p-3 text-sm leading-6">
          {runs.map((run, i) => (
            <motion.span
              // Keyed by position in the list, so the first band slides from
              // step to step instead of being replaced.
              key={i}
              aria-hidden
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{
                y: CODE_PADDING + (run.start - 1) * LINE_HEIGHT,
                height: run.span * LINE_HEIGHT,
                opacity: 1,
              }}
              transition={reducedMotion ? { duration: 0 } : FLOW}
              className="absolute inset-x-0 top-0 border-l-2 border-accent bg-accent-dim"
            />
          ))}

          <code className="relative block">
            {lines.map((line, i) => {
              const number = i + 1
              const isActive = highlighted.has(number)
              return (
                <span
                  key={number}
                  data-active={isActive || undefined}
                  className="flex h-6 items-center gap-3 px-2"
                >
                  <motion.span
                    animate={{ color: isActive ? 'var(--color-accent)' : 'var(--color-faint)' }}
                    transition={SETTLE}
                    className="w-5 shrink-0 text-right tabular-nums select-none"
                  >
                    {number}
                  </motion.span>
                  <motion.span
                    animate={{
                      color: isActive ? 'var(--color-fg)' : 'var(--color-muted)',
                      opacity: isActive ? 1 : 0.75,
                    }}
                    transition={SETTLE}
                    className="whitespace-pre"
                  >
                    {line || ' '}
                  </motion.span>
                </span>
              )
            })}
          </code>
        </pre>

        <div className="space-y-4 text-sm">
          <StepNote
            note={step?.note ?? ''}
            stepKey={player.index}
            direction={player.direction}
            reducedMotion={reducedMotion}
          />

          {step?.variables && Object.keys(step.variables).length > 0 ? (
            <div>
              <h4 className="text-xs tracking-wide text-muted uppercase">State</h4>
              <dl className="mt-1 space-y-0.5 font-mono text-xs">
                {Object.entries(step.variables).map(([name, value]) => (
                  <div key={name} className="flex gap-2">
                    <dt className="text-muted">{name}</dt>
                    {/* Keyed on the value so only a variable that actually
                        changed on this step lights up. */}
                    <motion.dd
                      key={`${name}:${value}`}
                      initial={reducedMotion ? false : { color: 'var(--color-accent)', x: 4 }}
                      animate={{ color: 'var(--color-fg)', x: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                      {value}
                    </motion.dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <OutputLog lines={step?.output ?? []} reducedMotion={reducedMotion} />
        </div>
      </div>
    </VisualFrame>
  )
}
