import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { recordAttempt } from './attempts'
import { readActivity } from './activity'
import { migrate } from './migrate'
import { readSchedule } from './schedule'
import type { Database } from './sqlite'
import { createTestDatabase } from '../../test-support/database'

/**
 * Writing an answer down, which on this device is the whole of what answering
 * does: there is nothing to post to, so the attempt waits in SQLite for a sync.
 *
 * The rung it lands on is @prep/core's, so what this proves is that the phone
 * asks that function the same question the server asks it and stores the answer
 * in the same three places.
 */
let db: ReturnType<typeof createTestDatabase>

const TOPIC = 'javascript/closures'
const MONDAY = new Date('2026-08-24T09:00:00.000Z')

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

const answer = (overrides: Partial<Parameters<typeof recordAttempt>[1]> = {}) =>
  recordAttempt(
    db,
    {
      topicSlug: TOPIC,
      questionId: 'scope',
      answer: 'The inner function keeps the binding',
      result: 'passed',
      form: 'choice',
      hintsUsed: 0,
      ...overrides,
    },
    { id: 'attempt-1', now: MONDAY },
  )

async function attemptRows() {
  return db.all<Record<string, unknown>>('select * from attempts')
}

describe('recording an attempt', () => {
  it('stores it against the question key both surfaces use', async () => {
    await answer()

    expect(await attemptRows()).toEqual([
      {
        id: 'attempt-1',
        question_id: 'javascript/closures#scope',
        topic_slug: TOPIC,
        answer: 'The inner function keeps the binding',
        result: 'passed',
        confidence: 3,
        hints_used: 0,
        notes: null,
        attempted_at: MONDAY.toISOString(),
        synced: 0,
      },
    ])
  })

  it('leaves it unsynced, which is the whole of what a sync has to find', async () => {
    await answer()

    const [row] = await db.all<{ synced: number }>('select synced from attempts')
    expect(row?.synced).toBe(0)
  })

  it('moves the question up one rung and says when it is next due', async () => {
    const { step, dueAt } = await answer()

    expect(step).toBe(1)
    expect(dueAt).toEqual(new Date('2026-08-25T09:00:00.000Z'))

    expect(await readSchedule(db)).toEqual([
      {
        questionId: 'javascript/closures#scope',
        topicSlug: TOPIC,
        dueAt: new Date('2026-08-25T09:00:00.000Z'),
        intervalStep: 1,
        lastResult: 'passed',
      },
    ])
  })

  it('climbs from wherever the question already sits rather than from the bottom', async () => {
    await db.run(
      `insert into review_schedule (question_id, topic_slug, due_at, interval_step, last_result, updated_at)
       values (?, ?, ?, 2, 'passed', ?)`,
      ['javascript/closures#scope', TOPIC, MONDAY.toISOString(), MONDAY.toISOString()],
    )

    const { step, dueAt } = await answer()

    expect(step).toBe(3)
    expect(dueAt).toEqual(new Date('2026-08-31T09:00:00.000Z'))
  })

  it('sends a wrong answer to the bottom however long it had been climbing', async () => {
    await db.run(
      `insert into review_schedule (question_id, topic_slug, due_at, interval_step, last_result, updated_at)
       values (?, ?, ?, 4, 'passed', ?)`,
      ['javascript/closures#scope', TOPIC, MONDAY.toISOString(), MONDAY.toISOString()],
    )

    const { step, dueAt } = await answer({ result: 'failed' })

    expect(step).toBe(0)
    expect(dueAt).toEqual(new Date('2026-08-24T13:00:00.000Z'))
  })

  it('records an open question at the rung its self grade buys', async () => {
    const { step } = await answer({ form: 'open', result: 'weak', answer: '', hintsUsed: 2 })

    expect(step).toBe(2)
    const [row] = await db.all<{ confidence: number; hints_used: number }>(
      'select confidence, hints_used from attempts',
    )
    expect(row).toEqual({ confidence: 3, hints_used: 2 })
  })

  it('marks the topic reviewed without disturbing when it was learned', async () => {
    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      TOPIC,
      '2026-08-01T00:00:00.000Z',
    ])

    await answer()

    expect(await db.all('select * from topic_progress')).toEqual([
      {
        topic_slug: TOPIC,
        learned_at: '2026-08-01T00:00:00.000Z',
        last_reviewed_at: MONDAY.toISOString(),
      },
    ])
  })

  it('marks a topic reviewed that was never marked learned', async () => {
    await answer()

    expect(await db.all('select * from topic_progress')).toEqual([
      { topic_slug: TOPIC, learned_at: null, last_reviewed_at: MONDAY.toISOString() },
    ])
  })

  it('counts the answer against today in the same breath', async () => {
    // The only question on the ladder is the one just answered, and answering
    // it moved it to tomorrow, so the day is now clear.
    const { queueCleared } = await answer()

    expect(queueCleared).toBe(true)
    expect(await readActivity(db)).toEqual([{ day: '2026-08-24', reviewed: 1, queueCleared: true }])
  })

  /**
   * The screen offers the question again when this throws, so a write that
   * failed halfway would be answered twice and counted twice. There is nobody
   * here to repair that: the device is the only copy until a sync runs.
   */
  it('writes all of it or none of it', async () => {
    const failing: Database = {
      ...db,
      async run(sql, params) {
        if (sql.includes('daily_activity')) throw new Error('the disk is full')
        return db.run(sql, params)
      },
    }

    await expect(
      recordAttempt(
        failing,
        {
          topicSlug: TOPIC,
          questionId: 'scope',
          answer: '',
          result: 'passed',
          form: 'choice',
          hintsUsed: 0,
        },
        { id: 'attempt-1', now: MONDAY },
      ),
    ).rejects.toThrow('the disk is full')

    expect(await attemptRows()).toEqual([])
    expect(await readSchedule(db)).toEqual([])
    expect(await db.all('select * from topic_progress')).toEqual([])
  })

  it('keeps every answer, so the history of a question stays readable', async () => {
    await answer()
    await recordAttempt(
      db,
      {
        topicSlug: TOPIC,
        questionId: 'scope',
        answer: '',
        result: 'failed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'attempt-2', now: new Date('2026-08-26T09:00:00.000Z') },
    )

    expect(await attemptRows()).toHaveLength(2)
  })
})
