// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fakeOpus } from './audio.fixture'
import { transcodeRecordings } from './transcode'

const OPUS = fakeOpus(1, 2)
const KEY = 'a'.repeat(64)
const OTHER = 'b'.repeat(64)

let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prep-transcode-'))
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(OPUS)),
  )
})

afterEach(async () => {
  vi.unstubAllGlobals()
  await rm(directory, { recursive: true, force: true })
})

async function put(name: string, contents = 'RIFF....WAVE and then some audio') {
  await writeFile(join(directory, name), contents)
}

describe('transcodeRecordings', () => {
  it('replaces a WAV with an Opus recording under the same key', async () => {
    await put(`${KEY}.wav`)

    const run = await transcodeRecordings(directory)

    expect(run.converted).toEqual([KEY])
    expect(await readdir(directory)).toEqual([`${KEY}.opus`])
    expect(new Uint8Array(await readFile(join(directory, `${KEY}.opus`)))).toEqual(OPUS)
  })

  it('reports what the cache weighed before and after', async () => {
    await put(`${KEY}.wav`, 'x'.repeat(1000))

    const run = await transcodeRecordings(directory)

    expect(run.bytesBefore).toBe(1000)
    expect(run.bytesAfter).toBe(OPUS.byteLength)
  })

  it('has nothing to do on a cache that is already compressed', async () => {
    await put(`${KEY}.opus`)

    const run = await transcodeRecordings(directory)

    expect(run).toMatchObject({ converted: [], alreadyCompressed: 0 })
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  /**
   * A run killed between writing the Opus and deleting the WAV leaves both. The
   * recording is already made, so finishing the job is deleting the leftover
   * rather than spending the engine on it again.
   */
  it('clears a leftover WAV without transcoding it a second time', async () => {
    await put(`${KEY}.wav`)
    await put(`${KEY}.opus`)

    const run = await transcodeRecordings(directory)

    expect(run).toMatchObject({ converted: [], alreadyCompressed: 1 })
    expect(await readdir(directory)).toEqual([`${KEY}.opus`])
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('does not count a leftover it skipped as a saving it made', async () => {
    await put(`${KEY}.wav`, 'x'.repeat(1000))
    await put(`${KEY}.opus`)

    const run = await transcodeRecordings(directory)

    expect(run).toMatchObject({ alreadyCompressed: 1, bytesBefore: 0, bytesAfter: 0 })
  })

  it('leaves alone anything that is not a recording', async () => {
    await put(`${'c'.repeat(64)}.4f1c.part`)
    await put('notes.txt')

    const run = await transcodeRecordings(directory)

    expect(run.converted).toEqual([])
    expect((await readdir(directory)).length).toBe(2)
  })

  it('has nothing to do when no recording has ever been made', async () => {
    const run = await transcodeRecordings(join(directory, 'never-written'))
    expect(run).toMatchObject({ converted: [], alreadyCompressed: 0 })
  })

  /**
   * The engine is one container, and it is shared with the app. Warming learned
   * this the hard way: several recordings at once do not just take longer each,
   * they starve whatever else is running.
   */
  it('converts one recording at a time rather than saturating the engine', async () => {
    let running = 0
    let peak = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        running += 1
        peak = Math.max(peak, running)
        await new Promise((resolve) => setTimeout(resolve, 5))
        running -= 1
        return new Response(OPUS)
      }),
    )

    await put(`${KEY}.wav`)
    await put(`${OTHER}.wav`)

    await transcodeRecordings(directory)

    expect(peak).toBe(1)
  })

  it('stops rather than deleting a WAV the engine could not convert', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('the engine fell over', { status: 500 })),
    )
    await put(`${KEY}.wav`)

    await expect(transcodeRecordings(directory)).rejects.toThrow()
    expect(await readdir(directory)).toEqual([`${KEY}.wav`])
  })
})
