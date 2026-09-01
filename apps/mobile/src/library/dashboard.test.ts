import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { recordAttempt } from '../db/attempts'
import { recordReview } from '../db/activity'
import { setExerciseStatus } from '../db/exercises'
import { migrate } from '../db/migrate'
import { readDashboard } from './dashboard'
import { markTopicLearned, pickTrackTier } from './learn'
import { createTestDatabase } from '../../test-support/database'
import {
  archiveContent,
  archiveExercise,
  archiveQuestion,
  archiveTopic,
} from '../../test-support/content'

/**
 * The dashboard, read off this device.
 *
 * What the numbers mean is @prep/core's and is tested there. What is worth
 * proving here is that the right rows reach it: the ladder from
 * `review_schedule`, the streak from `daily_activity`, the exercises from
 * `exercise_progress`, and the tier from `track_tier`. A row this layer forgets
 * to read is a dashboard that quietly disagrees with the laptop's.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')

const CLOSURES = 'javascript/closures'

const content = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-2' }),
    ],
    exercises: [archiveExercise({ id: 'counter' }), archiveExercise({ id: 'once' })],
  }),
  archiveTopic({
    directory: 'promises',
    title: 'Promises',
    order: 1,
    questions: [archiveQuestion({ id: 'order', tier: 'swe-1' })],
  }),
])

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

async function answer(questionId: string, result: 'passed' | 'failed', now: Date) {
  await recordAttempt(
    db,
    { topicSlug: CLOSURES, questionId, answer: '0', result, form: 'choice', hintsUsed: 0 },
    { id: `attempt-${questionId}-${now.toISOString()}`, now },
  )
}

describe('the dashboard on this device', () => {
  it('reads nothing as nothing rather than as a failure', async () => {
    const dashboard = await readDashboard(db, content, TUESDAY)

    expect(dashboard.byStatus.not_started).toBe(2)
    expect(dashboard.questions.attempted).toBe(0)
    expect(dashboard.streak).toEqual({ current: 0, longest: 0 })
    expect(dashboard.tracks[0]?.readiness).toMatchObject({ retained: 0, total: 2, percent: 0 })
  })

  it('measures readiness against the ladder rows the reviews wrote', async () => {
    await markTopicLearned(db, content, CLOSURES, 'swe-1', MONDAY)

    // Three right answers is step 3, which is where a question starts counting.
    await answer('scope', 'passed', MONDAY)
    await answer('scope', 'passed', new Date('2026-08-25T09:00:00.000Z'))
    await answer('scope', 'passed', new Date('2026-08-29T09:00:00.000Z'))

    const dashboard = await readDashboard(db, content, new Date('2026-08-29T10:00:00.000Z'))

    expect(dashboard.tracks[0]?.readiness).toMatchObject({ retained: 1, total: 2, percent: 50 })
    expect(dashboard.questions).toMatchObject({ attempted: 3, passed: 3 })
  })

  it('takes the tier from the pick, so stepping up moves the denominator', async () => {
    await markTopicLearned(db, content, CLOSURES, 'swe-1', MONDAY)
    expect((await readDashboard(db, content, TUESDAY)).tracks[0]?.readiness.total).toBe(2)

    await pickTrackTier(db, content, 'javascript', 'swe-2', TUESDAY)

    expect((await readDashboard(db, content, TUESDAY)).tracks[0]?.readiness.total).toBe(3)
  })

  it('counts the exercises recorded here against the ones the archive holds', async () => {
    await setExerciseStatus(
      db,
      { topicSlug: CLOSURES, exerciseId: 'counter', status: 'completed', notes: '' },
      MONDAY,
    )

    expect((await readDashboard(db, content, TUESDAY)).exercises).toEqual({
      completed: 1,
      remaining: 1,
    })
  })

  it('derives the streak from the days the reviews counted against', async () => {
    await recordReview(db, MONDAY)
    await recordReview(db, TUESDAY)

    expect((await readDashboard(db, content, TUESDAY)).streak).toEqual({ current: 2, longest: 2 })
  })

  it('names a topic that is going badly among the weakest', async () => {
    await markTopicLearned(db, content, CLOSURES, 'swe-1', MONDAY)
    await answer('scope', 'failed', MONDAY)

    const dashboard = await readDashboard(db, content, TUESDAY)

    expect(dashboard.weakest.map((topic) => topic.slug)).toEqual([CLOSURES])
    expect(dashboard.byStatus.weak).toBe(1)
  })
})
