import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readExerciseProgress, readTopicExercises, setExerciseStatus } from './exercises'
import { migrate } from './migrate'
import { createTestDatabase } from '../../test-support/database'

/**
 * How far along each exercise is, on the device.
 *
 * Nothing derives this, so what is stored is the whole of what a sync can carry
 * and the whole of what a screen can show. The rules mirror
 * apps/web/src/lib/exercises.ts, and the one worth a test of its own is that an
 * empty note becomes null on both sides, or two surfaces holding the same
 * nothing would disagree about it.
 */
let db: ReturnType<typeof createTestDatabase>

const TOPIC = 'javascript/closures'
const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

describe('recording how an exercise went', () => {
  it('stores it against the key both surfaces name it by', async () => {
    await setExerciseStatus(
      db,
      { topicSlug: TOPIC, exerciseId: 'counter', status: 'completed', notes: 'two goes' },
      MONDAY,
    )

    expect(await readExerciseProgress(db)).toEqual([
      {
        exerciseSlug: 'javascript/closures/counter',
        topicSlug: TOPIC,
        status: 'completed',
        notes: 'two goes',
        completedAt: MONDAY,
        updatedAt: MONDAY,
      },
    ])
  })

  it('stores an empty note as nothing rather than as an empty string', async () => {
    await setExerciseStatus(
      db,
      { topicSlug: TOPIC, exerciseId: 'counter', status: 'in_progress', notes: '' },
      MONDAY,
    )

    const [row] = await readExerciseProgress(db)
    expect(row?.notes).toBeNull()
    expect(row?.completedAt).toBeNull()
  })

  it('replaces the row rather than adding a second one when it is done again', async () => {
    await setExerciseStatus(
      db,
      { topicSlug: TOPIC, exerciseId: 'counter', status: 'completed', notes: 'done' },
      MONDAY,
    )
    await setExerciseStatus(
      db,
      { topicSlug: TOPIC, exerciseId: 'counter', status: 'in_progress', notes: 'reopened' },
      TUESDAY,
    )

    const rows = await readExerciseProgress(db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      status: 'in_progress',
      notes: 'reopened',
      // Reopening clears the completion, so nothing counts it as finished.
      completedAt: null,
      updatedAt: TUESDAY,
    })
  })
})

describe('reading one topic back', () => {
  it('keys the rows by the slug the screen looks them up by, and leaves other topics out', async () => {
    await setExerciseStatus(
      db,
      { topicSlug: TOPIC, exerciseId: 'counter', status: 'completed', notes: '' },
      MONDAY,
    )
    await setExerciseStatus(
      db,
      { topicSlug: 'javascript/promises', exerciseId: 'retry', status: 'completed', notes: '' },
      MONDAY,
    )

    const held = await readTopicExercises(db, TOPIC)

    expect([...held.keys()]).toEqual(['javascript/closures/counter'])
    expect(held.get('javascript/closures/counter')?.status).toBe('completed')
  })

  it('is empty for a topic nothing has been recorded against', async () => {
    expect(await readTopicExercises(db, TOPIC)).toEqual(new Map())
  })
})
