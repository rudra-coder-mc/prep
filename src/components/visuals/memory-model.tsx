'use client'

import { motion } from 'motion/react'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type MemoryStep = {
  note: string
  /** Named bindings. A binding either holds a value or points at a heap object. */
  stack: { name: string; value?: string; ref?: string }[]
  heap?: { id: string; label: string; fields?: Record<string, string> }[]
  /** Heap ids to draw attention to, typically what just changed. */
  highlight?: string[]
}

export function MemoryModel({ title = 'Memory', steps }: { title?: string; steps: MemoryStep[] }) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const step = steps[player.index]
  const highlighted = new Set(step?.highlight ?? [])

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border)] p-2">
          <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Stack</h4>
          <ul className="mt-2 space-y-1">
            {(step?.stack ?? []).map((binding) => (
              <li
                key={binding.name}
                data-binding={binding.name}
                className="flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 font-mono text-xs"
              >
                <span className="text-[var(--color-muted)]">{binding.name}</span>
                <span aria-hidden>=</span>
                {binding.ref ? (
                  <span className="text-[var(--color-accent)]">&rarr; {binding.ref}</span>
                ) : (
                  <span>{binding.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] p-2">
          <h4 className="text-xs tracking-wide text-[var(--color-muted)] uppercase">Heap</h4>
          <ul className="mt-2 space-y-1">
            {(step?.heap ?? []).length === 0 ? (
              <li className="text-xs text-[var(--color-muted)]">empty</li>
            ) : (
              (step?.heap ?? []).map((object) => (
                <motion.li
                  key={object.id}
                  layout={!reducedMotion}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  data-heap={object.id}
                  data-highlighted={highlighted.has(object.id) || undefined}
                  className={`rounded border bg-[var(--color-bg)] px-2 py-1 font-mono text-xs ${
                    highlighted.has(object.id)
                      ? 'border-[var(--color-accent)]'
                      : 'border-[var(--color-border)]'
                  }`}
                >
                  <span className="text-[var(--color-muted)]">{object.id}</span> {object.label}
                  {object.fields ? (
                    <span className="block pl-3 text-[var(--color-muted)]">
                      {Object.entries(object.fields)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </span>
                  ) : null}
                </motion.li>
              ))
            )}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed">{step?.note}</p>
    </VisualFrame>
  )
}
