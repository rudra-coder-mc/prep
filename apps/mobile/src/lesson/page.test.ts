import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { archiveTopic } from '../../test-support/content'
import { createTestDatabase } from '../../test-support/database'
import { createTestFileStore } from '../../test-support/file-store'
import { archivePath } from '../archive/install'
import { migrate } from '../db/migrate'
import { writeSetting } from '../db/settings'
import { lessonOnDevice } from './page'

/**
 * A WebView pointed at a file that is not there shows an empty screen and says
 * nothing about why, so the page is looked for before it is opened.
 */
let db: ReturnType<typeof createTestDatabase>
let files: Awaited<ReturnType<typeof createTestFileStore>>

const topic = archiveTopic()
const bytes = new TextEncoder().encode('<!doctype html><main id="lesson"></main>')

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  files = await createTestFileStore()
})

afterEach(() => db?.close())

async function install(version: string) {
  await writeSetting(db, 'archive-version', version)
  await files.makeDirectory(`${archivePath(version)}/lessons/javascript`)
}

describe('lessonOnDevice', () => {
  it('finds the page the archive says the topic has', async () => {
    await install('v1')
    await files.writeBytes(`${archivePath('v1')}/${topic.lesson}`, bytes)

    expect(await lessonOnDevice(db, files, topic)).toBe(`${archivePath('v1')}/${topic.lesson}`)
  })

  it('holds no page for a topic whose file the archive is missing', async () => {
    await install('v1')

    expect(await lessonOnDevice(db, files, topic)).toBeNull()
  })

  it('holds no page at all until an archive has been installed', async () => {
    expect(await lessonOnDevice(db, files, topic)).toBeNull()
  })
})
