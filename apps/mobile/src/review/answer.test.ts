import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { readActivity } from '../db/activity'
import { answerChoice, answerOrdering, revealAnswer, selfGrade } from './answer'
import type { QueuedItem } from './queue'
import { createTestDatabase } from '../../test-support/database'
import { archiveQuestion } from '../../test-support/content'

/**
 * Answering, on a device with nothing to post to.
 *
 * Grading is @prep/core's, the same functions the server runs, so what is
 * proved here is that answering writes the attempt, moves the ladder and counts
 * the day in one step, and that the one rule protecting the answer still holds
 * when the answer is already on the phone.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const stamp = { id: 'attempt-1', now: MONDAY }

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

function queued(question = archiveQuestion()): QueuedItem {
  return {
    key: `javascript/closures#${question.id}`,
    topicSlug: 'javascript/closures',
    topicTitle: 'Closures',
    technology: 'javascript',
    question,
    reason: 'due',
  }
}

const ordering = archiveQuestion({
  id: 'evaluation',
  form: 'ordering',
  options: undefined,
  correctOption: undefined,
  items: ['one', 'two', 'three', 'never'],
  correctOrder: [0, 1, 2],
})

const open = archiveQuestion({
  id: 'design',
  type: 'interview',
  form: 'open',
  options: undefined,
  correctOption: undefined,
})

async function storedAttempt() {
  const [row] = await db.all<{ answer: string; result: string; confidence: number }>(
    'select answer, result, confidence from attempts',
  )
  return row
}

describe('answering a choice question', () => {
  it('says it is right, and stores the option that was picked', async () => {
    const outcome = await answerChoice(db, queued(), 0, stamp)

    expect(outcome).toMatchObject({ correct: true, correctOption: 0, result: 'passed' })
    expect(outcome.answerInFull).toBe('It keeps the binding, so a later assignment is visible.')
    expect(await storedAttempt()).toEqual({
      answer: 'The binding',
      result: 'passed',
      confidence: 3,
    })
  })

  it('says which option was right when it was not the one picked', async () => {
    const outcome = await answerChoice(db, queued(), 1, stamp)

    expect(outcome).toMatchObject({ correct: false, correctOption: 0, result: 'failed' })
    expect(outcome.dueAt).toEqual(new Date('2026-08-24T13:00:00.000Z'))
  })

  it('counts the answer against today', async () => {
    await answerChoice(db, queued(), 0, stamp)

    expect(await readActivity(db)).toEqual([{ day: '2026-08-24', reviewed: 1, queueCleared: true }])
  })
})

describe('answering an ordering question', () => {
  it('says it is right, and stores the sequence as it reads', async () => {
    const outcome = await answerOrdering(db, queued(ordering), [0, 1, 2], 0, stamp)

    expect(outcome).toMatchObject({ correct: true, correctOrder: [0, 1, 2], result: 'passed' })
    expect(await storedAttempt()).toEqual({
      answer: 'one, two, three',
      result: 'passed',
      confidence: 4,
    })
  })

  it('is wrong when a line that never prints was placed', async () => {
    const outcome = await answerOrdering(db, queued(ordering), [0, 1, 3], 1, stamp)

    expect(outcome).toMatchObject({ correct: false, result: 'failed' })
  })
})

describe('marking yourself on an open question', () => {
  it('records the grade with nothing submitted', async () => {
    const { dueAt } = await selfGrade(db, queued(open), 'weak', 2, stamp)

    expect(dueAt).toEqual(new Date('2026-08-27T09:00:00.000Z'))
    expect(await storedAttempt()).toEqual({ answer: '', result: 'weak', confidence: 3 })
  })

  it('refuses a question the platform grades itself', async () => {
    await expect(selfGrade(db, queued(), 'passed', 0, stamp)).rejects.toThrow(
      /graded by the platform/,
    )
  })
})

describe('revealing the answer', () => {
  it('gives an open question up, which is how that form is answered at all', () => {
    expect(revealAnswer(queued(open)).answerInFull).toBe(open.answerInFull)
  })

  it('refuses a choice question, whose answer names the correct option', () => {
    expect(() => revealAnswer(queued())).toThrow(/correct option/)
  })

  it('refuses an ordering question, whose answer names the sequence', () => {
    expect(() => revealAnswer(queued(ordering))).toThrow(/correct sequence/)
  })
})
