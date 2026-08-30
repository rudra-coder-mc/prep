import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildArchive } from '@prep/content/archive'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { user } from '@/db/schema'
import { createTestDatabase, useTestDatabase, type TestDatabase } from '@/db/testing'
import { createAccount } from '@/lib/account'
import { GET as archiveRoute } from '@/app/api/device/archive/route'
import { GET as versionRoute } from '@/app/api/device/archive/version/route'
import { GET as checkRoute, POST as signInRoute } from '@/app/api/device/session/route'
// The phone's own modules, reached by path because an application is not a
// package and nothing imports one. This file is the exception and it is a test:
// proving two halves of a wire agree means holding both ends of it at once.
import { readArchiveContent } from '../../../../../mobile/src/archive/content'
import { archivePath, installArchive } from '../../../../../mobile/src/archive/install'
import { createTestFileStore } from '../../../../../mobile/test-support/file-store'
import { migrate } from '../../../../../mobile/src/db/migrate'
import { createTestDatabase as createDeviceDatabase } from '../../../../../mobile/test-support/database'
import { createServerClient, ServerError } from '../../../../../mobile/src/server/client'

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

    // Every topic's pre-rendered page came with it, which is what task 32 reads.
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
