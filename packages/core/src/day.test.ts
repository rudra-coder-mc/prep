import { describe, expect, it } from 'vitest'
import {
  addDays,
  currentStreak,
  daysBetween,
  longestStreak,
  toDayString,
  type ActivityDay,
} from './day'

const day = (d: string, overrides: Partial<ActivityDay> = {}): ActivityDay => ({
  day: d,
  reviewed: 3,
  queueCleared: true,
  ...overrides,
})

describe('toDayString', () => {
  it('formats as the same YYYY-MM-DD the day column stores', () => {
    expect(toDayString(new Date('2026-08-19T10:00:00Z'), 'UTC')).toBe('2026-08-19')
  })

  it('uses the configured timezone rather than the machine, so travelling does not shift a day', () => {
    const lateUtc = new Date('2026-08-19T22:00:00Z')
    expect(toDayString(lateUtc, 'UTC')).toBe('2026-08-19')
    expect(toDayString(lateUtc, 'Asia/Kolkata')).toBe('2026-08-20')
    expect(toDayString(lateUtc, 'America/Los_Angeles')).toBe('2026-08-19')
  })
})

describe('addDays', () => {
  it('steps across a month boundary', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31')
  })

  it('steps across a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('daysBetween', () => {
  it('counts whole days forward', () => {
    expect(daysBetween('2026-08-17', '2026-08-20')).toBe(3)
  })

  it('is zero for the same day', () => {
    expect(daysBetween('2026-08-17', '2026-08-17')).toBe(0)
  })

  it('goes negative when the later day comes first', () => {
    expect(daysBetween('2026-08-20', '2026-08-17')).toBe(-3)
  })

  it('crosses a month, a year and a leap day without drifting', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1)
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2)
  })

  /**
   * The dates are parsed as UTC rather than local, so a run in a timezone with
   * a summer time change cannot produce a 23 or 25 hour day and round wrong.
   */
  it('is unaffected by a daylight saving change between the two days', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
  })
})

describe('currentStreak', () => {
  it('counts consecutive days ending today', () => {
    const activity = [day('2026-08-17'), day('2026-08-18'), day('2026-08-19')]
    expect(currentStreak(activity, '2026-08-19')).toBe(3)
  })

  it('survives a day that has not happened yet', () => {
    const activity = [day('2026-08-17'), day('2026-08-18')]
    expect(currentStreak(activity, '2026-08-19')).toBe(2)
  })

  it('breaks when a day was missed entirely', () => {
    const activity = [day('2026-08-15'), day('2026-08-16')]
    expect(currentStreak(activity, '2026-08-19')).toBe(0)
  })

  it('counts a day with reviews even if the queue was not cleared', () => {
    const activity = [day('2026-08-19', { queueCleared: false, reviewed: 2 })]
    expect(currentStreak(activity, '2026-08-19')).toBe(1)
  })

  it('counts a cleared queue even when there was nothing to review', () => {
    const activity = [day('2026-08-19', { queueCleared: true, reviewed: 0 })]
    expect(currentStreak(activity, '2026-08-19')).toBe(1)
  })

  it('ignores a day where nothing happened at all', () => {
    const activity = [day('2026-08-18'), day('2026-08-19', { queueCleared: false, reviewed: 0 })]
    expect(currentStreak(activity, '2026-08-19')).toBe(1)
  })

  it('is zero with no activity', () => {
    expect(currentStreak([], '2026-08-19')).toBe(0)
  })

  it('does not break across a month boundary', () => {
    const activity = [day('2026-08-31'), day('2026-09-01')]
    expect(currentStreak(activity, '2026-09-01')).toBe(2)
  })
})

describe('longestStreak', () => {
  it('finds the longest run, not the most recent one', () => {
    const activity = [
      day('2026-08-01'),
      day('2026-08-02'),
      day('2026-08-03'),
      day('2026-08-10'),
      day('2026-08-11'),
    ]
    expect(longestStreak(activity)).toBe(3)
  })

  it('is zero when nothing qualifies', () => {
    expect(longestStreak([day('2026-08-01', { queueCleared: false, reviewed: 0 })])).toBe(0)
  })
})
