import type { Result } from './interval-ladder'

/** The shape the queue needs, so it can be built without touching a database. */
export type ScheduledQuestion = {
  questionId: string
  topicSlug: string
  dueAt: Date
  intervalStep: number
  lastResult: Result | null
}

export const DAILY_QUEUE_CAP = 15

export type QueueReason = 'overdue' | 'due' | 'weak'
export type QueuedQuestion = ScheduledQuestion & { reason: QueueReason }

export function startOfDay(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

/** Lower sorts first. A failed question is weaker than a merely weak one. */
function weakness(question: ScheduledQuestion): number {
  const byResult = question.lastResult === 'failed' ? 0 : question.lastResult === 'weak' ? 1 : 2
  return byResult * 100 + question.intervalStep
}

/**
 * Builds the day's queue in priority order: whatever is overdue, then whatever
 * is due today, then the weakest questions as filler. Capped so the queue is
 * never a wall.
 *
 * See docs/decisions/0005-recall-interval-ladder.md.
 */
export function buildDailyQueue(
  questions: ScheduledQuestion[],
  now: Date,
  cap: number = DAILY_QUEUE_CAP,
): QueuedQuestion[] {
  if (cap <= 0) return []

  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  const overdue: QueuedQuestion[] = []
  const due: QueuedQuestion[] = []
  const rest: ScheduledQuestion[] = []

  for (const question of questions) {
    if (question.dueAt < dayStart) overdue.push({ ...question, reason: 'overdue' })
    else if (question.dueAt <= dayEnd) due.push({ ...question, reason: 'due' })
    else rest.push(question)
  }

  // The final tiebreak keeps the queue stable, since rows come back unordered.
  const byDueDate = (a: ScheduledQuestion, b: ScheduledQuestion) =>
    a.dueAt.getTime() - b.dueAt.getTime() || a.questionId.localeCompare(b.questionId)

  overdue.sort(byDueDate)
  due.sort(byDueDate)

  const queue = [...overdue, ...due].slice(0, cap)
  if (queue.length >= cap) return queue

  const filler = rest
    .filter((question) => weakness(question) < 200)
    .sort((a, b) => weakness(a) - weakness(b) || byDueDate(a, b))
    .slice(0, cap - queue.length)
    .map((question): QueuedQuestion => ({ ...question, reason: 'weak' }))

  return [...queue, ...filler]
}

/** What is due today regardless of the cap, so "cleared" means genuinely cleared. */
export function countDueToday(questions: ScheduledQuestion[], now: Date): number {
  const dayEnd = endOfDay(now)
  return questions.filter((question) => question.dueAt <= dayEnd).length
}
