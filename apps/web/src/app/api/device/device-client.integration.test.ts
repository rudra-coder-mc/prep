import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildArchive } from '@prep/content/archive'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_TIER } from '@prep/core'
import { attempts, dailyActivity, reviewSchedule, user } from '@/db/schema'
import { createTestDatabase, useTestDatabase, type TestDatabase } from '@/db/testing'
import { createAccount } from '@/lib/account'
import { recordReview } from '@/lib/activity'
import { recordAttempt } from '@/lib/attempts'
import { markTopicLearned } from '@/lib/progress'
import { GET as archiveRoute } from '@/app/api/device/archive/route'
import { GET as audioRoute } from '@/app/api/device/audio/[key]/route'
import { POST as audioSizesRoute } from '@/app/api/device/audio/route'
import { GET as versionRoute } from '@/app/api/device/archive/version/route'
import { GET as checkRoute, POST as signInRoute } from '@/app/api/device/session/route'
import { POST as syncRoute } from '@/app/api/device/sync/route'
// The phone's own modules, reached by path because an application is not a
// package and nothing imports one. This file is the exception and it is a test:
// proving two halves of a wire agree means holding both ends of it at once.
import { readArchiveContent } from '../../../../../mobile/src/archive/content'
import { archivePath, installArchive } from '../../../../../mobile/src/archive/install'
import { createTestFileStore } from '../../../../../mobile/test-support/file-store'
import { downloadRecordings, surveyTrackAudio } from '../../../../../mobile/src/audio/download'
import { recordingPath } from '../../../../../mobile/src/audio/library'
import { migrate } from '../../../../../mobile/src/db/migrate'
import { createTestDatabase as createDeviceDatabase } from '../../../../../mobile/test-support/database'
import { createServerClient, ServerError } from '../../../../../mobile/src/server/client'
import { readActivity } from '../../../../../mobile/src/db/activity'
import { recordAttempt as recordOnDevice } from '../../../../../mobile/src/db/attempts'
import { readSchedule } from '../../../../../mobile/src/db/schedule'
import { markTopicLearned as markLearnedOnDevice } from '../../../../../mobile/src/library/learn'
import { syncProgress } from '../../../../../mobile/src/sync/sync'

/**
 * The phone's client against the real endpoints, the real better-auth and a real
 * archive built from `content/`.
 *
 * Every other test on either side of this wire uses a stand-in for the other
 * side, so this is the one that would notice the two drifting apart: a field
 * renamed on the server, a date that stopped being a string, an archive whose
 * layout moved. It goes from `npm run content:archive` to a curriculum readable
 * on a device with the server switched off, which is the whole of task 29's
 * first half.
 */
let ctx: TestDatabase
let restore: () => Promise<void>
let archiveDir: string
let previousArchiveDir: string | undefined
let cacheDir: string
let previousCacheDir: string | undefined

const EMAIL = 'phone@prep.test'
const PASSWORD = 'a-password-long-enough'

/** The routes the app actually calls, dispatched in process rather than over a port. */
async function route(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)

  if (pathname === '/api/device/session') {
    return request.method === 'POST' ? signInRoute(request) : checkRoute(request)
  }
  if (pathname === '/api/device/archive/version') return versionRoute(request)
  if (pathname === '/api/device/archive') return archiveRoute(request)
  if (pathname === '/api/device/audio') return audioSizesRoute(request)
  if (pathname === '/api/device/sync') return syncRoute(request)

  const recording = /^\/api\/device\/audio\/([0-9a-f]{64})$/.exec(pathname)
  if (recording) {
    return audioRoute(request, { params: Promise.resolve({ key: recording[1]! }) })
  }

  return Response.json({ error: `no route for ${pathname}` }, { status: 404 })
}

