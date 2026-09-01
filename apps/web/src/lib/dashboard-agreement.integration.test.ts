import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildArchive } from '@prep/content/archive'
import { DEFAULT_TIER } from '@prep/core'
import { user } from '@/db/schema'
import { createTestDatabase, useTestDatabase, type TestDatabase } from '@/db/testing'
import { createAccount } from '@/lib/account'
import { recordReview } from '@/lib/activity'
import { recordAttempt } from '@/lib/attempts'
import { getDashboard } from '@/lib/dashboard'
import { setExerciseStatus } from '@/lib/exercises'
import { markTopicLearned, pickTrackTier } from '@/lib/progress'
import { GET as archiveRoute } from '@/app/api/device/archive/route'
import { POST as signInRoute } from '@/app/api/device/session/route'
import { POST as syncRoute } from '@/app/api/device/sync/route'
// The phone's own modules, reached by path because an application is not a
// package and nothing imports one. Proving two surfaces agree means running
// both of them, which is the only reason a web test reaches across.
import { readArchiveContent } from '../../../mobile/src/archive/content'
import { installArchive } from '../../../mobile/src/archive/install'
import { createTestFileStore } from '../../../mobile/test-support/file-store'
import { recordAttempt as recordOnDevice } from '../../../mobile/src/db/attempts'
import { recordReview as recordReviewOnDevice } from '../../../mobile/src/db/activity'
import { setExerciseStatus as setExerciseStatusOnDevice } from '../../../mobile/src/db/exercises'
import { migrate } from '../../../mobile/src/db/migrate'
import { createTestDatabase as createDeviceDatabase } from '../../../mobile/test-support/database'
import { readDashboard } from '../../../mobile/src/library/dashboard'
import { markTopicLearned as markLearnedOnDevice } from '../../../mobile/src/library/learn'
import { createServerClient } from '../../../mobile/src/server/client'
import { syncProgress } from '../../../mobile/src/sync/sync'

/**
 * The laptop's dashboard and the phone's, after one exchange.
 *
 * Every number on either one is @prep/core's `summariseDashboard`, but each side
 * hands it rows out of its own store, and the whole promise of the offline
 * design is that the two stores say the same thing once they have talked. This
 * is the test that would notice a row one side reads and the other forgets.
 *
 * It runs against real Postgres, real SQLite, a real archive built from
 * `content/` and the real endpoint, because the agreement that matters is
 * between what the two surfaces actually show.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let archiveDir: string
let previousArchiveDir: string | undefined

const EMAIL = 'dashboard@prep.test'
const PASSWORD = 'a-password-long-enough'
const BASE = 'http://localhost'

const MONDAY = new Date('2026-08-24T09:00:00.000Z')
const TUESDAY = new Date('2026-08-25T09:00:00.000Z')
const WEDNESDAY = new Date('2026-08-26T09:00:00.000Z')

const PHONE = { id: 'test-phone', name: 'Test phone' }

/** The routes the app calls, dispatched in process rather than over a port. */
async function route(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (pathname === '/api/device/session') return signInRoute(request)
  if (pathname === '/api/device/archive') return archiveRoute(request)
  if (pathname === '/api/device/sync') return syncRoute(request)

  return Response.json({ error: `no route for ${pathname}` }, { status: 404 })
}

const deviceFetch: typeof globalThis.fetch = (input, init) =>
  route(new Request(input as string, init))

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)

  previousArchiveDir = process.env.CONTENT_ARCHIVE_DIR
  archiveDir = await mkdtemp(path.join(tmpdir(), 'prep-dashboard-archive-'))
  process.env.CONTENT_ARCHIVE_DIR = archiveDir
  await buildArchive(archiveDir)

  await ctx.db.delete(user)
  await createAccount(EMAIL, PASSWORD)
}, 120_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
  if (previousArchiveDir === undefined) delete process.env.CONTENT_ARCHIVE_DIR
  else process.env.CONTENT_ARCHIVE_DIR = previousArchiveDir
  if (archiveDir) await rm(archiveDir, { recursive: true, force: true })
})

