'use client'

import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import type { StepPlayer } from './use-step-player'

const ICON_BUTTON =
  'grid size-8 place-items-center rounded-lg border border-border text-muted transition hover:border-edge hover:bg-raised hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-35'

/** Shared transport for every visual: play, step, and a keyboard-reachable timeline. */
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

export function VisualFrame({
  title,
  player,
  children,
}: {
  title: string
  player: StepPlayer
  children: React.ReactNode
}) {
  return (
    <figure className="my-8 overflow-hidden rounded-card border border-border bg-surface">
      <figcaption className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-medium tracking-wider text-faint uppercase">
        <span className="size-1.5 rounded-full bg-accent" />
        {title}
      </figcaption>
      <div className="p-4">{children}</div>
      <StepControls player={player} label={title} />
    </figure>
  )
}