const deviceFetch: typeof globalThis.fetch = (input, init) =>
  route(new Request(input as string, init))

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)

  previousArchiveDir = process.env.CONTENT_ARCHIVE_DIR
  archiveDir = await mkdtemp(path.join(tmpdir(), 'prep-device-archive-'))
  process.env.CONTENT_ARCHIVE_DIR = archiveDir
  await buildArchive(archiveDir)

  // A cache of its own rather than the machine's, so what the audio endpoints
  // are asked for is what this test put there.
  previousCacheDir = process.env.SPEECH_CACHE_DIR
  cacheDir = await mkdtemp(path.join(tmpdir(), 'prep-device-speech-'))
  process.env.SPEECH_CACHE_DIR = cacheDir

  await ctx.db.delete(user)
  await createAccount(EMAIL, PASSWORD)
}, 120_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
  if (previousArchiveDir === undefined) delete process.env.CONTENT_ARCHIVE_DIR
  else process.env.CONTENT_ARCHIVE_DIR = previousArchiveDir
  if (archiveDir) await rm(archiveDir, { recursive: true, force: true })

  if (previousCacheDir === undefined) delete process.env.SPEECH_CACHE_DIR
  else process.env.SPEECH_CACHE_DIR = previousCacheDir
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true })
})

/** The origin the routes are addressed at. better-auth checks it against its own. */
const BASE = 'http://localhost'

const anonymous = () => createServerClient({ baseUrl: BASE, token: null, fetch: deviceFetch })
const carrying = (token: string) => createServerClient({ baseUrl: BASE, token, fetch: deviceFetch })

describe('a device signing in', () => {
  it('gets a token the other endpoints accept', async () => {
    const session = await anonymous().signIn(EMAIL, PASSWORD)

    expect(session.user.email).toBe(EMAIL)
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())

    const checked = await carrying(session.token).checkSession()
    expect(checked.user.email).toBe(EMAIL)
  })

  it('reads a refused password as unauthorised rather than as being offline', async () => {
    const error = await anonymous()
      .signIn(EMAIL, 'not-the-password')
      .catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ServerError)
    expect((error as ServerError).kind).toBe('unauthorised')
  })

  it('is refused everything else without a token', async () => {
    await expect(anonymous().archiveVersion()).rejects.toMatchObject({ kind: 'unauthorised' })
  })
})

describe('a device taking the archive', () => {
  it('installs what the build wrote and reads the curriculum back off the device', async () => {
    const { token } = await anonymous().signIn(EMAIL, PASSWORD)
    const client = carrying(token)

    const available = await client.archiveVersion()
    expect(available.topics).toBeGreaterThan(0)
    expect(available.questions).toBeGreaterThan(0)

    const db = createDeviceDatabase()
    await migrate(db)
    const files = await createTestFileStore()

    const installed = await installArchive({ db, files, bytes: await client.downloadArchive() })
    expect(installed).toBe(available.version)

    // Read the way the app reads it, with nothing switched on.
    const content = await readArchiveContent(db, files)

    expect(content.version).toBe(available.version)
    expect(content.topics).toHaveLength(available.topics)
    expect(content.topics.reduce((total, topic) => total + topic.questions.length, 0)).toBe(
      available.questions,
    )

    // Every topic's pre-rendered page came with it, which is what the phone opens.
    const directory = archivePath(installed)
    for (const topic of content.topics) {
      expect(await files.exists(`${directory}/${topic.lesson}`)).toBe(true)
    }

    // The answers travel with the questions, because a phone with the server off
    // has nothing to ask. See
    // docs/decisions/0037-the-mobile-archive-carries-the-answers.md.
    const choice = content.topics
      .flatMap((topic) => topic.questions)
      .find((question) => question.form === 'choice')
    expect(choice?.correctOption).toEqual(expect.any(Number))

    db.close()
  }, 120_000)
})

