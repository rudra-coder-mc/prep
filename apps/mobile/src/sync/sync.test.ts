import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dayCounts } from '@prep/core'
import { recordAttempt } from '../db/attempts'
import { readActivity } from '../db/activity'
import { migrate } from '../db/migrate'
import { readLearnedTopics, readTrackTiers } from '../db/progress'
import { readSchedule } from '../db/schedule'
import { readSetting } from '../db/settings'
import { markTopicLearned } from '../library/learn'
import {
  ServerError,
  type ServerClient,
  type SyncAttempt,
  type SyncRequest,
} from '../server/client'
import { syncProgress } from './sync'
import { createTestDatabase } from '../../test-support/database'
import { archiveContent, archiveQuestion, archiveTopic } from '../../test-support/content'

/**
 * The device's end of the exchange.
 *
 * Every rule here is the server's, mirrored: attempts merge by id, marks and
 * picks by timestamp, and everything derived is rebuilt from what arrived rather
 * than exchanged. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
let db: ReturnType<typeof createTestDatabase>

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')
const WEDNESDAY = new Date('2026-08-26T09:00:00.000Z')
const SYNCED_AT = new Date('2026-08-26T09:30:00.000Z')

const DEVICE = { id: 'device-1', name: 'Phone' }

const content = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-2' }),
      archiveQuestion({ id: 'realms', tier: 'staff' }),
    ],
  }),
])

/** The same archive after a refresh brought a question it did not have. */
const laterContent = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-2' }),
      archiveQuestion({ id: 'realms', tier: 'staff' }),
      archiveQuestion({ id: 'ghost', tier: 'swe-1' }),
    ],
  }),
])

type Answered = Partial<SyncAttempt> & { attemptedAt: Date }

function answered({ attemptedAt, ...overrides }: Answered): SyncAttempt {
  return {
    id: `attempt-${attemptedAt.toISOString()}`,
    questionId: 'javascript/closures#scope',
    topicSlug: 'javascript/closures',
    answer: '0',
    result: 'passed',
    confidence: 3,
    hintsUsed: 0,
    notes: null,
    attemptedAt,
    ...overrides,
  }
}

type Returning = {
  attempts?: SyncAttempt[]
  topicProgress?: { topicSlug: string; learnedAt: Date }[]
  trackTiers?: { technology: string; tier: 'swe-1' | 'swe-2'; updatedAt: Date }[]
  syncedAt?: Date
}

function serverReturning(returning: Returning = {}) {
  const requests: SyncRequest[] = []

  const client = {
    sync: vi.fn(async (request: SyncRequest) => {
      requests.push(request)
      return {
        syncedAt: returning.syncedAt ?? SYNCED_AT,
        attempts: returning.attempts ?? [],
        topicProgress: returning.topicProgress ?? [],
        trackTiers: returning.trackTiers ?? [],
      }
    }),
  } as unknown as ServerClient

  return { client, requests }
}

const exchange = (client: ServerClient, now = WEDNESDAY, held = content) =>
  syncProgress({ db, content: held, client, device: DEVICE }, now)

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

describe('handing over what this device answered', () => {
  it('sends the unsynced attempts and never sends one twice', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await recordAttempt(
      db,
      {
        topicSlug: 'javascript/closures',
        questionId: 'scope',
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-here', now: TUESDAY },
    )

    const first = serverReturning()
    expect(await exchange(first.client)).toMatchObject({ sent: 1 })
    expect(first.requests[0]?.since).toBeNull()
    expect(first.requests[0]?.attempts.map((attempt) => attempt.id)).toEqual(['answered-here'])

    const second = serverReturning()
    expect(await exchange(second.client)).toMatchObject({ sent: 0 })
    expect(second.requests[0]?.attempts).toEqual([])
    // Asked from what the server said last time rather than from a local clock.
    expect(second.requests[0]?.since).toEqual(SYNCED_AT)
  })

  it('sends the learned marks and tier picks it holds, in full', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)

    const { client, requests } = serverReturning()
    await exchange(client)

    expect(requests[0]?.topicProgress).toEqual([
      { topicSlug: 'javascript/closures', learnedAt: MONDAY },
    ])
    expect(requests[0]?.device).toEqual(DEVICE)
  })

  it('leaves the attempts unsent and the watermark alone when the server cannot be reached', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await recordAttempt(
      db,
      {
        topicSlug: 'javascript/closures',
        questionId: 'scope',
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-here', now: TUESDAY },
    )

    const client = {
      sync: vi.fn(async () => {
        throw new ServerError('offline', 'work could not be reached')
      }),
    } as unknown as ServerClient

    await expect(exchange(client)).rejects.toBeInstanceOf(ServerError)

    expect(await readSetting(db, 'last-synced-at')).toBeNull()
    const [row] = await db.all<{ synced: number }>('select synced from attempts')
    expect(row?.synced).toBe(0)
  })
})

