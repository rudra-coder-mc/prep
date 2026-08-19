import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestDatabase, insertTestUser, type TestDatabase } from '@/db/testing'
import { dailyActivity } from '@/db/schema'
import { currentStreak, longestStreak, type ActivityDay } from '@/lib/day'

let ctx: TestDatabase
let userId: string

beforeAll(async () => {
  ctx = await createTestDatabase()
  userId = await insertTestUser(ctx.db)
}, 60_000)

afterAll(async () => {
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(dailyActivity)
})

async function read(): Promise<ActivityDay[]> {
  return ctx.db
    .select({
      day: dailyActivity.day,
      reviewed: dailyActivity.reviewed,
      queueCleared: dailyActivity.queueCleared,
    })
    .from(dailyActivity)
}

describe('daily activity', () => {
  it('stores the day as a plain date, matching what the streak logic expects', async () => {
    await ctx.db.insert(dailyActivity).values({ userId, day: '2026-08-19', reviewed: 2 })
    const rows = await read()
    expect(rows[0]?.day).toBe('2026-08-19')
  })

  it('accumulates reviews within a day rather than creating a second row', async () => {
    await ctx.db.insert(dailyActivity).values({ userId, day: '2026-08-19', reviewed: 1 })
    await ctx.db
      .insert(dailyActivity)
      .values({ userId, day: '2026-08-19', reviewed: 1 })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set: { reviewed: 2, queueCleared: true },
      })

    const rows = await read()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.reviewed).toBe(2)
    expect(rows[0]?.queueCleared).toBe(true)
  })

  it('derives a streak from the stored rows without any counter', async () => {
    await ctx.db.insert(dailyActivity).values([
      { userId, day: '2026-08-17', reviewed: 5, queueCleared: true },
      { userId, day: '2026-08-18', reviewed: 3, queueCleared: true },
      { userId, day: '2026-08-19', reviewed: 1, queueCleared: false },
    ])

    const activity = await read()
    expect(currentStreak(activity, '2026-08-19')).toBe(3)
    expect(longestStreak(activity)).toBe(3)
  })

  it('shows a broken streak as broken', async () => {
    await ctx.db.insert(dailyActivity).values([
      { userId, day: '2026-08-15', reviewed: 5, queueCleared: true },
      { userId, day: '2026-08-19', reviewed: 5, queueCleared: true },
    ])

    const activity = await read()
    expect(currentStreak(activity, '2026-08-19')).toBe(1)
    expect(longestStreak(activity)).toBe(1)
  })
})