/**
 * The other half of what a device downloads. Audio is not in the archive: it is
 * two orders of magnitude larger, so it comes a track at a time, priced before
 * it is fetched. See
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 */
describe('a device taking a track of audio', () => {
  it('is told what the track weighs, downloads it, and asks for nothing twice', async () => {
    const { token } = await anonymous().signIn(EMAIL, PASSWORD)
    const client = carrying(token)

    const db = createDeviceDatabase()
    await migrate(db)
    const files = await createTestFileStore()
    await installArchive({ db, files, bytes: await client.downloadArchive() })
    const content = await readArchiveContent(db, files)

    const technology = content.technologies[0]!.id
    const track = { files, client, content, technology }

    // Two of the track's keys have been recorded on the machine and the rest
    // have not, which is exactly the state a half-narrated track is in.
    const recorded = (await surveyTrackAudio(track)).wanted.slice(0, 2)
    for (const [at, key] of recorded.entries()) {
      await writeFile(path.join(cacheDir, `${key}.opus`), new Uint8Array(100 + at))
    }

    const survey = await surveyTrackAudio(track)
    expect(survey.total).toBeGreaterThan(0)
    expect(survey.held).toEqual({ count: 0, bytes: 0 })
    expect(survey.pending).toEqual({ count: 2, bytes: 201 })
    expect(survey.unrecorded).toBe(survey.total - 2)
    expect(survey.order).toEqual(recorded)

    const run = await downloadRecordings({ files, client, keys: survey.order })
    expect(run).toEqual({ downloaded: 2, bytes: 201, unrecorded: 0 })
    for (const key of recorded) expect(await files.exists(recordingPath(key))).toBe(true)

    // The recordings are now the device's, and the next survey prices only what
    // is left rather than the track.
    const after = await surveyTrackAudio(track)
    expect(after.held).toEqual({ count: 2, bytes: 201 })
    expect(after.pending).toEqual({ count: 0, bytes: 0 })
    expect(after.order).toEqual([])

    db.close()
  }, 120_000)
})

