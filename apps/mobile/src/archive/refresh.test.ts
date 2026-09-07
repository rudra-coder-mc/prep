import { zipSync } from 'fflate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type ArchiveContent } from '@prep/content/archive/types'
import { migrate } from '../db/migrate'
import { readSchedule } from '../db/schedule'
import { createTestDatabase } from '../../test-support/database'
import { createTestFileStore } from '../../test-support/file-store'
import { archiveContent, archiveQuestion, archiveTopic } from '../../test-support/content'
import { ServerError, type ServerClient } from '../server/client'
import { installedVersion } from './install'
import { refreshArchive } from './refresh'
import { AUDIO_ROOT, recordingPath } from '../audio/library'

/**
 * The one exchange that replaces the curriculum.
 *
 * A refresh asks before it downloads, because the answer is a megabyte over a
 * phone connection and the version is the whole of the decision. See
 * docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 */
let db: ReturnType<typeof createTestDatabase>
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  files = await createTestFileStore()
})

const encoder = new TextEncoder()

function archiveOf(version: string): Uint8Array {
  return zipSync({
    'content.json': encoder.encode(JSON.stringify({ version, technologies: [], topics: [] })),
  })
}

function archiveWithContent(version: string, content: ArchiveContent): Uint8Array {
  return zipSync({
    'content.json': encoder.encode(JSON.stringify({ ...content, version })),
  })
}

function clientFor(version: string, downloaded = version): ServerClient {
  return {
    signIn: vi.fn(),
    checkSession: vi.fn(),
    archiveVersion: vi.fn(async () => ({
      version,
      bytes: 100,
      topics: 1,
      questions: 1,
      exercises: 0,
      narrationSections: 0,
    })),
    downloadArchive: vi.fn(async () => archiveOf(downloaded)),
  } as unknown as ServerClient
}

