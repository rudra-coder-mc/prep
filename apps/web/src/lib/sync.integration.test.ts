import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { and, eq } from 'drizzle-orm'
import {
  attempts as attemptsTable,
  dailyActivity,
  deviceSync,
  exerciseProgress,
  reviewSchedule,
  topicProgress,
  trackTier,
  user,
} from '@/db/schema'
import {
  createTestDatabase,
  insertTestUser,
  useTestDatabase,
  type TestDatabase,
} from '@/db/testing'
import { questionKey, replaySchedule, toDayString, type Result } from '@prep/core'
import { recordAttempt } from '@/lib/attempts'
import { setExerciseStatus } from '@/lib/exercises'
import { markTopicLearned } from '@/lib/progress'
import { sync, type IncomingAttempt } from '@/lib/sync'

/**
 * The exchange, against real Postgres, because the whole of what is worth
 * checking is what the merge does to rows that already exist.
 *
 * See docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let userId: string

const TOPIC = 'javascript/closures'
const CHOICE = questionKey(TOPIC, 'what-is-a-closure')
const OPEN = questionKey(TOPIC, 'module-pattern')

const PHONE = { id: 'device-phone', name: 'Pixel' }
const TABLET = { id: 'device-tablet', name: 'Tablet' }

const MONDAY = new Date('2026-08-17T09:00:00.000Z')
const TUESDAY = new Date('2026-08-18T09:00:00.000Z')
const WEDNESDAY = new Date('2026-08-19T09:00:00.000Z')

function attempt(
  overrides: Partial<IncomingAttempt> & { id: string; attemptedAt: Date },
): IncomingAttempt {
  return {
    questionId: CHOICE,
    topicSlug: TOPIC,
    answer: 'the first option',
    result: 'passed' as Result,
    confidence: 3,
    hintsUsed: 0,
    notes: null,
    ...overrides,
  }
}

/** A sync carrying nothing, which is how a device asks what it has missed. */
function pull(since: Date | null, device = PHONE, now = WEDNESDAY) {
  return sync(
    userId,
    { device, since, attempts: [], topicProgress: [], trackTiers: [], exerciseProgress: [] },
    now,
  )
}

async function scheduleFor(key: string) {
  const [row] = await ctx.db
    .select()
    .from(reviewSchedule)
    .where(and(eq(reviewSchedule.userId, userId), eq(reviewSchedule.questionId, key)))
  return row
}

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)
}, 60_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(user)
  userId = await insertTestUser(ctx.db)
})

describe('taking attempts from a device', () => {
  it('stores them and rebuilds the schedule the same way answering here would', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [
          attempt({ id: 'a1', attemptedAt: MONDAY }),
          attempt({ id: 'a2', attemptedAt: TUESDAY }),
        ],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const replayed = replaySchedule('choice', [
      { result: 'passed', attemptedAt: MONDAY },
      { result: 'passed', attemptedAt: TUESDAY },
    ])
    const row = await scheduleFor(CHOICE)

    expect(row?.intervalStep).toBe(replayed?.step)
    expect(row?.dueAt).toEqual(replayed?.dueAt)
    expect(row?.lastResult).toBe('passed')
  })

  it('folds a device attempt into a history that already existed here', async () => {
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [attempt({ id: 'a2', attemptedAt: TUESDAY })],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    // Two right answers, wherever they were given, is two rungs.
    expect((await scheduleFor(CHOICE))?.intervalStep).toBe(2)
  })

  /**
   * An attempt is a fact about a moment, so handing over the same one twice has
   * to change nothing. Without this a failed sync could not simply be retried.
   */
  it('takes the same attempt twice without recording it twice', async () => {
    const twice = attempt({ id: 'a1', attemptedAt: MONDAY })
    const request = {
      device: PHONE,
      since: null,
      attempts: [twice],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    }

    await sync(userId, request, TUESDAY)
    await sync(userId, request, WEDNESDAY)

    const rows = await ctx.db.select().from(attemptsTable).where(eq(attemptsTable.userId, userId))
    expect(rows).toHaveLength(1)
    expect((await scheduleFor(CHOICE))?.intervalStep).toBe(1)
  })

  it('leaves the schedule of a question nobody answered alone', async () => {
    await markTopicLearned(userId, 'javascript', 'closures')
    const before = await scheduleFor(OPEN)

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [attempt({ id: 'a1', attemptedAt: MONDAY })],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    expect(await scheduleFor(OPEN)).toEqual(before)
  })

  it('reads the form from the content, so an open question is placed rather than climbed', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [
          attempt({
            id: 'a1',
            questionId: OPEN,
            result: 'weak',
            confidence: 3,
            attemptedAt: MONDAY,
          }),
        ],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const replayed = replaySchedule('open', [{ result: 'weak', attemptedAt: MONDAY }])
    expect((await scheduleFor(OPEN))?.dueAt).toEqual(replayed?.dueAt)
  })

  it('counts the days they were answered on, so a week offline keeps the streak', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [
          attempt({ id: 'a1', attemptedAt: MONDAY }),
          attempt({ id: 'a2', attemptedAt: TUESDAY }),
          attempt({ id: 'a3', questionId: OPEN, attemptedAt: TUESDAY }),
        ],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const days = await ctx.db.select().from(dailyActivity).where(eq(dailyActivity.userId, userId))

    expect(days.map((d) => [d.day, d.reviewed]).sort()).toEqual([
      [toDayString(MONDAY), 1],
      [toDayString(TUESDAY), 2],
    ])
  })

  it('marks the topic reviewed as of the last attempt on it', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [
          attempt({ id: 'a1', attemptedAt: MONDAY }),
          attempt({ id: 'a2', attemptedAt: TUESDAY }),
        ],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const [row] = await ctx.db.select().from(topicProgress).where(eq(topicProgress.userId, userId))

    expect(row?.lastReviewedAt).toEqual(TUESDAY)
  })
})