describe('taking what was answered elsewhere', () => {
  it('puts an answer where it would have landed on the day it was given', async () => {
    const { client } = serverReturning({
      attempts: [answered({ attemptedAt: MONDAY }), answered({ attemptedAt: TUESDAY })],
    })

    expect(await exchange(client)).toMatchObject({ received: { attempts: 2 } })

    const [scheduled] = await readSchedule(db)
    // Two passes on a choice question is the second rung, and the second rung is
    // three days from the answer rather than from the sync.
    expect(scheduled?.intervalStep).toBe(2)
    expect(scheduled?.dueAt).toEqual(new Date('2026-08-28T09:00:00.000Z'))
    expect(scheduled?.lastResult).toBe('passed')
  })

  it('changes nothing when the same attempt arrives again', async () => {
    const twice = answered({ attemptedAt: MONDAY })

    await exchange(serverReturning({ attempts: [twice] }).client)
    const before = await readSchedule(db)

    await exchange(serverReturning({ attempts: [twice] }).client)

    expect(await db.all('select id from attempts')).toHaveLength(1)
    expect(await readSchedule(db)).toEqual(before)
  })

  it('marks an attempt of its own that comes back as one the server has', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)
    await recordAttempt(
      db,
      {
        topicSlug: 'javascript/closures',
        questionId: 'scope',
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-here', now: TUESDAY },
    )

    // A server that echoes it back rather than leaving it out, which is what a
    // second device delivering the same attempt looks like.
    await exchange(
      serverReturning({ attempts: [answered({ id: 'answered-here', attemptedAt: TUESDAY })] })
        .client,
    )

    const rows = await db.all<{ synced: number }>('select synced from attempts')
    expect(rows).toEqual([{ synced: 1 }])
  })

  it('records the day an answer was given rather than the day it arrived', async () => {
    const { client } = serverReturning({
      attempts: [
        answered({ attemptedAt: MONDAY }),
        answered({
          id: 'monday-2',
          questionId: 'javascript/closures#capture',
          attemptedAt: MONDAY,
        }),
        answered({ attemptedAt: TUESDAY }),
      ],
    })

    await exchange(client)

    expect(await readActivity(db)).toEqual([
      { day: '2026-08-24', reviewed: 2, queueCleared: false },
      { day: '2026-08-25', reviewed: 1, queueCleared: false },
    ])
  })

  /**
   * The count is rewritten from the attempts rather than added to, so a day that
   * had been cleared has to survive being recounted: the streak is derived from
   * these rows and a day that stops counting takes the streak with it.
   */
  it('leaves a day that already counted still counting', async () => {
    await db.run('insert into daily_activity (day, reviewed, queue_cleared) values (?, 1, 1)', [
      '2026-08-24',
    ])

    await exchange(serverReturning({ attempts: [answered({ attemptedAt: MONDAY })] }).client)

    const [monday] = await readActivity(db)
    expect(monday?.reviewed).toBe(1)
    expect(dayCounts(monday!)).toBe(true)
  })

  it('derives the last review from the attempts rather than being told it', async () => {
    await exchange(
      serverReturning({
        attempts: [answered({ attemptedAt: MONDAY }), answered({ attemptedAt: TUESDAY })],
      }).client,
    )

    const [row] = await db.all<{ last_reviewed_at: string }>(
      'select last_reviewed_at from topic_progress',
    )
    expect(row?.last_reviewed_at).toBe(TUESDAY.toISOString())
  })
})

describe('taking a mark or a pick made elsewhere', () => {
  it('enrols a topic learned on the laptop, as of when it was learned', async () => {
    await exchange(
      serverReturning({
        topicProgress: [{ topicSlug: 'javascript/closures', learnedAt: MONDAY }],
      }).client,
    )

    expect(await readLearnedTopics(db)).toEqual(new Map([['javascript/closures', MONDAY]]))

    const schedule = await readSchedule(db)
    // The default tier and nothing above it, due from when the lesson was read
    // rather than from the sync.
    expect(schedule.map((row) => row.questionId)).toEqual(['javascript/closures#scope'])
    expect(schedule[0]?.dueAt).toEqual(MONDAY)
  })

  it('keeps the later mark when this device has the newer one', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', TUESDAY)

    await exchange(
      serverReturning({
        topicProgress: [{ topicSlug: 'javascript/closures', learnedAt: MONDAY }],
      }).client,
    )

    expect(await readLearnedTopics(db)).toEqual(new Map([['javascript/closures', TUESDAY]]))
  })

  it('brings what is already learned up to a tier picked on the laptop', async () => {
    await markTopicLearned(db, content, 'javascript/closures', 'swe-1', MONDAY)

    await exchange(
      serverReturning({
        trackTiers: [{ technology: 'javascript', tier: 'swe-2', updatedAt: TUESDAY }],
      }).client,
    )

    expect(await readTrackTiers(db)).toEqual(new Map([['javascript', 'swe-2']]))
    expect((await readSchedule(db)).map((row) => row.questionId).sort()).toEqual([
      'javascript/closures#capture',
      'javascript/closures#scope',
    ])
  })
})

/**
 * The archive is a download and the attempts are not, so unlike the server this
 * side can be handed an answer to a question it holds no copy of. The row waits
 * until a refresh brings the question, and the next sync puts it on the ladder.
 */
describe('an answer to a question this device does not hold yet', () => {
  it('is kept, and scheduled once the archive catches up', async () => {
    const ghost = answered({
      id: 'ghost-attempt',
      questionId: 'javascript/closures#ghost',
      attemptedAt: MONDAY,
    })

    await exchange(serverReturning({ attempts: [ghost] }).client)
    expect(await readSchedule(db)).toEqual([])

    await exchange(serverReturning().client, WEDNESDAY, laterContent)

    const [scheduled] = await readSchedule(db)
    expect(scheduled?.questionId).toBe('javascript/closures#ghost')
    expect(scheduled?.intervalStep).toBe(1)
  })
})
