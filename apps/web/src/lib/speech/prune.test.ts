// @vitest-environment node
import { beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getTopic } from '@prep/content'
import { pruneRecordings } from './prune'
import { scriptKey } from './cache'

/**
 * Against the real `content/`, for the same reason `spoken-content.test.ts` is:
 * what prune has to get right is that the keys it keeps are the keys the app
 * would ask for. A fixture would prove the set difference works and not that
 * the two sides agree on what a current recording is.
 */
const STALE = `${'a'.repeat(64)}.opus`

let current: string
let directory: string

beforeAll(async () => {
  const topic = await getTopic('javascript', 'closures')
  const first = topic?.narration?.[0]

  if (!first) throw new Error('this test needs a narrated topic')

  current = `${scriptKey(first.script)}.opus`
})

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prep-prune-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

async function put(...names: string[]) {
  for (const name of names) await writeFile(join(directory, name), 'audio')
}

describe('pruneRecordings', () => {
  it('keeps a recording a script in content still hashes to', async () => {
    await put(current)

    expect(await pruneRecordings(directory)).toEqual({ deleted: [], kept: 1 })
    expect(await readdir(directory)).toEqual([current])
  })

  it('deletes a recording nothing hashes to any more', async () => {
    await put(current, STALE)

    const pruned = await pruneRecordings(directory)

    expect(pruned).toEqual({ deleted: [STALE.replace('.opus', '')], kept: 1 })
    expect(await readdir(directory)).toEqual([current])
  })

  /**
   * Recordings were WAV before they were compressed, and pruning has to run
   * before the transcode rather than after it, so that the transcode is not
   * spent on files nothing points at. That only works if a stale WAV is still
   * something this can delete.
   */
  it('deletes a stale recording left over in the old uncompressed format', async () => {
    const oldFormat = `${'c'.repeat(64)}.wav`
    await put(current, oldFormat)

    expect(await pruneRecordings(directory)).toEqual({ deleted: ['c'.repeat(64)], kept: 1 })
    expect(await readdir(directory)).toEqual([current])
  })

  it('keeps a recording still spoken by something, whichever format it is in', async () => {
    const stillWav = current.replace('.opus', '.wav')
    await put(stillWav)

    expect(await pruneRecordings(directory)).toEqual({ deleted: [], kept: 1 })
    expect(await readdir(directory)).toEqual([stillWav])
  })

  it('leaves alone anything that is not a recording, including a half-written one', async () => {
    const partial = `${'b'.repeat(64)}.4f1c.part`
    await put(partial, 'notes.txt')

    expect(await pruneRecordings(directory)).toEqual({ deleted: [], kept: 0 })
    expect((await readdir(directory)).sort()).toEqual([partial, 'notes.txt'].sort())
  })

  it('has nothing to do when no recording has ever been made', async () => {
    expect(await pruneRecordings(join(directory, 'never-written'))).toEqual({
      deleted: [],
      kept: 0,
    })
  })
})
