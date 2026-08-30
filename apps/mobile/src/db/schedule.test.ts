import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrate'
import { enrol, readSchedule } from './schedule'
import { createTestDatabase } from '../../test-support/database'

/**
 * The ladder rows the queue is built from, written and read on the device.
 *
 * Enrolment is the server's `enrol` with the user column dropped, and it has to
 * behave the same way in the one case that matters: a question already on the
 * ladder is left exactly where it is, whatever else is being enrolled around it.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

const question = (id: string) => ({
  questionId: `javascript/closures#${id}`,
  topicSlug: 'javascript/closures',
})

describe('reading the schedule', () => {
  it('is empty before anything is enrolled', async () => {
    expect(await readSchedule(db)).toEqual([])
  })

  it('hands back dates rather than the strings SQLite stores', async () => {
    await enrol(db, [question('scope')], MONDAY)

    expect(await readSchedule(db)).toEqual([
      {
        questionId: 'javascript/closures#scope',
        topicSlug: 'javascript/closures',
        dueAt: MONDAY,
        intervalStep: 0,
        lastResult: null,
      },
    ])
  })
})

describe('enrolling a topic', () => {
  it('puts every question on the bottom rung, due immediately', async () => {
    await enrol(db, [question('scope'), question('capture')], MONDAY)

    const schedule = await readSchedule(db)

    expect(schedule).toHaveLength(2)
    expect(schedule.map((row) => row.intervalStep)).toEqual([0, 0])
    expect(schedule.map((row) => row.dueAt)).toEqual([MONDAY, MONDAY])
  })

  it('leaves a question that is already climbing exactly where it is', async () => {
    await db.run(
      `insert into review_schedule (question_id, topic_slug, due_at, interval_step, last_result, updated_at)
       values (?, ?, ?, 3, 'passed', ?)`,
      [
        'javascript/closures#scope',
        'javascript/closures',
        '2026-09-01T09:00:00.000Z',
        MONDAY.toISOString(),
      ],
    )

    await enrol(db, [question('scope'), question('capture')], TUESDAY)

    const schedule = await readSchedule(db)
    const climbing = schedule.find((row) => row.questionId === 'javascript/closures#scope')
    const fresh = schedule.find((row) => row.questionId === 'javascript/closures#capture')

    expect(climbing).toMatchObject({ intervalStep: 3, lastResult: 'passed' })
    expect(climbing?.dueAt).toEqual(new Date('2026-09-01T09:00:00.000Z'))
    expect(fresh).toMatchObject({ intervalStep: 0, lastResult: null })
  })

  it('writes nothing when there is nothing to enrol', async () => {
    await enrol(db, [], MONDAY)
    expect(await readSchedule(db)).toEqual([])
  })
})
