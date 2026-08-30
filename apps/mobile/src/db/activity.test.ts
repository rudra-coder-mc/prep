import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrate'
import { readActivity, recordReview } from './activity'
import { createTestDatabase } from '../../test-support/database'

/**
 * The day counter the streak is read from.
 *
 * It is written here rather than left for a sync, because a phone answering
 * offline for a week is exactly the case a streak has to survive, and a day
 * nobody counted at the time cannot be recovered from anything but the attempts.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

async function schedule(questionId: string, dueAt: string) {
  await db.run(
    `insert into review_schedule (question_id, topic_slug, due_at, interval_step, updated_at)
     values (?, 'javascript/closures', ?, 0, ?)`,
    [questionId, dueAt, MONDAY.toISOString()],
  )
}

describe('counting a review against today', () => {
  it('starts the day at one', async () => {
    await recordReview(db, MONDAY)

    expect(await readActivity(db)).toEqual([{ day: '2026-08-24', reviewed: 1, queueCleared: true }])
  })

  it('adds to a day already started rather than replacing it', async () => {
    await recordReview(db, MONDAY)
    await recordReview(db, new Date('2026-08-24T18:00:00.000Z'))

    expect(await readActivity(db)).toEqual([{ day: '2026-08-24', reviewed: 2, queueCleared: true }])
  })

  it('says the queue is not cleared while something is still due', async () => {
    await schedule('javascript/closures#scope', '2026-08-24T09:00:00.000Z')

    const { cleared } = await recordReview(db, MONDAY)

    expect(cleared).toBe(false)
    expect(await readActivity(db)).toEqual([
      { day: '2026-08-24', reviewed: 1, queueCleared: false },
    ])
  })

  it('says it is cleared once everything left is due another day', async () => {
    await schedule('javascript/closures#scope', '2027-01-01T09:00:00.000Z')

    const { cleared } = await recordReview(db, MONDAY)

    expect(cleared).toBe(true)
  })

  it('leaves a day already recorded as cleared alone when a later day is not', async () => {
    await recordReview(db, MONDAY)
    await schedule('javascript/closures#scope', '2026-08-25T09:00:00.000Z')
    await recordReview(db, new Date('2026-08-25T09:00:00.000Z'))

    expect(await readActivity(db)).toEqual([
      { day: '2026-08-24', reviewed: 1, queueCleared: true },
      { day: '2026-08-25', reviewed: 1, queueCleared: false },
    ])
  })
})
