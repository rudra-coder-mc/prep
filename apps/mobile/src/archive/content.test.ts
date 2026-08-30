import { zipSync } from 'fflate'
import { beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { createTestDatabase } from '../../test-support/database'
import { readArchiveContent } from './content'
import { installArchive } from './install'
import { createTestFileStore } from '../../test-support/file-store'

/**
 * Reading the curriculum back off the device.
 *
 * The check is shallow on purpose: the archive was written by a build that had
 * already validated every topic against the content schema, so re-validating
 * five hundred questions at launch would spend a second proving something that
 * cannot have changed. What is checked is that this is an archive at all, since
 * the alternative is the app crashing on `topics.map`.
 */
const encoder = new TextEncoder()

let db: ReturnType<typeof createTestDatabase>
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  files = await createTestFileStore()
})

const CONTENT = {
  version: 'v1',
  technologies: [{ id: 'javascript', topics: ['javascript/closures'] }],
  topics: [
    {
      slug: 'closures',
      technology: 'javascript',
      directory: 'closures',
      title: 'Closures',
      summary: 'What a closure captures.',
      order: 1,
      tags: [],
      prerequisites: [],
      lesson: 'lessons/javascript/closures.html',
      questions: [],
      exercises: [],
      narration: null,
    },
  ],
}

async function install(content: unknown) {
  await installArchive({
    db,
    files,
    bytes: zipSync({ 'content.json': encoder.encode(JSON.stringify(content)) }),
  })
}

describe('reading the installed content', () => {
  it('reads back what was installed', async () => {
    await install(CONTENT)

    const content = await readArchiveContent(db, files)

    expect(content.version).toBe('v1')
    expect(content.topics).toHaveLength(1)
    expect(content.topics[0]?.title).toBe('Closures')
  })

  it('says so when nothing has been installed', async () => {
    await expect(readArchiveContent(db, files)).rejects.toThrow(/no content/i)
  })

  it('refuses a content file that is not an archive of topics', async () => {
    await install({ version: 'v1', technologies: [] })

    await expect(readArchiveContent(db, files)).rejects.toThrow(/not an archive/i)
  })
})
