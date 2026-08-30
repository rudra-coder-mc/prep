import type { Result } from './interval-ladder'

export const TOPIC_STATUSES = ['not_started', 'learning', 'weak', 'understood', 'mastered'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export type AttemptRecord = {
  questionId: string
  result: Result
  attemptedAt: Date
}

/** How many recent attempts the status looks at. Older ones no longer count against you. */
export const RECENT_ATTEMPTS = 5

/** How much of a topic has to be passing before a run of good answers means much. */
export const UNDERSTOOD_PROGRESS = 60

export type TopicSummary = {
  status: TopicStatus
  /** Share of the topic's questions whose most recent attempt passed. */
  progress: number
  attempts: number
}

function mostRecentPerQuestion(attempts: AttemptRecord[]): Map<string, AttemptRecord> {
  const latest = new Map<string, AttemptRecord>()
  for (const attempt of attempts) {
    const existing = latest.get(attempt.questionId)
    if (!existing || attempt.attemptedAt > existing.attemptedAt)
      latest.set(attempt.questionId, attempt)
  }
  return latest
}

/**
 * Status is computed from recent attempts rather than stored, so changing how it
 * is scored is a code change rather than a backfill.
 *
 * It reads results and how much of the topic is passing, not the confidence on
 * an attempt. Confidence is derived from the answer form now, so averaging it
 * would say which forms a topic happens to be made of rather than how well it is
 * known. See docs/decisions/0025-confidence-is-derived-and-the-ladder-climbs.md.
 */
export function summariseTopic(
  questionCount: number,
  attempts: AttemptRecord[],
  learnedAt: Date | null,
): TopicSummary {
  if (attempts.length === 0) {
    return { status: learnedAt ? 'learning' : 'not_started', progress: 0, attempts: 0 }
  }

  const ordered = [...attempts].sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())
  const recent = ordered.slice(0, RECENT_ATTEMPTS)

  const latest = mostRecentPerQuestion(attempts)
  const passing = [...latest.values()].filter((attempt) => attempt.result === 'passed').length
  const progress = questionCount === 0 ? 0 : Math.round((passing / questionCount) * 100)

  const summary = { progress, attempts: attempts.length }

  if (recent.some((attempt) => attempt.result === 'failed')) return { ...summary, status: 'weak' }

  // A run of Weak self grades is the topic telling you something, even with
  // nothing outright failed.
  const shaky = recent.filter((attempt) => attempt.result !== 'passed').length
  if (shaky * 2 >= recent.length) return { ...summary, status: 'weak' }

  if (shaky > 0) return { ...summary, status: 'learning' }

  if (recent.length >= 3 && progress === 100) return { ...summary, status: 'mastered' }
  if (progress >= UNDERSTOOD_PROGRESS) return { ...summary, status: 'understood' }

  return { ...summary, status: 'learning' }
}

export const STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: 'Not started',
  learning: 'Learning',
  weak: 'Weak',
  understood: 'Understood',
  mastered: 'Mastered',
}
