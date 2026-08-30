'use client'

import { motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { LinkLayer, QUICK, Region, SETTLE, StepNote, useMeasuredLinks } from './flow'
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
  const bindings = step?.stack ?? []
  const objects = step?.heap ?? []

  // A binding does not contain an object, it points at one, so the arrow is the
  // whole idea of the visual rather than decoration on top of it.
  const links = bindings
    .filter((binding) => binding.ref !== undefined)
    .map((binding) => ({
      id: `${binding.name}->${binding.ref}`,
      from: `binding:${binding.name}`,
      to: `object:${binding.ref}`,
      accent: highlighted.has(binding.ref ?? ''),
    }))

  const { containerRef, register, drawn } = useMeasuredLinks(links, player.index)

  return (
    <VisualFrame title={title} player={player}>
      {/* Two columns at every width: the arrow from a binding to the object it
          points at is the point, and stacking them puts the boxes in the way of
          their own links. */}
      <div ref={containerRef} className="relative grid grid-cols-2 gap-4 sm:gap-8">
        <LinkLayer links={drawn} reducedMotion={reducedMotion} />

        <Region label="Stack" empty={bindings.length === 0 ? 'nothing declared' : undefined}>
          {bindings.map((binding) => (
            <motion.div
              key={binding.name}
              ref={register(`binding:${binding.name}`)}
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
              ref={register(`object:${object.id}`)}
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
