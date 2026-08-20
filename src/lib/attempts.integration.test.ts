import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDatabase, insertTestUser, type TestDatabase } from '@/db/testing'
import { attempts, reviewSchedule, topicProgress } from '@/db/schema'
import { nextDueDate, nextRung, type LadderStep } from '@/lib/interval-ladder'
import type { AnswerForm } from '@/content/schema'
import { revealQuestion } from '@/lib/attempts'

/**
 * recordAttempt writes through the shared connection, so these exercise the same
 * SQL against an isolated database rather than importing the module under test.
 * The rung it lands on comes from the ladder itself, so the arithmetic is not
 * duplicated here even though the writes are.
 */
let ctx: TestDatabase
let userId: string

const TOPIC = 'javascript/closures'
const KEY = `${TOPIC}#counter-output`

async function currentStep(): Promise<LadderStep> {
  const [row] = await ctx.db
    .select({ intervalStep: reviewSchedule.intervalStep })
    .from(reviewSchedule)
    .where(eq(reviewSchedule.questionId, KEY))

  return (row?.intervalStep ?? 0) as LadderStep
}

async function record(form: AnswerForm, result: 'passed' | 'weak' | 'failed', now: Date) {
  const { step, confidence } = nextRung(form, result, await currentStep())
  const dueAt = nextDueDate(step, now)

  await ctx.db.insert(attempts).values({
    userId,
    questionId: KEY,
    topicSlug: TOPIC,
    answer: 'my answer',
    result,
    confidence,
    attemptedAt: now,
  })

  await ctx.db
    .insert(reviewSchedule)
    .values({
      userId,
      questionId: KEY,
      topicSlug: TOPIC,
      dueAt,
      intervalStep: step,
      lastResult: result,
    })
    .onConflictDoUpdate({
      target: [reviewSchedule.userId, reviewSchedule.questionId],
      set: { dueAt, intervalStep: step, lastResult: result },
    })

  await ctx.db
    .insert(topicProgress)
    .values({ userId, topicSlug: TOPIC, lastReviewedAt: now })
    .onConflictDoUpdate({
      target: [topicProgress.userId, topicProgress.topicSlug],
      set: { lastReviewedAt: now },
    })

  return { step, dueAt, confidence }
}

beforeAll(async () => {
  ctx = await createTestDatabase()
  userId = await insertTestUser(ctx.db)
}, 60_000)

afterAll(async () => {
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(attempts)
  await ctx.db.delete(reviewSchedule)
  await ctx.db.delete(topicProgress)
})

describe('recording an attempt', () => {
  it('keeps every attempt rather than replacing the last one', async () => {
    await record('open', 'failed', new Date('2026-08-17T09:00:00Z'))
    await record('open', 'passed', new Date('2026-08-18T09:00:00Z'))

    const rows = await ctx.db.select().from(attempts).where(eq(attempts.questionId, KEY))
    expect(rows).toHaveLength(2)
  })

  it('leaves exactly one schedule row per question, updated in place', async () => {
    await record('open', 'failed', new Date('2026-08-17T09:00:00Z'))
    await record('open', 'passed', new Date('2026-08-18T09:00:00Z'))

    const rows = await ctx.db
      .select()
      .from(reviewSchedule)
      .where(eq(reviewSchedule.questionId, KEY))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.intervalStep).toBe(4)
    expect(rows[0]?.lastResult).toBe('passed')
  })

  it('carries a question answered right again and again out to a fortnight', async () => {
    const now = new Date('2026-08-17T09:00:00Z')
    const reached: number[] = []

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { dueAt } = await record('choice', 'passed', now)
      reached.push(Math.round((dueAt.getTime() - now.getTime()) / 86_400_000))
    }

    expect(reached).toEqual([1, 3, 7, 14, 14])
  })

  it('places an open question by its self grade rather than climbing', async () => {
    const now = new Date('2026-08-17T09:00:00Z')

    const passed = await record('open', 'passed', now)
    expect(Math.round((passed.dueAt.getTime() - now.getTime()) / 86_400_000)).toBe(14)

    const weak = await record('open', 'weak', now)
    expect(Math.round((weak.dueAt.getTime() - now.getTime()) / 86_400_000)).toBe(3)
  })

  it('sends a failed answer back to the bottom however far it had climbed', async () => {
    const now = new Date('2026-08-17T09:00:00Z')
    await record('open', 'passed', now)
    await record('choice', 'failed', now)

    const [row] = await ctx.db
      .select()
      .from(reviewSchedule)
      .where(eq(reviewSchedule.questionId, KEY))
    expect(row?.intervalStep).toBe(0)
  })

  it('records when the topic was last reviewed without creating a second row', async () => {
    await record('choice', 'passed', new Date('2026-08-17T09:00:00Z'))
    await record('choice', 'passed', new Date('2026-08-19T09:00:00Z'))

    const rows = await ctx.db.select().from(topicProgress)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.lastReviewedAt?.toISOString()).toContain('2026-08-19')
  })
})

/**
 * Revealing runs against real content rather than the database, and it is the
 * one call that hands an answer to the browser. The answer in full names the
 * correct option, so serving it for a choice question would be a way to read the
 * answer without answering, which is the rule the whole session flow rests on.
 */
describe('revealing an answer', () => {
  it('reveals an open question, which is how that form works', async () => {
    const revealed = await revealQuestion(TOPIC, 'what-is-a-closure')

    expect(revealed.answerInFull.length).toBeGreaterThan(0)
    expect(revealed.answerAudioKey.length).toBeGreaterThan(0)
  })

  it('refuses a choice question, whose answer would name the correct option', async () => {
    await expect(revealQuestion(TOPIC, 'what-a-closure-captures-mcq')).rejects.toThrow(
      /answered by choosing an option/,
    )
  })

  it('refuses a question that does not exist rather than returning nothing', async () => {
    await expect(revealQuestion(TOPIC, 'no-such-question')).rejects.toThrow(/No such question/)
  })
})
