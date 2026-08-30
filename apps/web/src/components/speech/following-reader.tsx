'use client'

import { useEffect, useState } from 'react'
import { headingSlug } from '@prep/core'
import { ArrowDownIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { ICON_BUTTON, NarrationControls } from './narration-controls'
import { useNarration } from './narration-player'

/**
 * The player once the card it started from has scrolled out of sight.
 *
 * A lesson is longer than a screen, and narration runs for minutes, so by the
 * second section the controls are somewhere above the reader. This is those
 * controls, following them down, and it appears only while a topic is actually
 * being listened to. A reader who has not pressed play gets an ordinary page.
 */
export function FollowingReader() {
  const { sections, card, index, section, following } = useNarration()
  const [cardOnScreen, setCardOnScreen] = useState(true)

  useEffect(() => {
    const element = card.current
    // No element and no observer both mean the same thing here: nothing to watch,
    // so the bar stays out of the way rather than appearing over a visible card.
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) =>
      setCardOnScreen(entry?.isIntersecting ?? true),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [card])

  if (!section || !following || cardOnScreen) return null

  return (
    <div
      data-following-reader
      role="group"
      aria-label="Narration controls"
      className={cx(
        'fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(44rem,calc(100%-2rem))] items-center gap-3',
        'rounded-card border border-accent/25 bg-surface/85 p-3 shadow-lg shadow-black/40 backdrop-blur',
      )}
    >
      <NarrationControls />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{section.title}</p>
        <p className="text-xs text-faint tabular-nums">
          {index + 1} of {sections.length}
        </p>
      </div>

      {/* The one thing the card cannot offer: the listener has read ahead, or
          wandered off, and wants to be back where the voice is. */}
      <button
        type="button"
        onClick={() => scrollToSection(section.heading)}
        aria-label="Scroll to what is playing"
        className={ICON_BUTTON}
      >
        <ArrowDownIcon className="size-4" />
      </button>
    </div>
  )
}

function scrollToSection(heading: string) {
  document.getElementById(headingSlug(heading))?.scrollIntoView({ block: 'start' })
}
