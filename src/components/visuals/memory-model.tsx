'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cx } from '@/lib/cx'
import { QUICK, Region, SETTLE, StepNote } from './flow'
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

type Connector = { id: string; d: string; highlighted: boolean }

/** Long enough to follow the layout animation the boxes are doing underneath. */
const TRACK_MS = 700

/**
 * Draws the arrow from a binding to the object it points at, and keeps drawing
 * it while the boxes are still moving. The arrow is the entire idea of the
 * visual - a binding does not contain an object, it points at one - so it has
 * to survive the animation rather than snap into place after it.
 */
function useConnectors(
  bindings: MemoryStep['stack'],
  highlight: Set<string>,
  stepKey: number,
): {
  containerRef: React.RefObject<HTMLDivElement | null>
  registerBinding: (name: string) => (node: HTMLElement | null) => void
  registerObject: (id: string) => (node: HTMLElement | null) => void
  connectors: Connector[]
} {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const bindingNodes = useRef(new Map<string, HTMLElement | null>())
  const objectNodes = useRef(new Map<string, HTMLElement | null>())
  const [connectors, setConnectors] = useState<Connector[]>([])

  const registerBinding = useCallback(
    (name: string) => (node: HTMLElement | null) => {
      bindingNodes.current.set(name, node)
    },
    [],
  )

  const registerObject = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      objectNodes.current.set(id, node)
    },
    [],
  )

  const pointing = bindings.filter((binding) => binding.ref !== undefined)
  // Serialised so the effect re-runs when the shape changes rather than on
  // every render, which would restart the tracking loop forever.
  const shape = pointing.map((binding) => `${binding.name}->${binding.ref}`).join(',')
  const highlighted = [...highlight].sort().join(',')

  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined') return

    let frame = 0
    const startedAt = Date.now()

    const measure = () => {
      const container = containerRef.current
      if (!container) return

      const base = container.getBoundingClientRect()
      const next: Connector[] = []

      for (const entry of shape ? shape.split(',') : []) {
        const [name, id] = entry.split('->')
        const from = name ? bindingNodes.current.get(name) : null
        const to = id ? objectNodes.current.get(id) : null
        if (!from || !to || !id) continue

        const a = from.getBoundingClientRect()
        const b = to.getBoundingClientRect()
        const x1 = a.right - base.left
        const y1 = a.top + a.height / 2 - base.top
        const x2 = b.left - base.left
        const y2 = b.top + b.height / 2 - base.top
        const bend = Math.max((x2 - x1) / 2, 12)

        next.push({
          id: entry,
          d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
          highlighted: highlighted.split(',').includes(id),
        })
      }

      setConnectors((current) =>
        current.length === next.length &&
        current.every((c, i) => c.d === next[i]?.d && c.highlighted === next[i]?.highlighted)
          ? current
          : next,
      )

      if (Date.now() - startedAt < TRACK_MS) frame = requestAnimationFrame(measure)
    }

    frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [shape, highlighted, stepKey])

  return { containerRef, registerBinding, registerObject, connectors }
}

export function MemoryModel({ title = 'Memory', steps }: { title?: string; steps: MemoryStep[] }) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const step = steps[player.index]
  const highlighted = new Set(step?.highlight ?? [])
  const bindings = step?.stack ?? []
  const objects = step?.heap ?? []

  const { containerRef, registerBinding, registerObject, connectors } = useConnectors(
    bindings,
    highlighted,
    player.index,
  )

  return (
    <VisualFrame title={title} player={player}>
      <div ref={containerRef} className="relative grid gap-8 sm:grid-cols-2">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          fill="none"
        >
          <AnimatePresence>
            {connectors.map((connector) => (
              <motion.path
                key={connector.id}
                d={connector.d}
                initial={reducedMotion ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={SETTLE}
                stroke={connector.highlighted ? 'var(--color-accent)' : 'var(--color-edge)'}
                strokeWidth={1.5}
                strokeDasharray={connector.highlighted ? undefined : '3 3'}
              />
            ))}
          </AnimatePresence>
        </svg>

        <Region label="Stack" empty={bindings.length === 0 ? 'nothing declared' : undefined}>
          {bindings.map((binding) => (
            <motion.div
              key={binding.name}
              ref={registerBinding(binding.name)}
              layout={!reducedMotion}
              initial={reducedMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={SETTLE}
              data-binding={binding.name}
              className="flex items-center gap-2 rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs"
            >
              <span className="text-muted">{binding.name}</span>
              <span aria-hidden>=</span>
              {binding.ref ? (
                <motion.span
                  key={binding.ref}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={QUICK}
                  className="text-accent"
                >
                  &rarr; {binding.ref}
                </motion.span>
              ) : (
                <motion.span key={binding.value} animate={{ opacity: 1 }} transition={QUICK}>
                  {binding.value}
                </motion.span>
              )}
            </motion.div>
          ))}
        </Region>

        <Region label="Heap" empty={objects.length === 0 ? 'empty' : undefined}>
          {objects.map((object) => (
            <motion.div
              key={object.id}
              ref={registerObject(object.id)}
              layout={!reducedMotion}
              initial={reducedMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                borderColor: highlighted.has(object.id)
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={SETTLE}
              data-heap={object.id}
              data-highlighted={highlighted.has(object.id) || undefined}
              className={cx('rounded-md border bg-bg px-2 py-1 font-mono text-xs')}
            >
              <span className="text-muted">{object.id}</span> {object.label}
              {object.fields ? (
                <span className="mt-0.5 flex flex-wrap gap-2 pl-3 text-muted">
                  {Object.entries(object.fields).map(([key, value]) => (
                    // Keyed on the value too, so a changed field remounts and
                    // flashes: mutation is the thing being taught here.
                    <motion.span
                      key={`${key}:${value}`}
                      initial={reducedMotion ? false : { color: 'var(--color-accent)' }}
                      animate={{ color: 'var(--color-muted)' }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                    >
                      {key}: {value}
                    </motion.span>
                  ))}
                </span>
              ) : null}
            </motion.div>
          ))}
        </Region>
      </div>

      <StepNote
        note={step?.note ?? ''}
        stepKey={player.index}
        direction={player.direction}
        reducedMotion={reducedMotion}
      />
    </VisualFrame>
  )
}
