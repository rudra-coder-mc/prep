'use client'

import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { useNarration } from './narration-player'
import { nextSpeed } from './playback-speed'

export const ICON_BUTTON =
  'grid size-9 place-items-center rounded-lg border border-border text-muted transition hover:border-edge hover:bg-raised hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-35'

/**
 * Play, step and speed. The card on the page and the bar that follows you down
 * it show the same four buttons driving the same player, so they live here
 * rather than being written twice and drifting.
 */
export function NarrationControls({ className }: { className?: string }) {
  const { index, sections, playing, speed, setSpeed, toggle, playFrom } = useNarration()

  return (
    <div className={cx('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={playing ? 'Pause narration' : 'Play narration'}
        className={cx(ICON_BUTTON, 'border-accent/40 text-accent hover:border-accent')}
      >
        {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      </button>

      <button
        type="button"
        onClick={() => void playFrom(index - 1)}
        disabled={index === 0}
        aria-label="Previous section"
        className={ICON_BUTTON}
      >
        <ArrowLeftIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => void playFrom(index + 1)}
        disabled={index >= sections.length - 1}
        aria-label="Next section"
        className={ICON_BUTTON}
      >
        <ArrowRightIcon className="size-4" />
      </button>

      {/* Every visual on a lesson page carries a speed button of its own, so
          naming this one for what it controls is what keeps them apart - for
          a screen reader as much as for a test. */}
      <button
        type="button"
        onClick={() => setSpeed(nextSpeed(speed))}
        aria-label={`Narration speed, currently ${speed} times`}
        className={cx(ICON_BUTTON, 'w-auto px-2.5 font-mono text-xs tabular-nums')}
      >
        {speed}&times;
      </button>
    </div>
  )
}
