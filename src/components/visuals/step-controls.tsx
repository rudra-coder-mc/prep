'use client'

import { motion } from 'motion/react'
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { QUICK } from './flow'
import { useAutoPlayInView, usePrefersReducedMotion, type StepPlayer } from './use-step-player'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg border border-border text-muted transition hover:border-edge hover:bg-raised hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-35'

/** Shared transport for every visual: play, step, speed, and a keyboard-reachable timeline. */
export function StepControls({ player, label }: { player: StepPlayer; label: string }) {
  if (player.count === 0) return null

  return (
    <div className="flex items-center gap-2 border-t border-border bg-bg/40 px-3 py-2.5">
      <button
        type="button"
        onClick={player.toggle}
        aria-label={player.isPlaying ? 'Pause' : 'Play'}
        className={cx(ICON_BUTTON, 'border-accent/40 text-accent hover:border-accent')}
      >
        {player.isPlaying ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
      </button>

      <button
        type="button"
        onClick={player.previous}
        disabled={player.isFirst}
        aria-label="Previous step"
        className={ICON_BUTTON}
      >
        <ArrowLeftIcon className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={player.next}
        disabled={player.isLast}
        aria-label="Next step"
        className={ICON_BUTTON}
      >
        <ArrowRightIcon className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={player.cycleSpeed}
        aria-label={`Playback speed, currently ${player.speed} times`}
        className={cx(ICON_BUTTON, 'w-auto px-2 font-mono text-xs tabular-nums')}
      >
        {player.speed}&times;
      </button>

      <label className="flex flex-1 items-center gap-3 text-xs text-faint">
        <span className="sr-only">{label} timeline</span>
        <input
          type="range"
          min={0}
          max={Math.max(player.count - 1, 0)}
          value={player.index}
          onChange={(event) => player.goTo(Number(event.target.value))}
          className="h-1 flex-1 cursor-pointer accent-accent"
        />
        <span className="tabular-nums">
          {player.index + 1}/{player.count}
        </span>
      </label>
    </div>
  )
}

/**
 * The frame every visual sits in. It owns the transport, the step markers and
 * the one thing that makes these read as animations rather than slideshows:
 * playing itself the first time it is scrolled into view.
 */
export function VisualFrame({
  title,
  player,
  children,
}: {
  title: string
  player: StepPlayer
  children: React.ReactNode
}) {
  const reducedMotion = usePrefersReducedMotion()
  const frame = useAutoPlayInView(player.play, !reducedMotion)

  return (
    <figure
      ref={frame}
      className="my-8 overflow-hidden rounded-card border border-border bg-surface"
    >
      <figcaption className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-medium tracking-wider text-faint uppercase">
        <motion.span
          animate={
            player.isPlaying
              ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
              : { scale: 1, opacity: 1 }
          }
          transition={player.isPlaying ? { duration: 1.6, repeat: Infinity } : QUICK}
          className="size-1.5 rounded-full bg-accent"
        />
        {title}
        <span className="ml-auto flex gap-1" aria-hidden>
          {Array.from({ length: player.count }, (_, i) => (
            <motion.span
              key={i}
              animate={{
                backgroundColor:
                  i === player.index
                    ? 'var(--color-accent)'
                    : i < player.index
                      ? 'var(--color-edge)'
                      : 'var(--color-border)',
                width: i === player.index ? 14 : 6,
              }}
              transition={QUICK}
              className="h-1 rounded-full"
            />
          ))}
        </span>
      </figcaption>
      <div className="p-4">{children}</div>
      <StepControls player={player} label={title} />
    </figure>
  )
}
