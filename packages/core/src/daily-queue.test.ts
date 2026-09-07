import { describe, expect, it } from 'vitest'
import {
  buildDailyQueue,
  countDueToday,
  endOfDay,
  startOfDay,
  type ScheduledQuestion,
} from './daily-queue'
import { toDayString } from './day'
import type { Result } from './interval-ladder'

const NOW = new Date('2026-08-19T10:00:00Z')

function question(
  id: string,
  dueAt: string,
  overrides: Partial<ScheduledQuestion> = {},
): ScheduledQuestion {
  return {
    questionId: id,
    topicSlug: 'javascript/closures',
    dueAt: new Date(dueAt),
    intervalStep: 2,
    lastResult: 'passed' as Result,
    ...overrides,
  }
}

describe('buildDailyQueue', () => {
  it('puts overdue questions before ones merely due today', () => {
    const queue = buildDailyQueue(
      [question('due', '2026-08-19T09:00:00Z'), question('overdue', '2026-08-17T09:00:00Z')],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['overdue', 'due'])
    expect(queue[0]?.reason).toBe('overdue')
    expect(queue[1]?.reason).toBe('due')
  })

  it('orders overdue questions oldest first', () => {
    const queue = buildDailyQueue(
      [question('recent', '2026-08-18T09:00:00Z'), question('ancient', '2026-08-10T09:00:00Z')],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['ancient', 'recent'])
  })

  it('counts a question due later today as due, not as future', () => {
    const queue = buildDailyQueue([question('tonight', '2026-08-19T23:00:00Z')], NOW)
    expect(queue.map((q) => q.reason)).toEqual(['due'])
  })

  it('leaves questions due on a later day out of the due section', () => {
    const queue = buildDailyQueue([question('tomorrow', '2026-08-20T09:00:00Z')], NOW)
    expect(queue.every((q) => q.reason !== 'due')).toBe(true)
  })

  it('fills a short queue with the weakest questions that are not yet due', () => {
    const queue = buildDailyQueue(
      [
        question('due', '2026-08-19T09:00:00Z'),
        question('strong', '2026-08-30T09:00:00Z', { lastResult: 'passed', intervalStep: 4 }),
        question('failed', '2026-08-25T09:00:00Z', { lastResult: 'failed', intervalStep: 0 }),
        question('weak', '2026-08-25T09:00:00Z', { lastResult: 'weak', intervalStep: 1 }),
      ],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['due', 'failed', 'weak'])
    expect(queue[1]?.reason).toBe('weak')
  })

  it('never uses a comfortably-passed question as filler', () => {
    const queue = buildDailyQueue(
      [question('strong', '2026-09-01T09:00:00Z', { lastResult: 'passed', intervalStep: 4 })],
      NOW,
    )
    expect(queue).toEqual([])
  })

  it('caps the queue so it is never a wall', () => {
    const many = Array.from({ length: 40 }, (_, i) => question(`q${i}`, '2026-08-18T09:00:00Z'))
    expect(buildDailyQueue(many, NOW)).toHaveLength(15)
    expect(buildDailyQueue(many, NOW, 5)).toHaveLength(5)
  })

  it('does not add filler when the due items already fill the cap', () => {
    const due = Array.from({ length: 5 }, (_, i) => question(`due${i}`, '2026-08-19T08:00:00Z'))
    const weak = question('weak', '2026-08-30T09:00:00Z', { lastResult: 'failed', intervalStep: 0 })

    const queue = buildDailyQueue([...due, weak], NOW, 5)
    expect(queue).toHaveLength(5)
    expect(queue.some((q) => q.questionId === 'weak')).toBe(false)
  })

  it('returns nothing for an empty schedule or a zero cap', () => {
    expect(buildDailyQueue([], NOW)).toEqual([])
    expect(buildDailyQueue([question('due', '2026-08-19T09:00:00Z')], NOW, 0)).toEqual([])
  })
})

