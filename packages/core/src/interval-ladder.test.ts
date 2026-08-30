import { describe, expect, it } from 'vitest'
import { daysUntilDue, nextDueDate, nextRung, TOP_RUNG, type LadderStep } from './interval-ladder'

const MONDAY_NOON = new Date('2026-08-17T12:00:00.000Z')

describe('nextRung on a graded form', () => {
  it('climbs one rung at a time, so a question answered right works its way out', () => {
    const days = [0, 1, 2, 3, 4].map((from) =>
      daysUntilDue(nextRung('choice', 'passed', from as LadderStep).step),
    )

    expect(days).toEqual([1, 3, 7, 14, 14])
  })

  it('stops at the top rather than running off the end of the ladder', () => {
    expect(nextRung('ordering', 'passed', TOP_RUNG).step).toBe(TOP_RUNG)
  })

  it('drops to the bottom on a wrong answer, however far it had climbed', () => {
    expect(nextRung('choice', 'failed', TOP_RUNG).step).toBe(0)
    expect(nextRung('ordering', 'failed', 3).step).toBe(0)
  })

  it('records what kind of evidence the answer was without letting it set the rung', () => {
    expect(nextRung('choice', 'passed', 0).confidence).toBe(3)
    expect(nextRung('ordering', 'passed', 0).confidence).toBe(4)
    // Both climbed by one, whatever they were recorded as.
    expect(nextRung('choice', 'passed', 0).step).toBe(nextRung('ordering', 'passed', 0).step)
  })
})

describe('nextRung on an open question', () => {
  it('places the question by its self grade rather than moving it up one', () => {
    expect(daysUntilDue(nextRung('open', 'passed', 0).step)).toBe(14)
    expect(daysUntilDue(nextRung('open', 'weak', 0).step)).toBe(3)
  })

  /**
   * A Weak on something answered correctly four times is real information, and
   * it should pull the question back down rather than nudge it further out.
   */
  it('pulls a question back down when the grade says so', () => {
    expect(daysUntilDue(nextRung('open', 'weak', TOP_RUNG).step)).toBe(3)
  })

  it('drops a failed self grade to the bottom', () => {
    expect(nextRung('open', 'failed', TOP_RUNG).step).toBe(0)
  })
})

describe('nextDueDate', () => {
  it('schedules the bottom rung for later the same day rather than immediately', () => {
    const due = nextDueDate(0, MONDAY_NOON)
    expect(due.getTime()).toBeGreaterThan(MONDAY_NOON.getTime())
    expect(due.getTime() - MONDAY_NOON.getTime()).toBe(4 * 60 * 60 * 1000)
  })

  it('schedules each higher rung the right number of days out', () => {
    const cases: [LadderStep, number][] = [
      [1, 1],
      [2, 3],
      [3, 7],
      [4, 14],
    ]
    for (const [step, days] of cases) {
      const due = nextDueDate(step, MONDAY_NOON)
      const expected = new Date(MONDAY_NOON)
      expected.setDate(expected.getDate() + days)
      expect(due.toISOString()).toBe(expected.toISOString())
    }
  })

  it('does not mutate the date it was given', () => {
    const from = new Date(MONDAY_NOON)
    nextDueDate(4, from)
    expect(from.toISOString()).toBe(MONDAY_NOON.toISOString())
  })

  it('crosses a month boundary correctly', () => {
    const due = nextDueDate(4, new Date('2026-08-25T09:00:00.000Z'))
    expect(due.toISOString().slice(0, 10)).toBe('2026-09-08')
  })
})
