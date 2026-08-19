import { describe, expect, it } from 'vitest'
import {
  daysUntilDue,
  isConfidence,
  nextDueDate,
  nextStep,
  type Confidence,
  type LadderStep,
} from './interval-ladder'

const MONDAY_NOON = new Date('2026-08-17T12:00:00.000Z')

describe('nextStep', () => {
  it('maps each confidence level to its rung', () => {
    const expected = [0, 1, 3, 7, 14]
    for (let c = 1; c <= 5; c++) {
      expect(daysUntilDue(nextStep('passed', c as Confidence))).toBe(expected[c - 1])
    }
  })

  it('drops a failed answer to the bottom even at full confidence', () => {
    expect(nextStep('failed', 5)).toBe(0)
    expect(daysUntilDue(nextStep('failed', 5))).toBe(0)
  })

  it('treats a weak result by its confidence rating', () => {
    expect(daysUntilDue(nextStep('weak', 2))).toBe(1)
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

describe('isConfidence', () => {
  it('accepts only the five ratings', () => {
    expect([1, 2, 3, 4, 5].every(isConfidence)).toBe(true)
    expect([0, 6, 2.5, -1].some(isConfidence)).toBe(false)
  })
})
