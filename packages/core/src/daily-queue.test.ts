import { describe, expect, it } from 'vitest'
import { buildDailyQueue, countDueToday, type ScheduledQuestion } from './daily-queue'
import type { Result } from './interval-ladder'

const NOW = new Date('2026-08-19T10:00:00')

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
      [question('due', '2026-08-19T09:00:00'), question('overdue', '2026-08-17T09:00:00')],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['overdue', 'due'])
    expect(queue[0]?.reason).toBe('overdue')
    expect(queue[1]?.reason).toBe('due')
  })

  it('orders overdue questions oldest first', () => {
    const queue = buildDailyQueue(
      [question('recent', '2026-08-18T09:00:00'), question('ancient', '2026-08-10T09:00:00')],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['ancient', 'recent'])
  })

  it('counts a question due later today as due, not as future', () => {
    const queue = buildDailyQueue([question('tonight', '2026-08-19T23:00:00')], NOW)
    expect(queue.map((q) => q.reason)).toEqual(['due'])
  })

  it('leaves questions due on a later day out of the due section', () => {
    const queue = buildDailyQueue([question('tomorrow', '2026-08-20T09:00:00')], NOW)
    expect(queue.every((q) => q.reason !== 'due')).toBe(true)
  })

  it('fills a short queue with the weakest questions that are not yet due', () => {
    const queue = buildDailyQueue(
      [
        question('due', '2026-08-19T09:00:00'),
        question('strong', '2026-08-30T09:00:00', { lastResult: 'passed', intervalStep: 4 }),
        question('failed', '2026-08-25T09:00:00', { lastResult: 'failed', intervalStep: 0 }),
        question('weak', '2026-08-25T09:00:00', { lastResult: 'weak', intervalStep: 1 }),
      ],
      NOW,
    )
    expect(queue.map((q) => q.questionId)).toEqual(['due', 'failed', 'weak'])
    expect(queue[1]?.reason).toBe('weak')
  })

  it('never uses a comfortably-passed question as filler', () => {
    const queue = buildDailyQueue(
      [question('strong', '2026-09-01T09:00:00', { lastResult: 'passed', intervalStep: 4 })],
      NOW,
    )
    expect(queue).toEqual([])
  })

  it('caps the queue so it is never a wall', () => {
    const many = Array.from({ length: 40 }, (_, i) => question(`q${i}`, '2026-08-18T09:00:00'))
    expect(buildDailyQueue(many, NOW)).toHaveLength(15)
    expect(buildDailyQueue(many, NOW, 5)).toHaveLength(5)
  })

  it('does not add filler when the due items already fill the cap', () => {
    const due = Array.from({ length: 5 }, (_, i) => question(`due${i}`, '2026-08-19T08:00:00'))
    const weak = question('weak', '2026-08-30T09:00:00', { lastResult: 'failed', intervalStep: 0 })

    const queue = buildDailyQueue([...due, weak], NOW, 5)
    expect(queue).toHaveLength(5)
    expect(queue.some((q) => q.questionId === 'weak')).toBe(false)
  })

  it('returns nothing for an empty schedule or a zero cap', () => {
    expect(buildDailyQueue([], NOW)).toEqual([])
    expect(buildDailyQueue([question('due', '2026-08-19T09:00:00')], NOW, 0)).toEqual([])
  })
})

describe('countDueToday', () => {
  it('counts everything due by the end of today, ignoring the cap', () => {
    const many = Array.from({ length: 40 }, (_, i) => question(`q${i}`, '2026-08-18T09:00:00'))
    expect(countDueToday(many, NOW)).toBe(40)
  })

  it('excludes anything due on a later day', () => {
    expect(
      countDueToday(
        [question('today', '2026-08-19T09:00:00'), question('tomorrow', '2026-08-20T09:00:00')],
        NOW,
      ),
    ).toBe(1)
  })
})
