import type { ArchiveContent } from '@prep/content/archive/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestFileStore } from '../../test-support/file-store'
import { ServerError, type ServerClient } from '../server/client'
import { downloadRecordings, heldTrackAudio, surveyTrackAudio } from './download'
import { AUDIO_ROOT, recordingPath } from './library'

/**
 * Downloading a track's audio: saying what it costs first, and then a run that
 * an interruption leaves half finished rather than wasted.
 */
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  files = await createTestFileStore()
})

const key = (character: string) => character.repeat(64)

const A = key('a')
const B = key('b')
const C = key('c')

/** One topic with two questions, whose four keys are a, b, c and d. */
const content = {
  version: 'v1',
  technologies: [],
  topics: [
    {
      slug: 'closures',
      technology: 'javascript',
      title: 'Closures',
      directory: 'closures',
      lesson: 'lessons/javascript/closures.html',
      narration: [{ audioKey: A }],
      questions: [{ id: 'q1', promptAudioKey: B, answerAudioKey: C }],
      exercises: [],
    },
  ],
} as unknown as ArchiveContent

/** A server holding a recording of the given size for each of the given keys. */
function serverHolding(held: Record<string, number>): ServerClient {
  return {
    audioSizes: vi.fn(async (keys: string[]) => {
      const sizes = new Map<string, number>()
      for (const asked of keys) if (held[asked]) sizes.set(asked, held[asked])
      return sizes
    }),
    downloadAudio: vi.fn(async (asked: string) =>
      held[asked] ? new Uint8Array(held[asked]) : null,
    ),
  } as unknown as ServerClient
}

describe('surveying a track', () => {
  it('says what the download is before it starts', async () => {
    const survey = await surveyTrackAudio({
      files,
      client: serverHolding({ [A]: 100, [B]: 200, [C]: 300 }),
      content,
      technology: 'javascript',
    })

    expect(survey.total).toBe(3)
    expect(survey.held).toEqual({ count: 0, bytes: 0 })
    expect(survey.pending).toEqual({ count: 3, bytes: 600 })
    expect(survey.unrecorded).toBe(0)
    expect(survey.order).toEqual([A, B, C])
  })

  it('leaves out what the device already holds, and says what that takes', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(A), new Uint8Array(100))

    const survey = await surveyTrackAudio({
      files,
      client: serverHolding({ [A]: 100, [B]: 200, [C]: 300 }),
      content,
      technology: 'javascript',
    })

    expect(survey.held).toEqual({ count: 1, bytes: 100 })
    expect(survey.pending).toEqual({ count: 2, bytes: 500 })
    expect(survey.order).toEqual([B, C])
  })

  /**
   * A track nobody has run `npm run narration:build` over has keys and no
   * recordings. That is a state of the machine rather than a failure, and the
   * screen has to be able to say so instead of promising a download of nothing.
   */
  it('counts the keys nothing has been recorded for separately', async () => {
    const survey = await surveyTrackAudio({
      files,
      client: serverHolding({ [A]: 100 }),
      content,
      technology: 'javascript',
    })

    expect(survey.pending).toEqual({ count: 1, bytes: 100 })
    expect(survey.unrecorded).toBe(2)
    expect(survey.order).toEqual([A])
  })

  it('asks the server about nothing when the device holds the whole track', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    for (const held of [A, B, C]) await files.writeBytes(recordingPath(held), new Uint8Array(10))

    const client = serverHolding({ [A]: 100, [B]: 200, [C]: 300 })
    const survey = await surveyTrackAudio({ files, client, content, technology: 'javascript' })

    expect(survey.pending).toEqual({ count: 0, bytes: 0 })
    expect(survey.held).toEqual({ count: 3, bytes: 30 })
    expect(client.audioSizes).toHaveBeenCalledWith([])
  })
})

describe('what the device holds of a track', () => {
  /**
   * The half of the answer that never needs the server. A phone out of reach of
   * the machine can still say what it is carrying, which is the whole point of
   * the design: see docs/decisions/0033-the-mobile-client-is-offline-first.md.
   */
  it('is answered with nothing switched on', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(A), new Uint8Array(100))

    expect(await heldTrackAudio({ files, content, technology: 'javascript' })).toEqual({
      total: 3,
      held: { count: 1, bytes: 100 },
      wanted: [B, C],
    })
  })
})

describe('downloading a track', () => {
  it('writes one file per key', async () => {
    const client = serverHolding({ [A]: 100, [B]: 200 })

    const result = await downloadRecordings({ files, client, keys: [A, B] })

    expect(result).toEqual({ downloaded: 2, bytes: 300, unrecorded: 0 })
    expect(await files.size(recordingPath(A))).toBe(100)
    expect(await files.size(recordingPath(B))).toBe(200)
  })

  /**
   * The done criterion of task 31. One recording is one file and one request,
   * and a file is written only once all its bytes have arrived, so what a
   * killed run left behind is whole recordings and the next run asks for the
   * rest rather than for the track.
   */
  it('asks only for what the device is missing, so an interrupted run continues', async () => {
    const client = serverHolding({ [A]: 100, [B]: 200, [C]: 300 })

    await downloadRecordings({ files, client, keys: [A, B, C], stopped: stopAfter(1) })

    const carriedOn = serverHolding({ [A]: 100, [B]: 200, [C]: 300 })
    const result = await downloadRecordings({ files, client: carriedOn, keys: [A, B, C] })

    expect(result.downloaded).toBe(2)
    expect(carriedOn.downloadAudio).not.toHaveBeenCalledWith(A)
    expect(await files.size(recordingPath(A))).toBe(100)
  })

  it('skips a key nothing has been recorded for and counts it', async () => {
    const client = serverHolding({ [A]: 100 })

    const result = await downloadRecordings({ files, client, keys: [A, B] })

    expect(result).toEqual({ downloaded: 1, bytes: 100, unrecorded: 1 })
    expect(await files.exists(recordingPath(B))).toBe(false)
  })

  it('reports each recording as it lands', async () => {
    const progress: number[] = []

    await downloadRecordings({
      files,
      client: serverHolding({ [A]: 100, [B]: 200 }),
      keys: [A, B],
      onProgress: ({ done, total, bytes }) => {
        expect(total).toBe(2)
        progress.push(bytes)
        expect(progress.length).toBe(done)
      },
    })

    expect(progress).toEqual([100, 300])
  })

  /**
   * The usual failure is the server going out of reach, and the thousand
   * requests after it would each fail the same way. What arrived stays.
   */
  it('stops at the first failure and leaves what arrived on the device', async () => {
    const client = serverHolding({ [A]: 100, [B]: 200 })
    client.downloadAudio = vi.fn(async (asked: string) => {
      if (asked === B) throw new ServerError('offline', 'work could not be reached')
      return new Uint8Array(100)
    })

    await expect(downloadRecordings({ files, client, keys: [A, B, C] })).rejects.toBeInstanceOf(
      ServerError,
    )
    expect(await files.exists(recordingPath(A))).toBe(true)
    expect(client.downloadAudio).not.toHaveBeenCalledWith(C)
  })

  it('does nothing at all when there is nothing to fetch', async () => {
    const client = serverHolding({})

    expect(await downloadRecordings({ files, client, keys: [] })).toEqual({
      downloaded: 0,
      bytes: 0,
      unrecorded: 0,
    })
    expect(await files.exists(AUDIO_ROOT)).toBe(false)
  })
})

/** Stops the run once the given number of recordings have been asked for. */
function stopAfter(count: number): () => boolean {
  let asked = 0
  return () => asked++ >= count
}
