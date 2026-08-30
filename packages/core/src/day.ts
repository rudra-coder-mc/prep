/**
 * A "day" is a calendar day in one fixed timezone, configured rather than taken
 * from the device. Travelling must not shift when a streak rolls over, and two
 * devices must agree on what today is.
 */
export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'UTC'

/** en-CA formats as YYYY-MM-DD, which is also how the day column is stored. */
export function toDayString(date: Date, timeZone: string = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * A day string as a Date at UTC midnight. Every day is exactly 24 hours apart
 * there, so arithmetic over these cannot be bent by a summer time change.
 */
function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1))
}

export function addDays(day: string, delta: number): string {
  const shifted = parseDay(day)
  shifted.setUTCDate(shifted.getUTCDate() + delta)
  return shifted.toISOString().slice(0, 10)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Whole days from one day to another, negative when `to` is the earlier one. */
export function daysBetween(from: string, to: string): number {
  return (parseDay(to).getTime() - parseDay(from).getTime()) / MS_PER_DAY
}

export type ActivityDay = { day: string; reviewed: number; queueCleared: boolean }

/** A day counts when the queue was cleared, or when anything was reviewed at all. */
export function dayCounts(activity: ActivityDay): boolean {
  return activity.queueCleared || activity.reviewed > 0
}

/**
 * Consecutive qualifying days ending today. A day with nothing done yet does not
 * break the streak until it is over, so the count also accepts a run ending
 * yesterday.
 */
export function currentStreak(activity: ActivityDay[], today: string): number {
  const qualifying = new Set(activity.filter(dayCounts).map((entry) => entry.day))
  if (qualifying.size === 0) return 0

  let cursor = qualifying.has(today) ? today : addDays(today, -1)
  if (!qualifying.has(cursor)) return 0

  let streak = 0
  while (qualifying.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function longestStreak(activity: ActivityDay[]): number {
  const days = [...new Set(activity.filter(dayCounts).map((entry) => entry.day))].sort()

  let longest = 0
  let run = 0
  let previous: string | null = null

  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }
  return longest
}
