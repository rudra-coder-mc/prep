'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { OutputLog, QUICK, Region, SETTLE, StepNote, Token, useVisualNamespace } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

/**
 * A queued thing. Giving it an id lets the same task move between lanes as one
 * object. The point of the visual is watching a timer callback leave the queue
 * and arrive on the stack, not watching one list shrink and another grow.
 */
export type EventLoopItem = string | { id?: string; label: string }

export type EventLoopStep = {
  note: string
  /** Frames from the bottom of the stack upward. */
  stack?: EventLoopItem[]
  microtasks?: EventLoopItem[]
  macrotasks?: EventLoopItem[]
  output?: string[]
  /** Which lane the loop is working on right now. */
  active?: 'stack' | 'microtasks' | 'macrotasks'
}

const LANES = [
  { key: 'stack', label: 'Call stack', direction: 'up' as const, enterFrom: 'below' as const },
  {
    key: 'microtasks',
    label: 'Microtasks',
    direction: 'down' as const,
    enterFrom: 'right' as const,
  },
  {
    key: 'macrotasks',
    label: 'Macrotasks',
    direction: 'down' as const,
    enterFrom: 'right' as const,
  },
] as const

/** The three things one turn of the loop does, in the order it does them. */
const PHASES = [
  { key: 'task', label: 'One macrotask' },
  { key: 'microtasks', label: 'Drain microtasks' },
  { key: 'render', label: 'Render' },
] as const

type Phase = (typeof PHASES)[number]['key']

function itemId(item: EventLoopItem): string {
  return typeof item === 'string' ? item : (item.id ?? item.label)
}

function itemLabel(item: EventLoopItem): string {
  return typeof item === 'string' ? item : item.label
}

/**
 * Two identical labels in one lane would share a layout id and fight over which
 * element is which, so a repeat gets its own suffix. Authors get to write the
 * same label twice without thinking about it.
 */
function identify(items: EventLoopItem[]): { id: string; label: string }[] {
  const seen = new Map<string, number>()

  return items.map((item) => {
    const base = itemId(item)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return { id: count === 0 ? base : `${base}#${count}`, label: itemLabel(item) }
  })
}

/**
 * Which part of the cycle the current step is in. Derived rather than authored,
 * because a step that says which lane it is working on has already said it.
 */
function phaseOf(step: EventLoopStep | undefined): Phase {
  if (step?.active === 'microtasks') return 'microtasks'
  return 'task'
}

function PhaseRail({
  phase,
  isPlaying,
  namespace,
}: {
  phase: Phase
  isPlaying: boolean
  namespace: string
}) {
  return (
    <div className="mb-3 flex items-center gap-1.5 overflow-hidden rounded-lg border border-border bg-bg/40 px-2 py-1.5">
      {PHASES.map((entry, i) => {
        const isActive = entry.key === phase
        return (
          <div key={entry.key} className="flex min-w-0 items-center gap-1.5" data-phase={entry.key}>
            {i > 0 ? (
              <motion.span
                aria-hidden
                animate={{ opacity: isActive ? 1 : 0.35 }}
                transition={QUICK}
                className="text-xs text-faint"
              >
                &rarr;
              </motion.span>
            ) : null}
            <span className="relative rounded px-1.5 py-0.5 text-[0.7rem] tracking-wide uppercase">
              {isActive ? (
                <motion.span
                  layoutId={`${namespace}-phase`}
                  transition={SETTLE}
                  className="absolute inset-0 rounded bg-accent-dim ring-1 ring-accent"
                />
              ) : null}
              <span className={cx('relative', isActive ? 'text-fg' : 'text-faint')}>
                {entry.label}
              </span>
            </span>
          </div>
        )
      })}

      <motion.span
        aria-hidden
        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
        transition={isPlaying ? { duration: 2.4, repeat: Infinity, ease: 'linear' } : QUICK}
        className="ml-auto text-xs text-accent"
      >
        &#8635;
      </motion.span>
    </div>
  )
}

export function EventLoop({
  title = 'Event loop',
  steps,
}: {
  title?: string
  steps: EventLoopStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const namespace = useVisualNamespace()
  const step = steps[player.index]

  return (
    <VisualFrame title={title} player={player}>
      <PhaseRail phase={phaseOf(step)} isPlaying={player.isPlaying} namespace={namespace} />

      <div className="grid gap-3 sm:grid-cols-3">
        {LANES.map((lane) => {
          const items = identify(step?.[lane.key] ?? [])
          const isActive = step?.active === lane.key

          return (
            <Region
              key={lane.key}
              label={lane.label}
              active={isActive}
              direction={lane.direction}
              // The lane the loop is working on has been emptied by it, which
              // is a different thing from a lane that was never used.
              empty={items.length === 0 ? (isActive ? 'drained' : 'empty') : undefined}
              attributes={{ 'data-lane': lane.key, 'data-active': isActive ? '' : undefined }}
            >
              {items.map((item, i) => (
                <Token
                  key={item.id}
                  layoutId={`${namespace}-${item.id}`}
                  label={item.label}
                  reducedMotion={reducedMotion}
                  enterFrom={lane.enterFrom}
                  tone={isActive && i === items.length - 1 ? 'accent' : 'plain'}
                  emphasis={isActive && lane.key === 'stack' && i === items.length - 1}
                  attributes={{ 'data-task': item.id }}
                />
              ))}
            </Region>
          )
        })}
      </div>

      <StepNote
        note={step?.note ?? ''}
        stepKey={player.index}
        direction={player.direction}
        reducedMotion={reducedMotion}
      />

      <AnimatePresence initial={false}>
        {step?.output && step.output.length > 0 ? (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SETTLE}
          >
            <OutputLog lines={step.output} reducedMotion={reducedMotion} className="mt-3" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </VisualFrame>
  )
}
