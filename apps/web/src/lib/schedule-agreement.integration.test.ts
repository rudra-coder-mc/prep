import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import { reviewSchedule } from '@/db/schema'
import {
  createTestDatabase,
  insertTestUser,
  useTestDatabase,
  type TestDatabase,
} from '@/db/testing'
import { recordAttempt } from '@/lib/attempts'
import { questionKey, type AnswerForm, type Result } from '@prep/core'
// The phone's own modules, reached by path because an application is not a
// package and nothing imports one. Proving two surfaces agree means running
// both of them, which is the only reason a web test reaches across.
import { recordAttempt as recordOnDevice } from '../../../mobile/src/db/attempts'
import { readSchedule } from '../../../mobile/src/db/schedule'
import { migrate } from '../../../mobile/src/db/migrate'
import { createTestDatabase as createDeviceDatabase } from '../../../mobile/test-support/database'

/**
 * The laptop and the phone, answering the same questions the same way.
 *
 * Both sides move a question along the interval ladder themselves rather than
 * being told where it landed, so the whole offline design rests on them
 * reaching the same rung from the same history. Each side is tested against its
 * own store elsewhere; this is the one that would notice them parting.
 *
 * It runs the real `recordAttempt` on both, against real Postgres and real
 * SQLite, because the agreement that matters is between what the two actually
 * write, not between two calls to @prep/core.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let userId: string
let device: ReturnType<typeof createDeviceDatabase>

const TOPIC = 'javascript/closures'
const QUESTION = 'counter-output'
const KEY = questionKey(TOPIC, QUESTION)

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)
  userId = await insertTestUser(ctx.db)

  device = createDeviceDatabase()
  await migrate(device)
}, 60_000)

afterAll(async () => {
  device?.close()
  await restore?.()
  await ctx?.drop()
})

/** The same answer, given on both surfaces, and what each one made of it. */
async function answerOnBoth(form: AnswerForm, result: Result, now: Date) {
  const server = await recordAttempt(
    userId,
    { topicSlug: TOPIC, questionId: QUESTION, answer: 'an answer', result, form, hintsUsed: 0 },
    now,
  )

  const phone = await recordOnDevice(
    device,
    { topicSlug: TOPIC, questionId: QUESTION, answer: 'an answer', result, form, hintsUsed: 0 },
    { id: `attempt-${now.toISOString()}`, now },
  )

  const [stored] = await ctx.db
    .select({
      dueAt: reviewSchedule.dueAt,
      intervalStep: reviewSchedule.intervalStep,
      lastResult: reviewSchedule.lastResult,
    })
    .from(reviewSchedule)
    .where(and(eq(reviewSchedule.userId, userId), eq(reviewSchedule.questionId, KEY)))

  const onDevice = (await readSchedule(device)).find((row) => row.questionId === KEY)

  return { server, phone, stored, onDevice }
}

describe('a question answered on both surfaces', () => {
  it('lands on the same rung, due at the same moment, every step of the way', async () => {
    const history: { form: AnswerForm; result: Result; on: string }[] = [
      { form: 'choice', result: 'passed', on: '2026-08-24T09:00:00.000Z' },
      { form: 'choice', result: 'passed', on: '2026-08-25T09:00:00.000Z' },
      { form: 'choice', result: 'failed', on: '2026-08-28T09:00:00.000Z' },
      { form: 'ordering', result: 'passed', on: '2026-08-29T09:00:00.000Z' },
      { form: 'open', result: 'weak', on: '2026-08-30T09:00:00.000Z' },
      { form: 'open', result: 'passed', on: '2026-09-02T09:00:00.000Z' },
    ]

    for (const answer of history) {
      const { server, phone, stored, onDevice } = await answerOnBoth(
        answer.form,
        answer.result,
        new Date(answer.on),
      )

      expect(stored, 'the server wrote a schedule row').toBeDefined()
      expect(onDevice, 'the device wrote a schedule row').toBeDefined()

      expect(phone.step, `${answer.form} ${answer.result} on ${answer.on}`).toBe(server.step)
      expect(phone.dueAt).toEqual(server.dueAt)

      // And each side wrote down what it worked out, rather than only returning it.
      expect(onDevice?.intervalStep).toBe(stored?.intervalStep)
      expect(onDevice?.dueAt).toEqual(stored?.dueAt)
      expect(onDevice?.lastResult).toBe(stored?.lastResult)
    }
  })
})
