import { describe, expect, it } from 'vitest'
import { nextTier, READY_STEP, summariseReadiness } from './readiness'

/** Where each named question sits on the ladder. Anything absent is unscheduled. */
function bank(steps: Record<string, number>) {
  return new Map(Object.entries(steps))
}

const QUESTIONS = ['q1', 'q2', 'q3', 'q4']

describe('summariseReadiness', () => {
  it('counts a question once its schedule has reached the ready rung', () => {
    const readiness = summariseReadiness('swe-1', QUESTIONS, bank({ q1: READY_STEP, q2: 4 }))

    expect(readiness.retained).toBe(2)
    expect(readiness.total).toBe(4)
    expect(readiness.percent).toBe(50)
  })

  it('does not count a question one rung short of it', () => {
    const readiness = summariseReadiness('swe-1', QUESTIONS, bank({ q1: READY_STEP - 1 }))

    expect(readiness.retained).toBe(0)
    expect(readiness.percent).toBe(0)
  })

  it('counts every question the tier covers, not only the ones enrolled', () => {
    // Two of the four have never been scheduled, so they are absent from the
    // ladder entirely. Readiness is a claim about the tier, so they still count
    // against it.
    const readiness = summariseReadiness('swe-1', QUESTIONS, bank({ q1: 4, q2: 4 }))

    expect(readiness.total).toBe(4)
    expect(readiness.percent).toBe(50)
  })

  it('offers the next tier once every question the tier covers is retained', () => {
    const all = bank({ q1: 4, q2: 4, q3: 3, q4: 3 })
    expect(summariseReadiness('swe-1', QUESTIONS, all).stepUpTo).toBe('swe-2')
  })

  it('offers nothing while one question is still short', () => {
    const nearly = bank({ q1: 4, q2: 4, q3: 3, q4: 2 })
    expect(summariseReadiness('swe-1', QUESTIONS, nearly).stepUpTo).toBeNull()
  })

  it('carries how many questions accepting the offer would enrol', () => {
    const all = bank({ q1: 4, q2: 4, q3: 3, q4: 3 })
    expect(summariseReadiness('swe-1', QUESTIONS, all, 8).stepUpAdds).toBe(8)
  })

  it('has nothing to add while the tier is unfinished', () => {
    const nearly = bank({ q1: 4, q2: 4, q3: 3, q4: 2 })
    expect(summariseReadiness('swe-1', QUESTIONS, nearly, 8).stepUpAdds).toBe(0)
  })

  it('offers nothing at the top of the path, however ready it is', () => {
    const all = bank({ q1: 4, q2: 4, q3: 4, q4: 4 })
    expect(summariseReadiness('staff', QUESTIONS, all).stepUpTo).toBeNull()
  })

  it('is zero rather than complete when the tier covers no questions', () => {
    const readiness = summariseReadiness('staff', [], new Map())

    expect(readiness.percent).toBe(0)
    expect(readiness.stepUpTo).toBeNull()
  })
})

describe('nextTier', () => {
  it('climbs one level at a time', () => {
    expect(nextTier('swe-1')).toBe('swe-2')
    expect(nextTier('swe-2')).toBe('senior')
    expect(nextTier('senior')).toBe('staff')
  })

  it('stops at the top', () => {
    expect(nextTier('staff')).toBeNull()
  })
})