/**
 * The whole of task 33, both ends of it at once: a session answered on the
 * phone and a session answered on the laptop, merged in one exchange.
 *
 * Neither side is authoritative and neither is told where a question landed.
 * Each rebuilds its own schedule from the attempts it now holds, through the
 * same `replaySchedule`, which is the only reason they can agree. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
describe('a phone and a laptop answering the same bank', () => {
  const MONDAY = new Date('2026-08-24T09:00:00.000Z')
  const TUESDAY = new Date('2026-08-25T09:00:00.000Z')
  const WEDNESDAY = new Date('2026-08-26T09:00:00.000Z')

  const phone = { id: 'test-phone', name: 'Test phone' }

  /** Where each side thinks a question sits, for the questions with a history. */
  async function agreementOn(
    device: ReturnType<typeof createDeviceDatabase>,
    userId: string,
    keys: string[],
  ) {
    const stored = await ctx.db
      .select({
        questionId: reviewSchedule.questionId,
        intervalStep: reviewSchedule.intervalStep,
        dueAt: reviewSchedule.dueAt,
        lastResult: reviewSchedule.lastResult,
      })
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, userId))

    const onDevice = await readSchedule(device)
    const pick = <T extends { questionId: string }>(rows: T[]) =>
      keys.map((key) => rows.find((row) => row.questionId === key))

    return {
      server: pick(stored),
      device: pick(onDevice).map((row) =>
        row
          ? {
              questionId: row.questionId,
              intervalStep: row.intervalStep,
              dueAt: row.dueAt,
              lastResult: row.lastResult,
            }
          : undefined,
      ),
    }
  }

  it('merges in both directions, loses nothing, and agrees about what is due', async () => {
    const session = await anonymous().signIn(EMAIL, PASSWORD)
    const client = carrying(session.token)
    const userId = session.user.id

    const device = createDeviceDatabase()
    await migrate(device)
    const files = await createTestFileStore()
    await installArchive({ db: device, files, bytes: await client.downloadArchive() })
    const content = await readArchiveContent(device, files)

    const topic = content.topics.find(
      (candidate) =>
        candidate.questions.filter((question) => question.form === 'choice').length > 1,
    )
    const [onLaptop, onPhone] = topic!.questions.filter((question) => question.form === 'choice')
    const laptopKey = `${topic!.slug}#${onLaptop!.id}`
    const phoneKey = `${topic!.slug}#${onPhone!.id}`

    // The laptop reads the topic and answers one of its questions on Monday.
    await markTopicLearned(userId, topic!.technology, topic!.directory)
    await recordAttempt(
      userId,
      {
        topicSlug: topic!.slug,
        questionId: onLaptop!.id,
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      MONDAY,
    )
    await recordReview(userId, MONDAY)

    // The phone, with nothing switched on, reads the same topic and answers the
    // other question a day later.
    await markLearnedOnDevice(device, content, topic!.slug, DEFAULT_TIER, TUESDAY)
    await recordOnDevice(
      device,
      {
        topicSlug: topic!.slug,
        questionId: onPhone!.id,
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-on-the-phone', now: TUESDAY },
    )

    const first = await syncProgress({ db: device, content, client, device: phone }, WEDNESDAY)
    expect(first.sent).toBe(1)

    // The server has what the phone answered, and the phone has what the laptop
    // answered, and neither has anything twice.
    const onServer = await ctx.db
      .select({ id: attempts.id, questionId: attempts.questionId })
      .from(attempts)
      .where(eq(attempts.userId, userId))
    expect(onServer.map((row) => row.questionId).sort()).toEqual([laptopKey, phoneKey].sort())
    expect(onServer.some((row) => row.id === 'answered-on-the-phone')).toBe(true)

    const held = await device.all<{ question_id: string }>('select question_id from attempts')
    expect(held.map((row) => row.question_id).sort()).toEqual([laptopKey, phoneKey].sort())

    // Only the questions with a history are compared. One enrolled on both sides
    // and never answered is due from the moment each side was told the topic had
    // been read, which is two different moments and nothing derives it.
    const agreed = await agreementOn(device, userId, [laptopKey, phoneKey])
    expect(agreed.device).toEqual(agreed.server)
    expect(agreed.server[0]).toMatchObject({ intervalStep: 1, lastResult: 'passed' })

    // Each answer counts on the day it was given rather than the day it arrived,
    // which is what the streak is derived from on both sides.
    const serverDays = await ctx.db
      .select({ day: dailyActivity.day, reviewed: dailyActivity.reviewed })
      .from(dailyActivity)
      .where(eq(dailyActivity.userId, userId))
    expect(
      (await readActivity(device)).map(({ day, reviewed }) => ({ day, reviewed })).sort(byDay),
    ).toEqual(serverDays.sort(byDay))

    // A second exchange with nothing new to say changes nothing on either side.
    const second = await syncProgress({ db: device, content, client, device: phone }, WEDNESDAY)
    expect(second.sent).toBe(0)
    expect(await device.all('select id from attempts')).toHaveLength(2)
    expect(await agreementOn(device, userId, [laptopKey, phoneKey])).toEqual(agreed)

    // And it keeps working: another answer on each side, one more exchange.
    // Both are dated now rather than in the fixture's week, because the server
    // hands out a watermark of its own clock and asks by when it learned of an
    // attempt: one recorded before the last exchange would never be asked for.
    const later = new Date()
    await recordAttempt(
      userId,
      {
        topicSlug: topic!.slug,
        questionId: onLaptop!.id,
        answer: '0',
        result: 'failed',
        form: 'choice',
        hintsUsed: 0,
      },
      later,
    )
    await recordOnDevice(
      device,
      {
        topicSlug: topic!.slug,
        questionId: onPhone!.id,
        answer: '0',
        result: 'passed',
        form: 'choice',
        hintsUsed: 0,
      },
      { id: 'answered-on-the-phone-again', now: later },
    )

    await syncProgress({ db: device, content, client, device: phone }, later)

    const after = await agreementOn(device, userId, [laptopKey, phoneKey])
    expect(after.device).toEqual(after.server)
    // A wrong answer goes to the bottom rung whatever it had climbed, and a
    // second right one climbs to the second, on both sides.
    expect(after.server[0]).toMatchObject({ intervalStep: 0, lastResult: 'failed' })
    expect(after.server[1]).toMatchObject({ intervalStep: 2, lastResult: 'passed' })

    device.close()
  }, 120_000)
})

const byDay = (a: { day: string }, b: { day: string }) => a.day.localeCompare(b.day)
