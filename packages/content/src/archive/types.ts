import type { Exercise, Question, TopicMeta } from '@prep/core'

/**
 * Everything a device needs to run the loop with nothing to connect to.
 *
 * It carries every question in full, correct options included, because a phone
 * with the server switched off has nothing to ask what the right answer is. That
 * is a real weakening of the guarantee the web keeps, taken deliberately: see
 * docs/decisions/0037-the-mobile-archive-carries-the-answers.md. No effort is
 * spent making this hard to read.
 *
 * Audio is not in here. It is two orders of magnitude larger and is downloaded a
 * track at a time, one file per key, which is what the keys below are for.
 *
 * The shapes and nothing that reads or writes one, deliberately. The build that
 * writes an archive runs on Node and the phone that reads one does not, so the
 * two agree about the shape by importing it from here rather than by describing
 * it twice. Nothing in this file may reach for a filesystem.
 */

export type ArchiveNarrationSection = {
  title: string
  heading: string
  script: string
  /** Where the recording of this section lives, if it has been made. */
  audioKey: string
}

export type ArchiveQuestion = Question & {
  /** The prompt read aloud, which is safe to hold before the question is answered. */
  promptAudioKey: string
  /** The answer read aloud. Shown only once the question has been answered. */
  answerAudioKey: string
}

export type ArchiveTopic = TopicMeta & {
  slug: string
  technology: string
  directory: string
  /** Where this topic's pre-rendered page is, relative to the archive's root. */
  lesson: string
  questions: ArchiveQuestion[]
  exercises: Exercise[]
  narration: ArchiveNarrationSection[] | null
}

export type ArchiveContent = {
  version: string
  technologies: { id: string; topics: string[] }[]
  topics: ArchiveTopic[]
}

/**
 * Where a topic's page sits inside the archive. Both the archive and the build
 * that writes the pages go through here, so a device following the path in the
 * data always finds a file.
 */
export function lessonPagePath(technology: string, directory: string): string {
  return `lessons/${technology}/${directory}.html`
}
