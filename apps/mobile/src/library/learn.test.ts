import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { readLearnedTopics } from '../db/progress'
import { readSchedule } from '../db/schedule'
import { enrolLearnedTopics, markTopicLearned } from './learn'
import { createTestDatabase } from '../../test-support/database'
import { archiveContent, archiveQuestion, archiveTopic } from '../../test-support/content'

/**
 * Marking a topic learned, which is the act that enrols its questions.
 *
 * It is the same rule as the server's: only the questions at or below the
 * track's tier, because being asked a staff question while preparing for the
 * SWE-1 screen teaches nothing. See
 * docs/decisions/0028-tiers-are-interview-levels.md.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')

const content = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-2' }),
      archiveQuestion({ id: 'realms', tier: 'staff' }),
    ],
  }),
  archiveTopic({
    technology: 'browser',
    directory: 'events',
    questions: [archiveQuestion({ id: 'bubbling', tier: 'swe-2' })],
  }),
])

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

describe('marking a topic learned', () => {
  it('enrols the questions the tier covers and no others', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-2', MONDAY)

    const schedule = await readSchedule(db)
    expect(schedule.map((row) => row.questionId).sort()).toEqual([
      'javascript/closures#capture',
      'javascript/closures#scope',
    ])
    expect(schedule.every((row) => row.intervalStep === 0)).toBe(true)
  })

  it('records when it was read', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)

    expect(await readLearnedTopics(db)).toEqual(new Map([['javascript/closures', MONDAY]]))
  })

  it('is free to do again: the mark moves, the ladder does not', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await db.run('update review_schedule set interval_step = 3, due_at = ? where question_id = ?', [
      '2026-09-10T09:00:00.000Z',
      'javascript/closures#scope',
    ])

    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', TUESDAY)

    expect(await readLearnedTopics(db)).toEqual(new Map([['javascript/closures', TUESDAY]]))
    expect((await readSchedule(db))[0]).toMatchObject({ intervalStep: 3 })
  })

  it('brings the newly in-scope questions in when the tier has moved up', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await markTopicLearned(db, content, 'javascript/closures', 'staff', TUESDAY)

    expect(await readSchedule(db)).toHaveLength(3)
  })

  it('refuses a topic this device holds no copy of', async () => {
    await expect(
      markTopicLearned(db, content, 'javascript/generators', 'swe-1', MONDAY),
    ).rejects.toThrow(/no copy/)
  })
})

/**
 * The second way a question is enrolled: the tier moved rather than the topic
 * being read. A pick made on the laptop arrives here through a sync, so this is
 * what stops it applying only to whatever is learned after it.
 */
describe('bringing what is learned up to a tier', () => {
  it('enrols the questions the new tier covers on that track alone', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await markTopicLearned(db, content, 'browser/events', 'swe-2', MONDAY)

    await enrolLearnedTopics(db, content, 'javascript', 'swe-2', TUESDAY)

    expect((await readSchedule(db)).map((row) => row.questionId).sort()).toEqual([
      'browser/events#bubbling',
      'javascript/closures#capture',
      'javascript/closures#scope',
    ])
  })

  it('leaves a topic that was never read alone', async () => {
    await enrolLearnedTopics(db, content, 'javascript', 'staff', TUESDAY)

    expect(await readSchedule(db)).toEqual([])
  })

  // A question already on the ladder is something you have started remembering,
  // and a change of plan is not a reason to throw that away.
  it('removes nothing when the tier steps down', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'staff', MONDAY)

    await enrolLearnedTopics(db, content, 'javascript', 'swe-1', TUESDAY)

    expect(await readSchedule(db)).toHaveLength(3)
  })
})
