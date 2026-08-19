'use client'

import type { StepPlayer } from './use-step-player'

/** Shared transport for every visual: play, step, and a keyboard-reachable timeline. */
export function StepControls({ player, label }: { player: StepPlayer; label: string }) {
  if (player.count === 0) return null

  return (
    <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={player.toggle}
        aria-label={player.isPlaying ? 'Pause' : 'Play'}
        className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-sm hover:border-[var(--color-accent)]"
      >
        {player.isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={player.previous}
          disabled={player.isFirst}
          aria-label="Previous step"
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm disabled:opacity-40"
        >
          &larr;
        </button>
        <button
          type="button"
          onClick={player.next}
          disabled={player.isLast}
          aria-label="Next step"
          className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm disabled:opacity-40"
        >
          &rarr;
        </button>
      </div>

      <label className="flex flex-1 items-center gap-2 text-xs text-[var(--color-muted)]">
        <span className="sr-only">{label} timeline</span>
        <input
          type="range"
          min={0}
          max={Math.max(player.count - 1, 0)}
          value={player.index}
          onChange={(event) => player.goTo(Number(event.target.value))}
          className="flex-1 accent-[var(--color-accent)]"
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
    <figure className="my-8 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <figcaption className="border-b border-[var(--color-border)] px-4 py-2 text-xs tracking-wide text-[var(--color-muted)] uppercase">
        {title}
      </figcaption>
      <div className="p-4">{children}</div>
      <StepControls player={player} label={title} />
    </figure>
  )
}
