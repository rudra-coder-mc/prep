import { APP_TIMEZONE, toDayString } from './day'
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

function getZonedOffset(ms: number, timeZone: string): number {
  if (timeZone === 'UTC') return 0
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date(ms))
  const p: Record<string, string> = {}
  for (const part of parts) {
    p[part.type] = part.value
  }
  const hour = p.hour === '24' ? 0 : Number(p.hour)
  const zonedMs = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
    Number(p.fractionalSecond ?? 0),
  )
  return zonedMs - ms
}

export function startOfDay(date: Date, timeZone: string = APP_TIMEZONE): Date {
  const dayStr = toDayString(date, timeZone)
  const [y, m, d] = dayStr.split('-').map(Number)
  const targetUtc = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
  if (timeZone === 'UTC') return new Date(targetUtc)

  const offset = getZonedOffset(targetUtc, timeZone)
  let startMs = targetUtc - offset
  const offset2 = getZonedOffset(startMs, timeZone)
  if (offset2 !== offset) {
    startMs = targetUtc - offset2
  }
  return new Date(startMs)
}

export function endOfDay(date: Date, timeZone: string = APP_TIMEZONE): Date {
  const dayStr = toDayString(date, timeZone)
  const [y, m, d] = dayStr.split('-').map(Number)
  const nextDayUtc = Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + 1, 0, 0, 0, 0)
  if (timeZone === 'UTC') return new Date(nextDayUtc - 1)

  const offset = getZonedOffset(nextDayUtc, timeZone)
  let nextStartMs = nextDayUtc - offset
  const offset2 = getZonedOffset(nextStartMs, timeZone)
  if (offset2 !== offset) {
    nextStartMs = nextDayUtc - offset2
  }
  return new Date(nextStartMs - 1)
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
  timeZone: string = APP_TIMEZONE,
): QueuedQuestion[] {
  if (cap <= 0) return []

  const dayStart = startOfDay(now, timeZone)
  const dayEnd = endOfDay(now, timeZone)

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
export function countDueToday(
  questions: ScheduledQuestion[],
  now: Date,
  timeZone: string = APP_TIMEZONE,
): number {
  const dayEnd = endOfDay(now, timeZone)
  return questions.filter((question) => question.dueAt <= dayEnd).length
}