describe('handing attempts back', () => {
  it('sends everything when a device has never synced', async () => {
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )

    const response = await pull(null)

    expect(response.attempts).toHaveLength(1)
    expect(response.attempts[0]?.questionId).toBe(CHOICE)
    expect(response.attempts[0]?.attemptedAt).toEqual(MONDAY)
  })

  it('sends only what it has not seen since', async () => {
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )
    const first = await pull(null, PHONE, TUESDAY)

    const second = await pull(first.syncedAt, PHONE, WEDNESDAY)

    expect(second.attempts).toEqual([])
  })

  /**
   * Two devices syncing at once can have one commit a row dated fractionally
   * before the watermark the other was handed, so the read reaches back past it.
   * Sending an attempt twice costs nothing; never sending it loses it.
   */
  it('reaches back a little past the watermark rather than exactly to it', async () => {
    const first = await pull(null, PHONE, TUESDAY)
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      new Date(first.syncedAt.getTime() - 1000),
    )

    const second = await pull(first.syncedAt, PHONE, WEDNESDAY)

    expect(second.attempts).toHaveLength(1)
  })

  it('does not hand a device back the attempts it just sent', async () => {
    const response = await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [attempt({ id: 'a1', attemptedAt: MONDAY })],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    expect(response.attempts).toEqual([])
  })

  /**
   * The reason attempts are handed back by when the server learned of them
   * rather than by when they were answered. A phone that was offline all week
   * hands over attempts dated all week, and a tablet that synced on Tuesday
   * would never ask for anything that old.
   */
  it('hands over a back-dated attempt another device only just delivered', async () => {
    const tuesdaySync = await pull(null, TABLET, TUESDAY)

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [attempt({ id: 'a1', attemptedAt: MONDAY })],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const later = await pull(tuesdaySync.syncedAt, TABLET, WEDNESDAY)
    expect(later.attempts.map((a) => a.id)).toEqual(['a1'])
  })

  it('says when it answered, so the other side computes the same due moment', async () => {
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )

    const response = await pull(null)
    const onTheDevice = replaySchedule(
      'choice',
      response.attempts.map((a) => ({ result: a.result, attemptedAt: a.attemptedAt })),
    )

    expect(onTheDevice?.dueAt).toEqual((await scheduleFor(CHOICE))?.dueAt)
  })
})

describe('learned marks', () => {
  it('takes a mark from a device and enrols the topic, as marking it here would', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [{ topicSlug: TOPIC, learnedAt: MONDAY }],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const [row] = await ctx.db.select().from(topicProgress).where(eq(topicProgress.userId, userId))
    expect(row?.learnedAt).toEqual(MONDAY)

    // Enrolled at the default tier, so the staff and senior questions stay out.
    const scheduled = await ctx.db
      .select()
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, userId))
    expect(scheduled.length).toBeGreaterThan(0)
    expect(scheduled.map((r) => r.questionId)).not.toContain(OPEN)
  })

  it('keeps the later of the two marks', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [{ topicSlug: TOPIC, learnedAt: TUESDAY }],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [{ topicSlug: TOPIC, learnedAt: MONDAY }],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const [row] = await ctx.db.select().from(topicProgress).where(eq(topicProgress.userId, userId))
    expect(row?.learnedAt).toEqual(TUESDAY)
  })

  it('hands back what is learned here', async () => {
    await markTopicLearned(userId, 'javascript', 'closures')

    const response = await pull(null)

    expect(response.topicProgress.map((t) => t.topicSlug)).toEqual([TOPIC])
  })
})

describe('tier picks', () => {
  it('takes a pick from a device and brings what is learned up to it', async () => {
    await markTopicLearned(userId, 'javascript', 'closures')

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [],
        trackTiers: [{ technology: 'javascript', tier: 'senior', updatedAt: TUESDAY }],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const scheduled = await ctx.db
      .select()
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, userId))
    expect(scheduled.map((r) => r.questionId)).toContain(OPEN)
  })

  it('keeps the pick with the later timestamp', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [],
        trackTiers: [{ technology: 'javascript', tier: 'senior', updatedAt: TUESDAY }],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [],
        trackTiers: [{ technology: 'javascript', tier: 'swe-2', updatedAt: MONDAY }],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const [row] = await ctx.db.select().from(trackTier).where(eq(trackTier.userId, userId))
    expect(row?.tier).toBe('senior')
  })

  it('hands back the merged pick', async () => {
    await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [],
        trackTiers: [{ technology: 'javascript', tier: 'senior', updatedAt: TUESDAY }],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    const response = await pull(null)

    expect(response.trackTiers).toEqual([
      { technology: 'javascript', tier: 'senior', updatedAt: TUESDAY },
    ])
  })
})

