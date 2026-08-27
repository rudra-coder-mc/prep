import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { reviewSchedule, topicProgress, trackTier } from '@/db/schema'
import {
  createTestDatabase,
  insertTestUser,
  useTestDatabase,
  type TestDatabase,
} from '@/db/testing'
import { getTopic } from '@/content/loader'
import { questionKey, type Tier } from '@/content/schema'
import { markTopicLearned, pickTrackTier } from '@/lib/progress'
import { questionsUpTo } from '@/lib/tiers'

/**
 * Enrolment is the one place the picked tier changes what the platform does, so
 * these run the real module against a real database rather than restating its
 * SQL. Nothing here names a question or a count from `content/`: the bank grows
 * every week, and a test that pins its size fails on authoring rather than on a
 * defect.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let userId: string

const TECHNOLOGY = 'javascript'
const DIRECTORY = 'closures'
const SLUG = `${TECHNOLOGY}/${DIRECTORY}`

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)
  userId = await insertTestUser(ctx.db)
}, 60_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(reviewSchedule)
  await ctx.db.delete(topicProgress)
  await ctx.db.delete(trackTier)
})

async function scheduledIds(): Promise<string[]> {
  const rows = await ctx.db
    .select({ questionId: reviewSchedule.questionId })
    .from(reviewSchedule)
    .where(eq(reviewSchedule.userId, userId))

  return rows.map((row) => row.questionId).sort()
}

/** What the tier covers, read from the content the topic actually holds. */
async function inScopeIds(tier: Tier, directory = DIRECTORY): Promise<string[]> {
  const topic = await getTopic(TECHNOLOGY, directory)
  if (!topic) throw new Error(`missing test fixture: ${TECHNOLOGY}/${directory}`)

  return questionsUpTo(topic.questions, tier)
    .map((question) => questionKey(topic.slug, question.id))
    .sort()
}

describe('markTopicLearned', () => {
  it('enrols the questions the default tier covers and nothing above them', async () => {
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)

    expect(await scheduledIds()).toEqual(await inScopeIds('swe-1'))
  })

  it('enrols the tiers below the pick as well, since a tier is cumulative', async () => {
    await pickTrackTier(userId, TECHNOLOGY, 'swe-2')
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)

    const enrolled = await scheduledIds()
    expect(enrolled).toEqual(await inScopeIds('swe-2'))
    expect(enrolled.length).toBeGreaterThan((await inScopeIds('swe-1')).length)
  })

  it('reads the tier of the track the topic belongs to, not of another one', async () => {
    await pickTrackTier(userId, 'browser', 'staff')
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)

    expect(await scheduledIds()).toEqual(await inScopeIds('swe-1'))
  })

  it('leaves a question already in rotation where it is', async () => {
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)
    const first = (await inScopeIds('swe-1'))[0]
    if (!first) throw new Error(`${SLUG} has no SWE-1 question to schedule`)
    const dueAt = new Date('2030-01-01T00:00:00Z')

    await ctx.db
      .update(reviewSchedule)
      .set({ intervalStep: 4, dueAt })
      .where(eq(reviewSchedule.questionId, first))

    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)

    const [row] = await ctx.db
      .select()
      .from(reviewSchedule)
      .where(eq(reviewSchedule.questionId, first))

    expect(row?.intervalStep).toBe(4)
    expect(row?.dueAt).toEqual(dueAt)
  })
})

describe('pickTrackTier', () => {
  it('brings an already learned topic up to a higher pick', async () => {
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)
    await pickTrackTier(userId, TECHNOLOGY, 'senior')

    expect(await scheduledIds()).toEqual(await inScopeIds('senior'))
  })

  it('puts the newly in-scope questions on the bottom rung and moves nothing else', async () => {
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)
    const alreadyOnTheLadder = await inScopeIds('swe-1')
    const dueAt = new Date('2030-01-01T00:00:00Z')

    await ctx.db.update(reviewSchedule).set({ intervalStep: 3, dueAt })

    await pickTrackTier(userId, TECHNOLOGY, 'swe-2')

    const rows = await ctx.db.select().from(reviewSchedule).where(eq(reviewSchedule.userId, userId))
    const untouched = rows.filter((row) => alreadyOnTheLadder.includes(row.questionId))
    const arrived = rows.filter((row) => !alreadyOnTheLadder.includes(row.questionId))

    expect(untouched.every((row) => row.intervalStep === 3)).toBe(true)
    expect(untouched.every((row) => row.dueAt.getTime() === dueAt.getTime())).toBe(true)
    expect(arrived.length).toBeGreaterThan(0)
    expect(arrived.every((row) => row.intervalStep === 0)).toBe(true)
  })

  it('unenrols nothing when the pick goes back down', async () => {
    await pickTrackTier(userId, TECHNOLOGY, 'staff')
    await markTopicLearned(userId, TECHNOLOGY, DIRECTORY)

    await pickTrackTier(userId, TECHNOLOGY, 'swe-1')

    expect(await scheduledIds()).toEqual(await inScopeIds('staff'))
  })

  it('leaves a topic that was never marked learned out of recall', async () => {
    await pickTrackTier(userId, TECHNOLOGY, 'staff')

    expect(await scheduledIds()).toEqual([])
  })

  it('is remembered per track', async () => {
    await pickTrackTier(userId, TECHNOLOGY, 'senior')
    await pickTrackTier(userId, 'browser', 'swe-2')

    const rows = await ctx.db
      .select({ technology: trackTier.technology, tier: trackTier.tier })
      .from(trackTier)
      .where(eq(trackTier.userId, userId))

    expect(rows.sort((a, b) => a.technology.localeCompare(b.technology))).toEqual([
      { technology: 'browser', tier: 'swe-2' },
      { technology: 'javascript', tier: 'senior' },
    ])
  })

  it('replaces the pick rather than adding a second one', async () => {
    await pickTrackTier(userId, TECHNOLOGY, 'senior')
    await pickTrackTier(userId, TECHNOLOGY, 'staff')

    const rows = await ctx.db.select().from(trackTier).where(eq(trackTier.userId, userId))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.tier).toBe('staff')
  })
})