describe('refreshing the content', () => {
  it('downloads and installs when the device holds nothing', async () => {
    const client = clientFor('v1')

    expect(await refreshArchive({ db, files, client })).toEqual({
      kind: 'installed',
      version: 'v1',
      previous: null,
    })
    expect(await installedVersion(db)).toBe('v1')
  })

  it('replaces an older archive and says what it replaced', async () => {
    await refreshArchive({ db, files, client: clientFor('v1') })

    expect(await refreshArchive({ db, files, client: clientFor('v2') })).toEqual({
      kind: 'installed',
      version: 'v2',
      previous: 'v1',
    })
  })

  // The version is a hash of the files the archive was built from, so equal
  // versions mean equal archives and a megabyte that need not be spent.
  it('downloads nothing when the version has not moved', async () => {
    await refreshArchive({ db, files, client: clientFor('v1') })

    const client = clientFor('v1')
    expect(await refreshArchive({ db, files, client })).toEqual({ kind: 'current', version: 'v1' })
    expect(client.downloadArchive).not.toHaveBeenCalled()
  })

  /**
   * A rebuild between asking and downloading hands over an archive the device
   * never asked for, and the URL cannot tell the two apart. What arrived is
   * still one whole build, so it is installed under the version it carries
   * rather than under the version that was asked for.
   */
  it('records what arrived rather than what was asked for', async () => {
    const result = await refreshArchive({ db, files, client: clientFor('v1', 'v2') })

    expect(result).toEqual({ kind: 'installed', version: 'v2', previous: null })
    expect(await installedVersion(db)).toBe('v2')
  })

  it('leaves the failure to the caller when the server cannot be reached', async () => {
    const client = clientFor('v1')
    client.archiveVersion = vi.fn(async () => {
      throw new ServerError('offline', 'work could not be reached')
    })

    await expect(refreshArchive({ db, files, client })).rejects.toBeInstanceOf(ServerError)
    expect(await installedVersion(db)).toBeNull()
  })

  it('enrols questions of topics marked learned before the archive held them', async () => {
    const MONDAY = new Date('2026-08-24T09:00:00.000Z')
    // Laptop synced a mark for a newly added topic that this phone's archive does not have yet
    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      'javascript/prototypes',
      MONDAY.toISOString(),
    ])

    expect(await readSchedule(db)).toEqual([])

    const updatedCurriculum = archiveContent([
      archiveTopic({
        slug: 'javascript/prototypes',
        directory: 'prototypes',
        technology: 'javascript',
        questions: [
          archiveQuestion({ id: 'chain', tier: 'swe-1' }),
          archiveQuestion({ id: 'dunder', tier: 'swe-2' }),
        ],
      }),
    ])

    const client = {
      archiveVersion: vi.fn(async () => ({
        version: 'v2',
        bytes: 200,
        topics: 1,
        questions: 2,
        exercises: 0,
        narrationSections: 0,
      })),
      downloadArchive: vi.fn(async () => archiveWithContent('v2', updatedCurriculum)),
    } as unknown as ServerClient

    await refreshArchive({ db, files, client })

    const schedule = await readSchedule(db)
    expect(schedule.map((row) => row.questionId)).toEqual(['javascript/prototypes#chain'])
    expect(schedule[0]?.dueAt).toEqual(MONDAY)
    expect(schedule[0]?.intervalStep).toBe(0)
  })

  it('respects track tier picks when enrolling questions after refresh', async () => {
    const MONDAY = new Date('2026-08-24T09:00:00.000Z')
    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      'javascript/prototypes',
      MONDAY.toISOString(),
    ])
    await db.run('insert into track_tier (technology, tier, updated_at) values (?, ?, ?)', [
      'javascript',
      'swe-2',
      MONDAY.toISOString(),
    ])

    const updatedCurriculum = archiveContent([
      archiveTopic({
        slug: 'javascript/prototypes',
        directory: 'prototypes',
        technology: 'javascript',
        questions: [
          archiveQuestion({ id: 'chain', tier: 'swe-1' }),
          archiveQuestion({ id: 'dunder', tier: 'swe-2' }),
        ],
      }),
    ])

    const client = {
      archiveVersion: vi.fn(async () => ({
        version: 'v2',
        bytes: 200,
        topics: 1,
        questions: 2,
        exercises: 0,
        narrationSections: 0,
      })),
      downloadArchive: vi.fn(async () => archiveWithContent('v2', updatedCurriculum)),
    } as unknown as ServerClient

    await refreshArchive({ db, files, client })

    const schedule = await readSchedule(db)
    expect(schedule.map((row) => row.questionId).sort()).toEqual([
      'javascript/prototypes#chain',
      'javascript/prototypes#dunder',
    ])
  })

  it('replays prior attempts for newly arrived questions onto their ladder rung', async () => {
    const MONDAY = new Date('2026-08-24T09:00:00.000Z')
    const TUESDAY = new Date('2026-08-25T09:00:00.000Z')
    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      'javascript/prototypes',
      MONDAY.toISOString(),
    ])
    // An attempt recorded elsewhere and synced before the archive had the question
    await db.run(
      `insert into attempts
         (id, question_id, topic_slug, answer, result, confidence, hints_used, notes, attempted_at, synced)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        'att-1',
        'javascript/prototypes#chain',
        'javascript/prototypes',
        '0',
        'passed',
        3,
        0,
        null,
        TUESDAY.toISOString(),
      ],
    )

    const updatedCurriculum = archiveContent([
      archiveTopic({
        slug: 'javascript/prototypes',
        directory: 'prototypes',
        technology: 'javascript',
        questions: [archiveQuestion({ id: 'chain', tier: 'swe-1' })],
      }),
    ])

    const client = {
      archiveVersion: vi.fn(async () => ({
        version: 'v2',
        bytes: 200,
        topics: 1,
        questions: 1,
        exercises: 0,
        narrationSections: 0,
      })),
      downloadArchive: vi.fn(async () => archiveWithContent('v2', updatedCurriculum)),
    } as unknown as ServerClient

    await refreshArchive({ db, files, client })

    const [scheduled] = await readSchedule(db)
    expect(scheduled?.questionId).toBe('javascript/prototypes#chain')
    expect(scheduled?.intervalStep).toBe(1)
  })

  it('drops recordings no current key names while keeping unchanged scripts across a refresh', async () => {
    const keptKey = '1'.repeat(64)
    const staleKey = '2'.repeat(64)

    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(keptKey), new Uint8Array(100))
    await files.writeBytes(recordingPath(staleKey), new Uint8Array(100))

    const updatedCurriculum = archiveContent([
      archiveTopic({
        slug: 'javascript/prototypes',
        directory: 'prototypes',
        technology: 'javascript',
        narration: [{ title: 'Intro', heading: 'Intro', script: '...', audioKey: keptKey }],
        questions: [],
      }),
    ])

    const client = {
      archiveVersion: vi.fn(async () => ({
        version: 'v2',
        bytes: 200,
        topics: 1,
        questions: 0,
        exercises: 0,
        narrationSections: 1,
      })),
      downloadArchive: vi.fn(async () => archiveWithContent('v2', updatedCurriculum)),
    } as unknown as ServerClient

    await refreshArchive({ db, files, client })

    expect(await files.exists(recordingPath(keptKey))).toBe(true)
    expect(await files.exists(recordingPath(staleKey))).toBe(false)
  })
})
