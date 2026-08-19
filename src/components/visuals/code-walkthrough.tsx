'use client'

import { motion } from 'motion/react'
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
  const highlighted = new Set(step?.lines ?? [])

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <pre className="overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-sm leading-6">
          <code>
            {lines.map((line, i) => {
              const number = i + 1
              const isActive = highlighted.has(number)
              return (
                <span
                  key={number}
                  data-active={isActive || undefined}
                  className={`flex gap-3 rounded px-2 ${
                    isActive ? 'bg-[var(--color-accent)]/15 text-[var(--color-fg)]' : ''
                  }`}
                >
                  <span className="w-5 shrink-0 text-right text-[var(--color-muted)] tabular-nums select-none">
                    {number}
                  </span>
                  <span className={isActive ? '' : 'text-[var(--color-muted)]'}>{line || ' '}</span>
                </span>
              )
            })}
          </code>
        </pre>

        <div className="space-y-4 text-sm">
          <motion.p
            key={player.index}
            initial={reducedMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="leading-relaxed"
          >
            {step?.note}
          </motion.p>

          {step?.variables && Object.keys(step.variables).length > 0 ? (
            <div>
              <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">State</h4>
              <dl className="mt-1 space-y-0.5 font-mono text-xs">
                {Object.entries(step.variables).map(([name, value]) => (
                  <div key={name} className="flex gap-2">
                    <dt className="text-[var(--color-muted)]">{name}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

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