describe('the two dashboards after a sync', () => {
  it('agree about readiness, the streak, the weakest topics and the exercises', async () => {
    const session = await createServerClient({
      baseUrl: BASE,
      token: null,
      fetch: deviceFetch,
    }).signIn(EMAIL, PASSWORD)

    const userId = session.user.id
    const client = createServerClient({ baseUrl: BASE, token: session.token, fetch: deviceFetch })

    const device = createDeviceDatabase()
    await migrate(device)
    const files = await createTestFileStore()
    await installArchive({ db: device, files, bytes: await client.downloadArchive() })
    const content = await readArchiveContent(device, files)

    // Two topics on one track, each carrying an exercise and a question the
    // bottom tier covers, so both surfaces have something to count.
    const usable = content.topics.filter(
      (topic) =>
        topic.technology === 'javascript' &&
        topic.exercises.length > 0 &&
        topic.questions.some((question) => question.form === 'choice' && question.tier === 'swe-1'),
    )
    const [onLaptop, onPhone] = usable
    expect(onLaptop, 'the curriculum has two usable topics').toBeDefined()
    expect(onPhone).toBeDefined()

    const laptopQuestion = onLaptop!.questions.find(
      (question) => question.form === 'choice' && question.tier === 'swe-1',
    )!
    const phoneQuestion = onPhone!.questions.find(
      (question) => question.form === 'choice' && question.tier === 'swe-1',
    )!

    // Monday, on the laptop: a topic read, a question answered, an exercise done.
    await markTopicLearned(userId, onLaptop!.technology, onLaptop!.directory)
    await recordAttempt(
      userId,
      {
        topicSlug: onLaptop!.slug,
        questionId: laptopQuestion.id,
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )
    await recordReview(userId, MONDAY)
    await setExerciseStatus(
      userId,
      onLaptop!.slug,
      onLaptop!.exercises[0]!.id,
      'completed',
      'done on the laptop',
      MONDAY,
    )
    // And a tier picked, which decides what both dashboards measure against.
    await pickTrackTier(userId, 'javascript', 'swe-2')

    // Tuesday, on the phone, with nothing switched on: a different topic, a
    // different question answered badly, a different exercise recorded.
    await markLearnedOnDevice(device, content, onPhone!.slug, DEFAULT_TIER, TUESDAY)
    await recordOnDevice(
      device,
      {
        topicSlug: onPhone!.slug,
        questionId: phoneQuestion.id,
        answer: '0',
        result: 'failed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-on-the-phone', now: TUESDAY },
    )
    await recordReviewOnDevice(device, TUESDAY)
    await setExerciseStatusOnDevice(
      device,
      {
        topicSlug: onPhone!.slug,
        exerciseId: onPhone!.exercises[0]!.id,
        status: 'completed',
        notes: 'done on the phone',
      },
      TUESDAY,
    )

    await syncProgress({ db: device, content, client, device: PHONE }, WEDNESDAY)

    const laptop = await getDashboard(userId, WEDNESDAY)
    const phone = await readDashboard(device, content, WEDNESDAY)

    // The whole page rather than a field at a time, because a number nobody
    // thought to name here is exactly the one that would drift.
    expect(phone).toEqual(laptop)

    // And it is a dashboard with something on it, so the agreement above is not
    // two empty pages matching.
    expect(laptop.questions.attempted).toBe(2)
    expect(laptop.exercises.completed).toBe(2)
    expect(laptop.streak.current).toBeGreaterThan(0)
    expect(laptop.weakest.map((topic) => topic.slug)).toContain(onPhone!.slug)
    expect(laptop.tracks.find((track) => track.id === 'javascript')?.readiness.tier).toBe('swe-2')

    device.close()
  }, 120_000)
})
