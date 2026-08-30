import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { reviewSchedule, topicProgress, trackTier } from '@/db/schema'
import {
  createTestDatabase,
  insertTestUser,
  useTestDatabase,
  type TestDatabase,
} from '@/db/testing'
import { getAllTopics } from '@prep/content'
import { questionKey, type Tier, READY_STEP, questionsUpTo } from '@prep/core'
import { getDashboard } from '@/lib/dashboard'
import { pickTrackTier } from '@/lib/progress'

/**
 * Readiness is the number behind the promise, so it is measured here against
 * real content and a real ladder rather than against a fixture. Every count is
 * derived from `content/`: the bank grows every week, and a test that pins its
 * size fails on authoring rather than on a defect.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let userId: string

const TECHNOLOGY = 'javascript'

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

/** Every question the tier covers on one track, as the platform keys them. */
async function coveredBy(tier: Tier, technology = TECHNOLOGY): Promise<string[]> {
  const topics = await getAllTopics()

  return topics
    .filter((topic) => topic.technology === technology)
    .flatMap((topic) =>
      questionsUpTo(topic.questions, tier).map((question) => questionKey(topic.slug, question.id)),
    )
}

/** The topics on one track that the tier covers at least one question of. */
async function topicsOnPath(tier: Tier, technology = TECHNOLOGY) {
  const topics = await getAllTopics()
  return topics.filter(
    (topic) => topic.technology === technology && questionsUpTo(topic.questions, tier).length > 0,
  )
}

/** Marks topics learned, which is the state a retained question implies. */
async function markLearned(slugs: string[]) {
  if (slugs.length === 0) return

  await ctx.db
    .insert(topicProgress)
    .values(slugs.map((topicSlug) => ({ userId, topicSlug, learnedAt: new Date() })))
}

/** Puts questions on the ladder at a rung, without going through an attempt. */
async function placeOnLadder(questionIds: string[], intervalStep: number) {
  if (questionIds.length === 0) return

  await ctx.db.insert(reviewSchedule).values(
    questionIds.map((questionId) => ({
      userId,
      questionId,
      topicSlug: questionId.split('#')[0] ?? '',
      dueAt: new Date(),
      intervalStep,
    })),
  )
}

async function readinessFor(technology = TECHNOLOGY) {
  const dashboard = await getDashboard(userId)
  const track = dashboard.tracks.find((candidate) => candidate.id === technology)
  if (!track) throw new Error(`no ${technology} track on the dashboard`)
  return track.readiness
}

describe('readiness', () => {
  it('is measured over every question the tier covers, learned or not', async () => {
    const covered = await coveredBy('swe-1')

    const readiness = await readinessFor()
    expect(readiness.tier).toBe('swe-1')
    expect(readiness.total).toBe(covered.length)
    expect(readiness.retained).toBe(0)
    expect(readiness.percent).toBe(0)
  })

  it('counts a question once its schedule reaches the ready rung', async () => {
    const covered = await coveredBy('swe-1')
    await placeOnLadder(covered.slice(0, 4), READY_STEP)

    expect((await readinessFor()).retained).toBe(4)
  })

  it('ignores a question one rung short, however many attempts are behind it', async () => {
    const covered = await coveredBy('swe-1')
    await placeOnLadder(covered.slice(0, 4), READY_STEP - 1)

    expect((await readinessFor()).retained).toBe(0)
  })

  it('ignores a retained question the tier does not cover', async () => {
    const covered = await coveredBy('swe-1')
    const above = (await coveredBy('staff')).filter((id) => !covered.includes(id))
    await placeOnLadder(above, 4)

    const readiness = await readinessFor()
    expect(readiness.retained).toBe(0)
    expect(readiness.total).toBe(covered.length)
  })

  it('follows the pick, so stepping up makes a finished tier unfinished again', async () => {
    const covered = await coveredBy('swe-1')
    await placeOnLadder(covered, READY_STEP)
    expect((await readinessFor()).percent).toBe(100)

    await pickTrackTier(userId, TECHNOLOGY, 'swe-2')

    const readiness = await readinessFor()
    expect(readiness.tier).toBe('swe-2')
    expect(readiness.total).toBe((await coveredBy('swe-2')).length)
    expect(readiness.percent).toBeLessThan(100)
  })
})

describe('the offer to step up', () => {
  /** A track finished at its tier: every covered topic learned and retained. */
  async function finishSweOne() {
    const onPath = await topicsOnPath('swe-1')
    await markLearned(onPath.map((topic) => topic.slug))
    await placeOnLadder(await coveredBy('swe-1'), READY_STEP)
    return onPath
  }

  it('is absent while one question is still short', async () => {
    const covered = await coveredBy('swe-1')
    await placeOnLadder(covered.slice(1), READY_STEP)

    const readiness = await readinessFor()
    expect(readiness.percent).toBeLessThan(100)
    expect(readiness.stepUpTo).toBeNull()
  })

  it('names the next tier and how many questions accepting it enrols', async () => {
    const onPath = await finishSweOne()

    // Only the topics already learned enrol on the step up, so the offer counts
    // what each of those gains rather than the whole of SWE-2.
    const arriving = onPath.reduce(
      (total, topic) =>
        total +
        questionsUpTo(topic.questions, 'swe-2').length -
        questionsUpTo(topic.questions, 'swe-1').length,
      0,
    )

    const readiness = await readinessFor()
    expect(readiness.stepUpTo).toBe('swe-2')
    expect(readiness.stepUpAdds).toBe(arriving)
    expect(readiness.stepUpAdds).toBeGreaterThan(0)
  })

  it('counts nothing from a topic that was never marked learned', async () => {
    await placeOnLadder(await coveredBy('swe-1'), READY_STEP)

    expect((await readinessFor()).stepUpTo).toBe('swe-2')
    expect((await readinessFor()).stepUpAdds).toBe(0)
  })

  it('does not take the step by itself', async () => {
    await finishSweOne()
    await getDashboard(userId)

    const rows = await ctx.db.select().from(trackTier)
    expect(rows).toHaveLength(0)
    expect((await readinessFor()).tier).toBe('swe-1')
  })
})
