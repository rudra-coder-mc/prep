'use client'

import { AnimatePresence, motion, type Transition } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { EASE_SOFT } from '@/components/motion/reduced-motion'
import { cx } from '@/lib/cx'

/**
 * The shared vocabulary of movement. Every visual in the library is some
 * arrangement of labelled tokens that appear, move between regions and leave,
 * so they all animate from the same three transitions and read as one system.
 */
export const FLOW: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.7 }
export const SETTLE: Transition = { duration: 0.28, ease: EASE_SOFT }
export const QUICK: Transition = { duration: 0.16, ease: EASE_SOFT }

/**
 * A token travels between regions by keeping one `layoutId` across them, and
 * `layoutId` matches globally, so two visuals on the same page would swap
 * items if they happened to label them the same. Every visual namespaces its
 * ids with this.
 */
export function useVisualNamespace(): string {
  return useId()
}

/** How long a search rests on each link it checks before moving to the next. */
const PROBE_MS = 420

/**
 * Walks a search one position at a time, so the animation performs the rule,
 * scope lookups going outward and prototype lookups going down the chain,
 * rather than illustrating its conclusion. Callers still render the answer from their step
 * data, so a reader who skips ahead is never shown a search that is mid-flight
 * as if it were the result.
 */
export function useSearchProbe(
  from: number,
  to: number,
  stepKey: number,
  enabled: boolean,
): number {
  // Holds the step it belongs to, so a new step falls back to the start of the
  // walk by derivation rather than by an effect correcting stale state.
  const [probe, setProbe] = useState({ step: -1, at: to })

  useEffect(() => {
    if (!enabled || from === to) return

    const towards = to >= from ? 1 : -1
    let current = from

    const timer = setInterval(() => {
      current += towards
      setProbe({ step: stepKey, at: current })
      if (current === to) clearInterval(timer)
    }, PROBE_MS)

    return () => clearInterval(timer)
  }, [from, to, stepKey, enabled])

  if (!enabled) return to
  return probe.step === stepKey ? probe.at : from
}

/** A line to draw between two registered elements. */
export type Link = { id: string; from: string; to: string; accent?: boolean }
export type DrawnLink = { id: string; d: string; accent: boolean }

/** Long enough to follow the layout animation the boxes are doing underneath. */
const TRACK_MS = 700

/**
 * How a link is drawn once the layout has stacked and the target is no longer
 * to the right of its source. `vertical` drops straight from one box to the one
 * under it; `gutter` runs down the left margin and turns in, which is what a
 * map with one source and several targets needs so the lines do not cut across
 * everything between them.
 */
export type StackedRoute = 'vertical' | 'gutter'

/**
 * Draws a curve between two elements and keeps drawing it while either of them
 * is still moving. Positions come from the DOM rather than from a layout the
 * component computes, so a link survives wrapping, resizing and whatever the
 * surrounding animation is doing to its endpoints.
 */
export function useMeasuredLinks(
  links: Link[],
  stepKey: number,
  stackedRoute: StackedRoute = 'vertical',
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const nodes = useRef(new Map<string, HTMLElement | null>())
  const [drawn, setDrawn] = useState<DrawnLink[]>([])

  const register = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      nodes.current.set(id, node)
    },
    [],
  )

  // Serialised so the effect re-runs when the links change rather than on every
  // render, which would restart the tracking loop forever.
  const signature = links
    .map((link) => `${link.id}|${link.from}|${link.to}|${link.accent}`)
    .join(',')

  useEffect(() => {
    if (typeof requestAnimationFrame === 'undefined') return

    let frame = 0
    const startedAt = Date.now()

    const measure = () => {
      const container = containerRef.current
      if (!container) return

      const base = container.getBoundingClientRect()
      const next: DrawnLink[] = []

      for (const entry of signature ? signature.split(',') : []) {
        const [id, from, to, accent] = entry.split('|')
        const start = from ? nodes.current.get(from) : null
        const end = to ? nodes.current.get(to) : null
        if (!id || !start || !end) continue

        const a = start.getBoundingClientRect()
        const b = end.getBoundingClientRect()

        next.push({
          id,
          d: linkPath(a, b, base, stackedRoute),
          accent: accent === 'true',
        })
      }

      setDrawn((current) =>
        current.length === next.length &&
        current.every((link, i) => link.d === next[i]?.d && link.accent === next[i]?.accent)
          ? current
          : next,
      )

      if (Date.now() - startedAt < TRACK_MS) frame = requestAnimationFrame(measure)
    }

    frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  }, [signature, stepKey, stackedRoute])

  return { containerRef, register, drawn }
}

