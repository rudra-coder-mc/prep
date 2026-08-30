import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { unzipSync } from 'fflate'
import { ARCHIVE_FILE } from './location'
import { writeArchiveZip } from './zip'

let directory = ''

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'prep-zip-'))
  await mkdir(path.join(directory, 'lessons'), { recursive: true })
  await writeFile(path.join(directory, 'content.json'), '{"version":"abc"}')
  await writeFile(path.join(directory, 'lessons', 'one.html'), '<!doctype html><p>one</p>')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

async function entries(): Promise<Record<string, string>> {
  const zip = unzipSync(await readFile(path.join(directory, ARCHIVE_FILE)))
  return Object.fromEntries(
    Object.entries(zip).map(([name, bytes]) => [name, new TextDecoder().decode(bytes)]),
  )
}

describe('writeArchiveZip', () => {
  it('carries every named file at the path the archive addresses it by', async () => {
    await writeArchiveZip(directory, ['content.json', 'lessons/one.html'])

    expect(await entries()).toEqual({
      'content.json': '{"version":"abc"}',
      'lessons/one.html': '<!doctype html><p>one</p>',
    })
  })

  /**
   * A device unpacks this over what it holds, so anything in here that the
   * manifest does not name is a file it can never account for or delete.
   */
  it('carries nothing the manifest does not name', async () => {
    await writeFile(path.join(directory, 'lessons', 'stale.html'), 'left by an older build')

    await writeArchiveZip(directory, ['content.json', 'lessons/one.html'])

    expect(Object.keys(await entries())).not.toContain('lessons/stale.html')
  })

  it('reports the size of what it wrote, which is what a device is told to expect', async () => {
    const bytes = await writeArchiveZip(directory, ['content.json', 'lessons/one.html'])

    const written = await readFile(path.join(directory, ARCHIVE_FILE))
    expect(bytes).toBe(written.byteLength)
  })

  it('compresses, since the archive is JSON and markup over a phone connection', async () => {
    const repetitive = 'the same sentence over and over. '.repeat(500)
    await writeFile(path.join(directory, 'content.json'), repetitive)

    const bytes = await writeArchiveZip(directory, ['content.json'])

    expect(bytes).toBeLessThan(repetitive.length / 4)
  })
})
