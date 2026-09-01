import type { ArchiveContent } from '@prep/content/archive/types'
import { findTopic } from '../library/tracks'

/**
 * Where a link tapped inside a lesson goes.
 *
 * The page hands the app the href as it was authored rather than following it,
 * so navigation stays native. A lesson is written once for both surfaces, so an
 * internal link is written as the web app's own address and read back here. See
 * docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md.
 */

export type LessonLink =
  | { kind: 'topic'; technology: string; directory: string }
  | { kind: 'external'; url: string }
  /** A link this device cannot follow, which the screen says rather than swallows. */
  | { kind: 'unknown' }

/** How the web addresses a topic, and therefore how a lesson links to one. */
const TOPIC = /^\/topics\/([^/]+)\/([^/]+)\/?$/

export function resolveLessonLink(content: ArchiveContent, href: string): LessonLink {
  const topic = TOPIC.exec(href)

  if (topic) {
    const [, technology, directory] = topic
    const held = technology && directory ? findTopic(content, technology, directory) : null

    // An address this device holds no copy of is not a topic it can open, and
    // a screen that says so beats a tap that does nothing.
    return held
      ? { kind: 'topic', technology: held.technology, directory: held.directory }
      : { kind: 'unknown' }
  }

  if (/^https?:\/\//.test(href)) return { kind: 'external', url: href }

  return { kind: 'unknown' }
}