describe('countDueToday', () => {
  it('counts everything due by the end of today, ignoring the cap', () => {
    const many = Array.from({ length: 40 }, (_, i) => question(`q${i}`, '2026-08-18T09:00:00Z'))
    expect(countDueToday(many, NOW)).toBe(40)
  })

  it('excludes anything due on a later day', () => {
    expect(
      countDueToday(
        [question('today', '2026-08-19T09:00:00Z'), question('tomorrow', '2026-08-20T09:00:00Z')],
        NOW,
      ),
    ).toBe(1)
  })
})

describe('timezone agreement between daily queue and streak', () => {
  it('names the exact same calendar day for start and end of day as the streak', () => {
    const timezones = [
      'UTC',
      'America/New_York',
      'Asia/Tokyo',
      'Europe/London',
      'Pacific/Auckland',
      'Pacific/Honolulu',
    ]
    const testInstants = [
      new Date('2026-01-01T00:30:00Z'),
      new Date('2026-03-08T06:00:00Z'), // US DST change boundary
      new Date('2026-08-19T01:30:00Z'),
      new Date('2026-11-01T05:30:00Z'),
      new Date('2026-12-31T23:30:00Z'),
    ]

    for (const tz of timezones) {
      for (const instant of testInstants) {
        const streakDay = toDayString(instant, tz)
        const start = startOfDay(instant, tz)
        const end = endOfDay(instant, tz)

        expect(toDayString(start, tz)).toBe(streakDay)
        expect(toDayString(end, tz)).toBe(streakDay)

        // 1 millisecond before the start must be the previous day
        const justBefore = new Date(start.getTime() - 1)
        expect(toDayString(justBefore, tz)).not.toBe(streakDay)

        // 1 millisecond after the end must be the following day
        const justAfter = new Date(end.getTime() + 1)
        expect(toDayString(justAfter, tz)).not.toBe(streakDay)
      }
    }
  })

  it('classifies questions using the specified timezone rather than process local time', () => {
    // 2026-08-19T01:00:00Z is:
    // - 2026-08-18 21:00:00 in America/New_York (Aug 18)
    // - 2026-08-19 01:00:00 in UTC (Aug 19)
    // - 2026-08-19 10:00:00 in Asia/Tokyo (Aug 19)
    const instant = new Date('2026-08-19T01:00:00Z')

    const qAug18Evening = question('q1', '2026-08-18T23:00:00Z') // 19:00 NY, 23:00 UTC, 08:00+1 Tokyo
    const qAug19Morning = question('q2', '2026-08-19T13:00:00Z') // 09:00 NY, 13:00 UTC, 22:00 Tokyo
    const qAug17 = question('q0', '2026-08-17T12:00:00Z')

    // In America/New_York: instant is Aug 18
    // qAug18Evening is Aug 18 -> due
    // qAug19Morning is Aug 19 -> tomorrow (not due)
    // qAug17 is Aug 17 -> overdue
    const nyQueue = buildDailyQueue(
      [qAug17, qAug18Evening, qAug19Morning],
      instant,
      15,
      'America/New_York',
    )
    expect(nyQueue.map((q) => [q.questionId, q.reason])).toEqual([
      ['q0', 'overdue'],
      ['q1', 'due'],
    ])
    expect(countDueToday([qAug17, qAug18Evening, qAug19Morning], instant, 'America/New_York')).toBe(
      2,
    )

    // In UTC: instant is Aug 19
    // qAug17 and qAug18Evening were due on Aug 17 and Aug 18 -> both overdue
    // qAug19Morning is Aug 19 -> due
    const utcQueue = buildDailyQueue([qAug17, qAug18Evening, qAug19Morning], instant, 15, 'UTC')
    expect(utcQueue.map((q) => [q.questionId, q.reason])).toEqual([
      ['q0', 'overdue'],
      ['q1', 'overdue'],
      ['q2', 'due'],
    ])
    expect(countDueToday([qAug17, qAug18Evening, qAug19Morning], instant, 'UTC')).toBe(3)
  })
})
