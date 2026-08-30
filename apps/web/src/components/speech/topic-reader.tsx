'use client'

import { Card, SectionLabel } from '@/components/ui/card'
import { NarrationControls } from './narration-controls'
import { useNarration } from './narration-player'

/**
 * The player as it sits at the top of a lesson: what is about to be read, where
 * in the topic it is, and the controls.
 *
 * It scrolls away with the rest of the page. `FollowingReader` is the same
 * player once it has, and `NarratedLesson` is the lesson keeping up with it.
 */
export function TopicReader() {
  const { sections, card, index, section, title, playing, preparing, error } = useNarration()

  if (!section) return null

  return (
    <Card
      ref={card}
      data-topic-reader
      role="group"
      aria-label={`Listen to ${title}`}
      className="border-accent/20 bg-gradient-to-br from-accent-dim/40"
    >
      <div className="flex items-center gap-3">
        <SectionLabel>Listen</SectionLabel>
        <span className="ml-auto text-xs text-faint tabular-nums">
          {index + 1} of {sections.length}
        </span>
      </div>

      <p data-reader-section className="mt-2 text-lg font-medium text-pretty">
        {section.title}
      </p>

      <p aria-live="polite" className="mt-1 min-h-5 text-sm text-muted">
        {error ??
          (preparing
            ? 'Reading this section for the first time. Every play after this one is instant.'
            : playing
              ? `Playing ${title} aloud.`
              : 'Paused.')}
      </p>

      <NarrationControls className="mt-4" />
    </Card>
  )
}