/**
 * Exercise progress is the one collection nothing derives. There is no schedule
 * to replay it into and no ladder to place it on, so it is merged as state by
 * its timestamp, the way a tier pick is, and handed back in full.
 */
describe('exercise progress', () => {
  const EXERCISE = 'javascript/closures/counter'

  function push(status: 'in_progress' | 'completed', updatedAt: Date, notes: string | null = null) {
    return sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [
          {
            exerciseSlug: EXERCISE,
            topicSlug: TOPIC,
            status,
            notes,
            completedAt: status === 'completed' ? updatedAt : null,
            updatedAt,
          },
        ],
      },
      WEDNESDAY,
    )
  }

  async function stored() {
    const [row] = await ctx.db
      .select()
      .from(exerciseProgress)
      .where(eq(exerciseProgress.userId, userId))
    return row
  }

  it('takes a row from a device that has never been recorded here', async () => {
    await push('completed', TUESDAY, 'two goes')

    expect(await stored()).toMatchObject({
      exerciseSlug: EXERCISE,
      topicSlug: TOPIC,
      status: 'completed',
      notes: 'two goes',
      completedAt: TUESDAY,
    })
  })

  it('keeps the row with the later timestamp, whichever order they arrive in', async () => {
    await push('completed', TUESDAY)
    await push('in_progress', MONDAY)

    expect(await stored()).toMatchObject({ status: 'completed', updatedAt: TUESDAY })
  })

  it('takes a reopening that happened after the completion', async () => {
    await push('completed', MONDAY)
    await push('in_progress', TUESDAY)

    expect(await stored()).toMatchObject({
      status: 'in_progress',
      // Reopening clears the completion, so nothing counts it as finished.
      completedAt: null,
    })
  })

  it('hands back what is recorded here', async () => {
    await setExerciseStatus(userId, TOPIC, 'counter', 'completed', 'done here', TUESDAY)

    const response = await pull(null)

    expect(response.exerciseProgress).toEqual([
      {
        exerciseSlug: EXERCISE,
        topicSlug: TOPIC,
        status: 'completed',
        notes: 'done here',
        completedAt: TUESDAY,
        updatedAt: TUESDAY,
      },
    ])
  })
})

describe('the device record', () => {
  it('remembers a device by name and when it was last heard from', async () => {
    await pull(null, PHONE, TUESDAY)
    await pull(null, PHONE, WEDNESDAY)

    const rows = await ctx.db.select().from(deviceSync).where(eq(deviceSync.userId, userId))

    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe('Pixel')
    expect(rows[0]?.lastSyncedAt).toEqual(WEDNESDAY)
  })

  it('keeps one row per device', async () => {
    await pull(null, PHONE, TUESDAY)
    await pull(null, TABLET, WEDNESDAY)

    const rows = await ctx.db.select().from(deviceSync).where(eq(deviceSync.userId, userId))
    expect(rows).toHaveLength(2)
  })
})

describe('the exchange as a whole', () => {
  /**
   * The promise the task was written around: a question answered on one side
   * comes out due at the same moment on the other, in both directions.
   */
  it('leaves both sides agreeing about when each question is next due', async () => {
    await recordAttempt(
      userId,
      {
        topicSlug: TOPIC,
        questionId: 'what-is-a-closure',
        answer: '',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )

    const response = await sync(
      userId,
      {
        device: PHONE,
        since: null,
        attempts: [
          attempt({
            id: 'a1',
            questionId: OPEN,
            result: 'weak',
            confidence: 3,
            attemptedAt: TUESDAY,
          }),
        ],
        topicProgress: [],
        trackTiers: [],
        exerciseProgress: [],
      },
      WEDNESDAY,
    )

    // What the device holds afterwards: its own attempt, plus what came back.
    const held = [
      { questionId: OPEN, result: 'weak' as Result, attemptedAt: TUESDAY },
      ...response.attempts.map((a) => ({
        questionId: a.questionId,
        result: a.result,
        attemptedAt: a.attemptedAt,
      })),
    ]

    for (const [key, form] of [
      [CHOICE, 'choice'],
      [OPEN, 'open'],
    ] as const) {
      const onTheDevice = replaySchedule(
        form,
        held.filter((a) => a.questionId === key),
      )
      const onTheServer = await scheduleFor(key)

      expect(onTheDevice?.dueAt).toEqual(onTheServer?.dueAt)
      expect(onTheDevice?.step).toEqual(onTheServer?.intervalStep)
    }
  })
})
