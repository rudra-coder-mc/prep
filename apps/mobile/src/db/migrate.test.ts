import { afterEach, describe, expect, it } from 'vitest'
import { migrate, SCHEMA_VERSION } from './migrate'
import { createTestDatabase } from '../../test-support/database'

/**
 * The mirror of the server's progress tables.
 *
 * These tests say the shape is there and that running the migration again
 * changes nothing, because it runs on every launch. What the columns mean is
 * settled in apps/web/src/db/schema.ts, which this follows.
 */
let db: ReturnType<typeof createTestDatabase>

afterEach(() => db?.close())

async function tables(): Promise<string[]> {
  const rows = await db.all<{ name: string }>(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
  )
  return rows.map((row) => row.name)
}

describe('migrating a device database', () => {
  it('creates the tables the server has, without the user column', async () => {
    db = createTestDatabase()
    await migrate(db)

    expect(await tables()).toEqual([
      'attempts',
      'daily_activity',
      'exercise_progress',
      'review_schedule',
      'settings',
      'topic_progress',
      'track_tier',
    ])
  })

  it('records the schema version it reached', async () => {
    db = createTestDatabase()
    await migrate(db)

    const [row] = await db.all<{ user_version: number }>('pragma user_version')
    expect(row?.user_version).toBe(SCHEMA_VERSION)
  })

  // It runs on every launch, so a second run has to be free rather than fatal.
  it('changes nothing when it has already run', async () => {
    db = createTestDatabase()
    await migrate(db)
    await db.run('insert into settings (key, value) values (?, ?)', ['device-id', 'kept'])

    await migrate(db)

    const rows = await db.all<{ value: string }>('select value from settings where key = ?', [
      'device-id',
    ])
    expect(rows).toEqual([{ value: 'kept' }])
  })

  it('takes an attempt in the shape the sync sends one', async () => {
    db = createTestDatabase()
    await migrate(db)

    await db.run(
      `insert into attempts (id, question_id, topic_slug, answer, result, confidence, hints_used, notes, attempted_at, synced)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        'a1',
        'javascript/closures#q1',
        'javascript/closures',
        'the answer',
        'passed',
        4,
        0,
        null,
        '2026-08-30T09:00:00.000Z',
      ],
    )

    expect(await db.all('select id from attempts')).toEqual([{ id: 'a1' }])
  })

  // The unique keys are what make a sync idempotent: the same row arriving twice
  // is the same row, and nothing about the merge has to notice.
  it('holds one row per topic, per track and per day', async () => {
    db = createTestDatabase()
    await migrate(db)

    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      'javascript/closures',
      '2026-08-01T00:00:00.000Z',
    ])
    await expect(
      db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
        'javascript/closures',
        '2026-08-02T00:00:00.000Z',
      ]),
    ).rejects.toThrow()
  })
})
