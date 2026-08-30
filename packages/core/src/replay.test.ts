import { describe, expect, it } from 'vitest'
import { nextDueDate, nextRung, TOP_RUNG } from './interval-ladder'
import { replaySchedule, type ReplayedAttempt } from './replay'

const MONDAY_NOON = new Date('2026-08-17T12:00:00.000Z')

function at(hoursLater: number): Date {
  return new Date(MONDAY_NOON.getTime() + hoursLater * 60 * 60 * 1000)
}

function passed(hoursLater: number): ReplayedAttempt {
  return { result: 'passed', attemptedAt: at(hoursLater) }
}

describe('replaySchedule', () => {
  it('says nothing about a question with no history', () => {
    expect(replaySchedule('choice', [])).toBeNull()
  })

  it('lands one answer exactly where recording it live would have', () => {
    const live = nextRung('choice', 'passed', 0)

    const replayed = replaySchedule('choice', [passed(0)])

    expect(replayed).toEqual({
      step: live.step,
      lastResult: 'passed',
      dueAt: nextDueDate(live.step, MONDAY_NOON),
      updatedAt: MONDAY_NOON,
    })
  })

  it('folds a run of right answers up the ladder one rung at a time', () => {
    const replayed = replaySchedule('choice', [passed(0), passed(24), passed(48)])

    expect(replayed?.step).toBe(3)
  })

  it('stops at the top rung however long the run is', () => {
    const attempts = [0, 1, 2, 3, 4, 5, 6].map((hour) => passed(hour))

    expect(replaySchedule('ordering', attempts)?.step).toBe(TOP_RUNG)
  })

  it('drops to the bottom on the last wrong answer, whatever came before it', () => {
    const replayed = replaySchedule('choice', [
      passed(0),
      passed(24),
      { result: 'failed', attemptedAt: at(48) },
    ])

    expect(replayed?.step).toBe(0)
    expect(replayed?.lastResult).toBe('failed')
  })

  /**
   * The device and the server both sort before folding, so an exchange that
   * delivers a session out of order still reaches the same rung.
   */
  it('folds in time order rather than the order it was handed', () => {
    const inOrder = replaySchedule('choice', [passed(0), passed(24), passed(48)])
    const shuffled = replaySchedule('choice', [passed(48), passed(0), passed(24)])

    expect(shuffled).toEqual(inOrder)
  })

  it('dates the next review from the last attempt rather than from now', () => {
    const replayed = replaySchedule('open', [{ result: 'passed', attemptedAt: at(72) }])

    expect(replayed?.dueAt).toEqual(nextDueDate(TOP_RUNG, at(72)))
  })

  it('places an open question by its last self grade rather than climbing', () => {
    const replayed = replaySchedule('open', [
      { result: 'passed', attemptedAt: at(0) },
      { result: 'weak', attemptedAt: at(24) },
    ])

    expect(replayed?.step).toBe(nextRung('open', 'weak', TOP_RUNG).step)
  })
})