/**
 * The curve from one box to another, in the coordinates of their container.
 * Which edges it leaves and enters is decided by where the boxes actually ended
 * up, so the same links read correctly whether the layout is side by side or
 * stacked on a narrow screen.
 */
export function linkPath(
  a: DOMRect,
  b: DOMRect,
  base: DOMRect,
  stackedRoute: StackedRoute,
): string {
  const sideBySide = b.left >= a.right - 4

  if (sideBySide) {
    const x1 = a.right - base.left
    const y1 = a.top + a.height / 2 - base.top
    const x2 = b.left - base.left
    const y2 = b.top + b.height / 2 - base.top
    const bend = Math.max((x2 - x1) / 2, 12)
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
  }

  const fromY = a.bottom - base.top

  if (stackedRoute === 'vertical') {
    const fromX = a.left + a.width / 2 - base.left
    const toX = b.left + b.width / 2 - base.left
    const toY = b.top - base.top
    const bend = Math.max((toY - fromY) / 2, 10)
    return `M ${fromX} ${fromY} C ${fromX} ${fromY + bend}, ${toX} ${toY - bend}, ${toX} ${toY}`
  }

  const toX = b.left - base.left
  const toY = b.top + b.height / 2 - base.top
  // Leave from the source's left, drop into the margin beside the targets, run
  // down it, and turn in. Every link shares the vertical, so five of them read
  // as one spine rather than five lines crossing the same boxes.
  const gutter = Math.max(toX - 14, 4)
  const exit = a.left - base.left + Math.min(16, a.width / 2)
  const spineTop = fromY + 26
  const turnIn = Math.max(toY - 12, spineTop)

  return [
    `M ${exit} ${fromY}`,
    `C ${exit} ${fromY + 12}, ${gutter} ${fromY + 12}, ${gutter} ${spineTop}`,
    `L ${gutter} ${turnIn}`,
    `Q ${gutter} ${toY}, ${toX} ${toY}`,
  ].join(' ')
}

