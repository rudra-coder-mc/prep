import { describe, expect, it } from 'vitest'
import { summariseTopic, type AttemptRecord } from './topic-status'
import type { Result } from './interval-ladder'

let clock = 0
function attempt(questionId: string, result: Result): AttemptRecord {
  clock += 1000
  return { questionId, result, attemptedAt: new Date(clock) }
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

  it('is weak when anything recent failed, however well the rest went', () => {
    const attempts = [attempt('q1', 'passed'), attempt('q2', 'passed'), attempt('q3', 'failed')]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('weak')
  })

  it('is weak when half of what is recent was only marked weak', () => {
    const attempts = [attempt('q1', 'weak'), attempt('q2', 'weak'), attempt('q3', 'passed')]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('weak')
  })

  it('is still learning while anything recent was only marked weak', () => {
    const attempts = [attempt('q1', 'passed'), attempt('q2', 'passed'), attempt('q3', 'weak')]
    expect(summariseTopic(4, attempts, new Date()).status).toBe('learning')
  })

  it('is mastered only when every question in the topic is passing', () => {
    const attempts = [attempt('q1', 'passed'), attempt('q2', 'passed'), attempt('q3', 'passed')]
    expect(summariseTopic(3, attempts, new Date()).status).toBe('mastered')
  })

  it('is not mastered while some questions remain unanswered', () => {
    const attempts = [attempt('q1', 'passed'), attempt('q2', 'passed'), attempt('q3', 'passed')]
    // Eight questions in the topic, three answered, so most of it is untouched.
    expect(summariseTopic(8, attempts, new Date()).status).toBe('learning')
  })

  it('lets an old failure age out of the recent window', () => {
    const attempts = [
      attempt('q1', 'failed'),
      attempt('q2', 'passed'),
      attempt('q3', 'passed'),
      attempt('q4', 'passed'),
      attempt('q5', 'passed'),
      attempt('q6', 'passed'),
    ]
    expect(summariseTopic(6, attempts, new Date()).status).toBe('understood')
  })

  it('counts only the latest attempt per question toward progress', () => {
    const attempts = [attempt('q1', 'failed'), attempt('q1', 'passed'), attempt('q2', 'passed')]
    expect(summariseTopic(4, attempts, new Date()).progress).toBe(50)
  })

  it('counts every attempt, including repeats of the same question', () => {
    const attempts = [attempt('q1', 'failed'), attempt('q1', 'passed')]
    expect(summariseTopic(2, attempts, new Date()).attempts).toBe(2)
  })

  it('does not divide by zero for a topic with no questions', () => {
    expect(summariseTopic(0, [attempt('q1', 'passed')], new Date()).progress).toBe(0)
  })
})
