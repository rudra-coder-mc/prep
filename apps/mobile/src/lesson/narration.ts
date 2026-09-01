import type { ArchiveTopic } from '@prep/content/archive/types'
import { headingSlug } from '@prep/core'

/**
 * The narration of a lesson, as the phone's player takes it.
 *
 * Only the sections this device holds a recording of. A track's audio is
 * downloaded a track at a time and a phone may hold none of it, so a section
 * with no file is left out rather than offered and then failing: the same rule
 * the question prompt's control follows in ../ui/listen.tsx.
 *
 * The slug is what ties a section to its part of the lesson, and it comes from
 * @prep/core so that the app and the page cannot disagree about which heading a
 * section means. See docs/decisions/0018-the-lesson-follows-the-voice.md.
 */

export type PlayableSection = {
  title: string
  /** The id of the lesson heading this section is about. */
  slug: string
  audioKey: string
}

export function playableSections(topic: ArchiveTopic, held: Set<string>): PlayableSection[] {
  return (topic.narration ?? [])
    .filter((section) => held.has(section.audioKey))
    .map((section) => ({
      title: section.title,
      slug: headingSlug(section.heading),
      audioKey: section.audioKey,
    }))
}
