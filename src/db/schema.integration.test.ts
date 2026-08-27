import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { sql } from 'drizzle-orm'
import { createTestDatabase, insertTestUser, type TestDatabase } from './testing'
import {
  attempts,
  dailyActivity,
  exerciseProgress,
  reviewSchedule,
  topicProgress,
  trackTier,
} from './schema'

let ctx: TestDatabase
let userId: string

beforeAll(async () => {
  ctx = await createTestDatabase()
  userId = await insertTestUser(ctx.db)
}, 60_000)

afterAll(async () => {
  await ctx?.drop()
})

describe('migrations', () => {
  it('creates every table from empty', async () => {
    const rows = await ctx.db.execute<{ table_name: string }>(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    )
    const names = rows.map((r) => r.table_name)
    for (const table of [
      'user',
      'session',
      'account',
      'verification',
      'track_tier',
      'topic_progress',
      'attempts',
      'review_schedule',
      'exercise_progress',
      'daily_activity',
    ]) {
      expect(names).toContain(table)
    }
  })
})

describe('track_tier', () => {
  it('allows one pick per user per track', async () => {
    await ctx.db.insert(trackTier).values({ userId, technology: 'javascript', tier: 'swe-2' })
    await expect(
      ctx.db.insert(trackTier).values({ userId, technology: 'javascript', tier: 'senior' }),
    ).rejects.toThrow()
  })

  it('allows a different pick on another track', async () => {
    await ctx.db.insert(trackTier).values({ userId, technology: 'browser', tier: 'swe-1' })
    const rows = await ctx.db.select().from(trackTier)
    expect(rows.map((r) => r.technology).sort()).toEqual(['browser', 'javascript'])
  })

  it('refuses a tier that is not one of the four interview levels', async () => {
    await expect(
      ctx.db.execute(
        sql`insert into track_tier (id, user_id, technology, tier) values ('x', ${userId}, 'javascript', 'junior')`,
      ),
    ).rejects.toThrow()
  })
})

describe('topic_progress', () => {
  it('allows one row per user per topic', async () => {
    await ctx.db.insert(topicProgress).values({ userId, topicSlug: 'javascript/closures' })
    await expect(
      ctx.db.insert(topicProgress).values({ userId, topicSlug: 'javascript/closures' }),
    ).rejects.toThrow()
  })

  it('rejects a topic belonging to no user', async () => {
    await expect(
      ctx.db.insert(topicProgress).values({ userId: 'nobody', topicSlug: 'javascript/scope' }),
    ).rejects.toThrow()
  })
})

describe('attempts', () => {
  it('keeps every attempt rather than overwriting the last one', async () => {
    const question = 'javascript/closures#q1'
    await ctx.db.insert(attempts).values([
      {
        userId,
        questionId: question,
        topicSlug: 'javascript/closures',
        result: 'failed',
        confidence: 1,
      },
      {
        userId,
        questionId: question,
        topicSlug: 'javascript/closures',
        result: 'passed',
        confidence: 4,
      },
    ])
    const rows = await ctx.db.select().from(attempts)
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.result).sort()).toEqual(['failed', 'passed'])
  })

  it('rejects a result outside the three allowed values', async () => {
    await expect(
      ctx.db.execute(
        sql`insert into attempts (id, user_id, question_id, topic_slug, result, confidence)
            values ('x', ${userId}, 'q', 't', 'excellent', 3)`,
      ),
    ).rejects.toThrow()
  })
})

describe('review_schedule', () => {
  it('holds one schedule row per user per question', async () => {
    const values = {
      userId,
      questionId: 'javascript/closures#q2',
      topicSlug: 'javascript/closures',
      dueAt: new Date(),
    }
    await ctx.db.insert(reviewSchedule).values(values)
    await expect(ctx.db.insert(reviewSchedule).values(values)).rejects.toThrow()
  })

  it('starts a question at the bottom of the ladder', async () => {
    await ctx.db.insert(reviewSchedule).values({
      userId,
      questionId: 'javascript/scope#q1',
      topicSlug: 'javascript/scope',
      dueAt: new Date(),
    })
    const [row] = await ctx.db.select().from(reviewSchedule)
    expect(row?.intervalStep).toBe(0)
  })
})

describe('exercise_progress', () => {
  it('holds one row per user per exercise', async () => {
    const values = {
      userId,
      exerciseSlug: 'javascript/closures/counter',
      topicSlug: 'javascript/closures',
    }
    await ctx.db.insert(exerciseProgress).values(values)
    await expect(ctx.db.insert(exerciseProgress).values(values)).rejects.toThrow()
  })
})

describe('daily_activity', () => {
  it('holds one row per user per day', async () => {
    await ctx.db.insert(dailyActivity).values({ userId, day: '2026-08-19', reviewed: 3 })
    await expect(
      ctx.db.insert(dailyActivity).values({ userId, day: '2026-08-19', reviewed: 1 }),
    ).rejects.toThrow()
  })

  it('defaults a new day to nothing reviewed and an uncleared queue', async () => {
    await ctx.db.insert(dailyActivity).values({ userId, day: '2026-08-20' })
    const rows = await ctx.db.select().from(dailyActivity)
    const row = rows.find((r) => r.day === '2026-08-20')
    expect(row?.reviewed).toBe(0)
    expect(row?.queueCleared).toBe(false)
  })
})
