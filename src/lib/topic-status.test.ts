import { describe, expect, it } from 'vitest'
import { summariseTopic, type AttemptRecord } from './topic-status'
import type { Result } from './interval-ladder'

let clock = 0
function attempt(questionId: string, result: Result, confidence: number): AttemptRecord {
  clock += 1000
  return { questionId, result, confidence, attemptedAt: new Date(clock) }
}

describe('summariseTopic', () => {
  it('is not started with no attempts and nothing marked learned', () => {
    const summary = summariseTopic(8, [], null)
    expect(summary.status).toBe('not_started')
    expect(summary.progress).toBe(0)
  })

  it('is learning once marked learned but before any attempt', () => {
    expect(summariseTopic(8, [], new Date()).status).toBe('learning')
  })

  it('is weak when anything recent failed, however confident the rest were', () => {
    const attempts = [
      attempt('q1', 'passed', 5),
      attempt('q2', 'passed', 5),
      attempt('q3', 'failed', 5),
    ]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('weak')
  })

  it('is weak when confidence is low even with nothing failed', () => {
    const attempts = [
      attempt('q1', 'weak', 2),
      attempt('q2', 'weak', 2),
      attempt('q3', 'passed', 3),
    ]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('weak')
  })

  it('is understood at solid but not perfect confidence', () => {
    const attempts = [
      attempt('q1', 'passed', 4),
      attempt('q2', 'passed', 4),
      attempt('q3', 'weak', 3),
    ]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('understood')
  })

  it('is mastered only when every question passes at high confidence', () => {
    const attempts = [
      attempt('q1', 'passed', 5),
      attempt('q2', 'passed', 5),
      attempt('q3', 'passed', 5),
    ]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('mastered')
  })

  it('is not mastered while some questions remain unanswered', () => {
    const attempts = [
      attempt('q1', 'passed', 5),
      attempt('q2', 'passed', 5),
      attempt('q3', 'passed', 5),
    ]
    // Eight questions in the topic, three answered.
    expect(summariseTopic(8, attempts, new Date()).status).toBe('understood')
  })

  it('lets an old failure age out of the recent window', () => {
    const attempts = [
      attempt('q1', 'failed', 1),
      attempt('q2', 'passed', 4),
      attempt('q3', 'passed', 4),
      attempt('q4', 'passed', 4),
      attempt('q5', 'passed', 4),
      attempt('q6', 'passed', 4),
    ]
    expect(summariseTopic(6, attempts, new Date()).status).toBe('understood')
  })

  it('counts only the latest attempt per question toward progress', () => {
    const attempts = [
      attempt('q1', 'failed', 1),
      attempt('q1', 'passed', 4),
      attempt('q2', 'passed', 4),
    ]
    expect(summariseTopic(4, attempts, new Date()).progress).toBe(50)
  })

  it('reports the most recent confidence, not the average', () => {
    const attempts = [attempt('q1', 'passed', 5), attempt('q2', 'weak', 2)]
    expect(summariseTopic(2, attempts, new Date()).lastConfidence).toBe(2)
  })

  it('counts every attempt, including repeats of the same question', () => {
    const attempts = [attempt('q1', 'failed', 1), attempt('q1', 'passed', 4)]
    expect(summariseTopic(2, attempts, new Date()).attempts).toBe(2)
  })

  it('does not divide by zero for a topic with no questions', () => {
    expect(summariseTopic(0, [attempt('q1', 'passed', 5)], new Date()).progress).toBe(0)
  })
})
