import type { ArchiveContent, ArchiveQuestion } from '@prep/content/archive/types'
import {
  buildDailyQueue,
  countDueToday,
  DAILY_QUEUE_CAP,
  DEFAULT_TIER,
  questionKey,
  tiersUpTo,
  type QueueReason,
  type ScheduledQuestion,
  type Tier,
} from '@prep/core'

/**
 * The day's queue, from the archive on the device and the ladder rows beside it.
 *
 * What to ask and in what order is @prep/core's, so the phone and the laptop
 * offer the same questions in the same order for the same schedule. This file
 * only decides which of the rows can be asked at all.
 *
 * Scoped to active track tiers so that questions above a user's chosen interview
 * tier are never queued or counted towards due today.
 *
 * A queued question carries its answer, because a device with the server
 * switched off has nothing to ask what the right answer is. Keeping it out of
 * sight until the question has been answered is the session screen's job rather
 * than this one's. See
 * docs/decisions/0037-the-mobile-archive-carries-the-answers.md.
 */

export type QueuedItem = {
  /** The key both surfaces store an attempt against. */
  key: string
  topicSlug: string
  topicTitle: string
  technology: string
  question: ArchiveQuestion
  reason: QueueReason
}

export type ReviewQueue = {
  items: QueuedItem[]
  /** Everything due today, cap or no cap, so "cleared" means genuinely cleared. */
  dueToday: number
  cap: number
}

type Known = {
  topicSlug: string
  topicTitle: string
  technology: string
  question: ArchiveQuestion
}

function questionsByKey(content: ArchiveContent): Map<string, Known> {
  const index = new Map<string, Known>()

  for (const topic of content.topics) {
    for (const question of topic.questions) {
      index.set(questionKey(topic.slug, question.id), {
        topicSlug: topic.slug,
        topicTitle: topic.title,
        technology: topic.technology,
        question,
      })
    }
  }

  return index
}

export function buildReviewQueue(
  content: ArchiveContent,
  schedule: ScheduledQuestion[],
  now: Date,
  cap: number = DAILY_QUEUE_CAP,
  trackTiers?: Map<string, Tier>,
  defaultTier: Tier = DEFAULT_TIER,
): ReviewQueue {
  const index = questionsByKey(content)

  // An archive is replaced whole and can lag behind a sync, so a row can name a
  // question this device holds no copy of. Furthermore, questions exceeding the
  // user's active tier for a track must not be asked or counted.
  const askable = schedule.filter((row) => {
    const known = index.get(row.questionId)
    if (!known) return false
    const activeTier = trackTiers?.get(known.technology) ?? defaultTier
    return tiersUpTo(activeTier).includes(known.question.tier)
  })

  const items = buildDailyQueue(askable, now, cap).flatMap((entry): QueuedItem[] => {
    const known = index.get(entry.questionId)
    if (!known) return []

    return [{ key: entry.questionId, ...known, reason: entry.reason }]
  })

  return { items, dueToday: countDueToday(askable, now), cap }
}
