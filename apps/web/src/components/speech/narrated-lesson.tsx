'use client'

import { useEffect, useRef } from 'react'
import { headingSlug } from '@prep/core'
import { markNarratedSection } from './narrated-section'
import { useNarration } from './narration-player'

/**
 * The lesson, keeping up with what is being said about it.
 *
 * While a topic is being listened to, the section the voice is on is the only
 * part of the page at full strength and the page scrolls to it as the narration
 * The rest of the time, when nobody is listening or the topic has been heard
 * out, this is an ordinary article and nothing on the page has changed.
 *
 * Which section that is comes from the narration itself: every section names the
 * lesson heading it covers, and the heading's id is the tie between them. See
 * `docs/decisions/0018-the-lesson-follows-the-voice.md`.
 */
export function NarratedLesson({ children }: { children: React.ReactNode }) {
  const { section, following } = useNarration()
  const lesson = useRef<HTMLElement>(null)

  const slug = following && section ? headingSlug(section.heading) : null

  useEffect(() => {
    const element = lesson.current
    if (!element) return

    markNarratedSection(element, slug)
    if (!slug) return

    // Marked first, then scrolled to: the reader should arrive at a section that
    // is already lit rather than watch it light up after it settles.
    document.getElementById(slug)?.scrollIntoView({ block: 'start' })
  }, [slug])

  return (
    <article
      ref={lesson}
      data-narrated-lesson={slug !== null}
      className="mt-10 text-[0.975rem] leading-7"
    >
      {children}
    </article>
  )
}
