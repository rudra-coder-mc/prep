'use client'

import { VisualFrame } from './step-controls'
import { useStepPlayer } from './use-step-player'

export type PromiseState = 'pending' | 'fulfilled' | 'rejected'

export type PromiseTimelineStep = {
  note: string
  promises: { id: string; label: string; state: PromiseState; value?: string }[]
  output?: string[]
}

const STATE_STYLES: Record<PromiseState, string> = {
  pending: 'border-[var(--color-border)] text-[var(--color-muted)]',
  fulfilled: 'border-[var(--color-pass)] text-[var(--color-pass)]',
  rejected: 'border-[var(--color-fail)] text-[var(--color-fail)]',
}

export function PromiseTimeline({
  title = 'Promises',
  steps,
}: {
  title?: string
  steps: PromiseTimelineStep[]
}) {
  const player = useStepPlayer(steps.length)
  const step = steps[player.index]

  return (
    <VisualFrame title={title} player={player}>
      <ul className="space-y-1">
        {(step?.promises ?? []).map((promise) => (
          <li
            key={promise.id}
            data-promise={promise.id}
            data-state={promise.state}
            className={`flex items-center justify-between gap-3 rounded-lg border bg-[var(--color-bg)] px-2 py-1.5 font-mono text-xs ${STATE_STYLES[promise.state]}`}
          >
            <span className="text-[var(--color-fg)]">{promise.label}</span>
            <span>
              {promise.state}
              {promise.value !== undefined ? ` (${promise.value})` : ''}
            </span>
          </li>
        ))}
      </ul>

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
