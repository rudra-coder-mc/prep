import type { Result } from './interval-ladder'

export const TOPIC_STATUSES = ['not_started', 'learning', 'weak', 'understood', 'mastered'] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]

export type AttemptRecord = {
  questionId: string
  result: Result
  confidence: number
  attemptedAt: Date
}

/** How many recent attempts the status looks at. Older ones no longer count against you. */
export const RECENT_ATTEMPTS = 5

export type TopicSummary = {
  status: TopicStatus
  /** Share of the topic's questions whose most recent attempt passed. */
  progress: number
  attempts: number
  lastConfidence: number | null
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
 */
export function summariseTopic(
  questionCount: number,
  attempts: AttemptRecord[],
  learnedAt: Date | null,
): TopicSummary {
  if (attempts.length === 0) {
    return {
      status: learnedAt ? 'learning' : 'not_started',
      progress: 0,
      attempts: 0,
      lastConfidence: null,
    }
  }

  const ordered = [...attempts].sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())
  const recent = ordered.slice(0, RECENT_ATTEMPTS)
  const averageConfidence =
    recent.reduce((total, attempt) => total + attempt.confidence, 0) / recent.length

  const latest = mostRecentPerQuestion(attempts)
  const passing = [...latest.values()].filter((attempt) => attempt.result === 'passed').length
  const progress = questionCount === 0 ? 0 : Math.round((passing / questionCount) * 100)

  const summary = {
    progress,
    attempts: attempts.length,
    lastConfidence: ordered[0]?.confidence ?? null,
  }

  const hasRecentFailure = recent.some((attempt) => attempt.result === 'failed')
  if (hasRecentFailure || averageConfidence < 2.5) return { ...summary, status: 'weak' }

  const allRecentPassed = recent.every((attempt) => attempt.result === 'passed')
  if (recent.length >= 3 && allRecentPassed && averageConfidence >= 4.5 && progress === 100) {
    return { ...summary, status: 'mastered' }
  }

  if (averageConfidence >= 3.5) return { ...summary, status: 'understood' }

  return { ...summary, status: 'learning' }
}

export const STATUS_LABELS: Record<TopicStatus, string> = {
  not_started: 'Not started',
  learning: 'Learning',
  weak: 'Weak',
  understood: 'Understood',
  mastered: 'Mastered',
}