/** The svg layer the drawn links live in, sized to its positioned parent. */
export function LinkLayer({
  links,
  reducedMotion,
}: {
  links: DrawnLink[]
  reducedMotion: boolean
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      fill="none"
    >
      <AnimatePresence>
        {links.map((link) => (
          <motion.path
            key={link.id}
            d={link.d}
            initial={reducedMotion ? { opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SETTLE}
            stroke={link.accent ? 'var(--color-accent)' : 'var(--color-edge)'}
            strokeWidth={1.5}
            strokeDasharray={link.accent ? undefined : '3 3'}
          />
        ))}
      </AnimatePresence>
    </svg>
  )
}

export type TokenTone = 'plain' | 'accent' | 'pass' | 'fail' | 'weak' | 'dim'

const TONE_CLASSES: Record<TokenTone, string> = {
  plain: 'border-border bg-bg text-fg',
  accent: 'border-accent bg-accent-dim text-fg',
  pass: 'border-pass/60 bg-pass/10 text-pass',
  fail: 'border-fail/60 bg-fail/10 text-fail',
  weak: 'border-weak/60 bg-weak/10 text-weak',
  dim: 'border-border/60 bg-bg/40 text-faint',
}

const ENTRY_OFFSET = {
  left: { x: -18, y: 0 },
  right: { x: 18, y: 0 },
  below: { x: 0, y: 16 },
  above: { x: 0, y: -16 },
} as const

export type TokenProps = {
  /** Shared across regions so the same item flies rather than being replaced. */
  layoutId?: string
  label: string
  detail?: string
  tone?: TokenTone
  reducedMotion: boolean
  /** Which way it comes in from, which is what makes a queue read as a queue. */
  enterFrom?: keyof typeof ENTRY_OFFSET
  /** Set while this token is the thing the step is about. */
  emphasis?: boolean
  className?: string
  attributes?: Record<string, string | undefined>
}

export function Token({
  layoutId,
  label,
  detail,
  tone = 'plain',
  reducedMotion,
  enterFrom = 'below',
  emphasis = false,
  className,
  attributes,
}: TokenProps) {
  const offset = ENTRY_OFFSET[enterFrom]

  return (
    <motion.div
      layoutId={reducedMotion ? undefined : layoutId}
      layout={!reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9, ...offset }}
      animate={{
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        // A pulse rather than a static border, so the eye is taken to whatever
        // the current step is actually about.
        boxShadow: emphasis
          ? '0 0 0 1px var(--color-accent), 0 0 18px -4px var(--color-accent)'
          : '0 0 0 0px transparent',
      }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, ...offset }}
      transition={reducedMotion ? QUICK : FLOW}
      {...attributes}
      className={cx(
        'flex items-center justify-between gap-2 rounded-md border px-2 py-1 font-mono text-xs',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {detail ? <span className="shrink-0 text-[0.9em] text-muted">{detail}</span> : null}
    </motion.div>
  )
}

/**
 * A named region tokens live in. Regions light up when the step is working on
 * them, which is the other half of what makes movement legible: something moved
 * *and* somewhere is now in charge.
 */
export function Region({
  label,
  active = false,
  empty,
  direction = 'down',
  children,
  className,
  attributes,
}: {
  label: string
  active?: boolean
  /** Text shown when nothing is inside, because an empty box says nothing. */
  empty?: string
  /** `up` stacks from the bottom, the way a call stack grows. */
  direction?: 'up' | 'down'
  children: React.ReactNode
  className?: string
  attributes?: Record<string, string | undefined>
}) {
  return (
    <motion.div
      layout
      animate={{
        borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
        backgroundColor: active ? 'var(--color-accent-dim)' : 'transparent',
      }}
      transition={SETTLE}
      {...attributes}
      className={cx('rounded-lg border p-2', className)}
    >
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.4 }}
          transition={QUICK}
          className="size-1.5 rounded-full bg-accent"
        />
        <h4 className="text-xs tracking-wide text-muted uppercase">{label}</h4>
      </div>

      <div
        className={cx(
          'mt-2 flex min-h-24 gap-1',
          direction === 'up' ? 'flex-col-reverse justify-end' : 'flex-col',
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
        {empty ? <p className="text-xs text-faint">{empty}</p> : null}
      </div>
    </motion.div>
  )
}

/**
 * Console output. Lines are appended rather than redrawn, and the newest one
 * arrives late enough to be seen arriving. Printing is the payoff of most of
 * these animations, so it gets its own beat.
 */
export function OutputLog({
  lines,
  reducedMotion,
  className,
}: {
  lines: string[]
  reducedMotion: boolean
  className?: string
}) {
  if (lines.length === 0) return null

  return (
    <div className={className}>
      <h4 className="text-xs tracking-wide text-muted uppercase">Output</h4>
      <div className="mt-1 rounded-md bg-bg p-2 font-mono text-xs">
        <AnimatePresence initial={false}>
          {lines.map((line, i) => (
            <motion.div
              key={`${i}-${line}`}
              initial={reducedMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                ...SETTLE,
                delay: reducedMotion ? 0 : i === lines.length - 1 ? 0.12 : 0,
              }}
              className={i === lines.length - 1 ? 'text-fg' : 'text-muted'}
            >
              {line}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * The line that says what just happened. It slides in with the direction of
 * travel, so stepping backwards feels like stepping backwards. The outgoing
 * note is replaced rather than animated out: a caption that lingers for its own
 * exit animation is a caption that disagrees with the picture above it.
 */
export function StepNote({
  note,
  stepKey,
  direction,
  reducedMotion,
}: {
  note: string
  stepKey: number
  direction: 1 | -1
  reducedMotion: boolean
}) {
  return (
    <motion.p
      key={stepKey}
      initial={reducedMotion ? false : { opacity: 0, y: 8 * direction }}
      animate={{ opacity: 1, y: 0 }}
      transition={SETTLE}
      className="mt-4 min-h-10 text-sm leading-relaxed"
    >
      {note}
    </motion.p>
  )
}
