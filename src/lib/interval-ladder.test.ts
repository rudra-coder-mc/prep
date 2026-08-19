import { describe, expect, it } from 'vitest'
import { daysUntilDue, nextStep, type Confidence } from './interval-ladder'

describe('interval ladder', () => {
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
