import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { readTierPicks, readLearnedTopics } from '../db/progress'
import { readSchedule } from '../db/schedule'
import { enrolLearnedTopics, markTopicLearned, pickTrackTier } from './learn'
import { createTestDatabase } from '../../test-support/database'
import { archiveContent, archiveQuestion, archiveTopic } from '../../test-support/content'

/**
 * Marking a topic learned, which is the act that enrols its questions.
 *
 * It is the same rule as the server's: only the questions at or below the
 * track's tier, because being asked a staff question while preparing for the
 * SWE-1 screen teaches nothing. See
 * docs/decisions/0028-tiers-are-interview-levels.md.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')

const content = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-2' }),
      archiveQuestion({ id: 'realms', tier: 'staff' }),
    ],
  }),
  archiveTopic({
    technology: 'javascript',
    directory: 'generators',
    title: 'Generators',
    questions: [archiveQuestion({ id: 'yield', tier: 'swe-1' })],
  }),
  archiveTopic({
    technology: 'browser',
    directory: 'events',
    title: 'Events',
    questions: [archiveQuestion({ id: 'bubble', tier: 'swe-2' })],
  }),
])

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => {
  db.close()
})

describe('marking a topic learned', () => {
  it('enrols only the questions at or below the chosen tier', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-2', MONDAY)

    const schedule = await readSchedule(db)
    expect(schedule.map((row) => row.questionId).sort()).toEqual([
      'javascript/closures#capture',
      'javascript/closures#scope',
    ])
  })

  it('marks the topic learned as of now', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)

    expect(await readLearnedTopics(db)).toEqual(new Map([['javascript/closures', MONDAY]]))
  })

  it('is idempotent on the ladder', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await db.run('update review_schedule set interval_step = 3, due_at = ? where question_id = ?', [
      TUESDAY.toISOString(),
      'javascript/closures#scope',
    ])

    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', TUESDAY)

    expect((await readSchedule(db))[0]).toMatchObject({ intervalStep: 3 })
  })

  it('brings questions up to a newly selected tier when marked learned again', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await markTopicLearned(db, content, 'javascript/closures', 'staff', TUESDAY)

    expect(await readSchedule(db)).toHaveLength(3)
  })

  it('enrols nothing when the topic holds no questions at that tier', async () => {
    await markTopicLearned(db, content, 'javascript/generators', 'swe-1', MONDAY)

    expect(await readSchedule(db)).toHaveLength(1)
  })

  it('scopes enrolments by technology', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await markTopicLearned(db, content, 'browser/events', 'swe-2', MONDAY)

    expect((await readSchedule(db)).map((row) => row.questionId).sort()).toEqual([
      'browser/events#bubble',
      'javascript/closures#scope',
    ])
  })

  it('leaves the database untouched when the topic is not in the archive', async () => {
    await expect(
      markTopicLearned(db, content, 'javascript/unknown', 'swe-1', MONDAY),
    ).rejects.toThrow('This device holds no copy of javascript/unknown')

    expect(await readLearnedTopics(db)).toEqual(new Map())
    expect(await readSchedule(db)).toEqual([])
  })
})

describe('enrolling already-learned topics after an archive arrives', () => {
  it('enrols questions up to each track tier for every topic learned', async () => {
    await db.run(
      `insert into topic_progress (topic_slug, learned_at) values ('javascript/closures', ?)`,
      [MONDAY.toISOString()],
    )
    await db.run(
      `insert into track_tier (technology, tier, updated_at) values ('javascript', 'staff', ?)`,
      [MONDAY.toISOString()],
    )

    await enrolLearnedTopics(db, content, 'javascript', 'staff', TUESDAY)

    expect(await readSchedule(db)).toHaveLength(3)
  })
})

describe('picking the tier for a track', () => {
  it('stores the pick with the timestamp a sync merges it by', async () => {
    await pickTrackTier(db, content, 'javascript', 'swe-2', TUESDAY)

    expect(await readTierPicks(db)).toEqual([
      { technology: 'javascript', tier: 'swe-2', updatedAt: TUESDAY },
    ])
  })

  /**
   * Without this the pick would only apply to topics learned after it, so
   * stepping up would mean re-reading every topic by hand.
   */
  it('brings what is already learned up to it', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)

    await pickTrackTier(db, content, 'javascript', 'swe-2', TUESDAY)

    expect((await readSchedule(db)).map((row) => row.questionId).sort()).toEqual([
      'javascript/closures#capture',
      'javascript/closures#scope',
    ])
  })

  it('reconciles and removes out-of-scope questions when stepping down', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-2', MONDAY)
    expect(await readSchedule(db)).toHaveLength(2)

    await pickTrackTier(db, content, 'javascript', 'swe-1', TUESDAY)

    const schedule = await readSchedule(db)
    expect(schedule.map((row) => row.questionId)).toEqual(['javascript/closures#scope'])
  })

  it('leaves the other tracks where they were', async () => {
    await markTopicLearned(db, content, 'browser/events', 'swe-2', MONDAY)

    await pickTrackTier(db, content, 'javascript', 'staff', TUESDAY)

    expect((await readTierPicks(db)).map((pick) => pick.technology)).toEqual(['javascript'])
    expect(await readSchedule(db)).toHaveLength(1)
  })
})
