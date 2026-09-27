import type { ArchiveContent } from '@prep/content/archive/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestFileStore } from '../../test-support/file-store'
import {
  AUDIO_ROOT,
  archiveAudioKeys,
  heldBytes,
  heldRecordings,
  pruneAudioLibrary,
  recordingPath,
  trackAudioKeys,
} from './library'

/**
 * Which recordings a track needs and which of them the device holds. Both are
 * read off the archive and the filesystem, so both work with nothing switched
 * on.
 */
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  files = await createTestFileStore()
})

const key = (character: string) => character.repeat(64)

function topic(
  slug: string,
  technology: string,
  narration: string[] | null,
  questions: [string, string][],
) {
  return {
    slug,
    technology,
    title: slug,
    directory: slug,
    lesson: `lessons/${technology}/${slug}.html`,
    questions: questions.map(([prompt, answer], index) => ({
      id: `q${index}`,
      promptAudioKey: prompt,
      answerAudioKey: answer,
    })),
    exercises: [],
    narration: narration === null ? null : narration.map((audioKey) => ({ audioKey })),
  }
}

function contentOf(...topics: ReturnType<typeof topic>[]): ArchiveContent {
  return { version: 'v1', technologies: [], topics } as unknown as ArchiveContent
}

describe('recordingPath', () => {
  it('puts a recording under the audio directory, named by its key', () => {
    expect(recordingPath(key('a'))).toBe(`${AUDIO_ROOT}/${key('a')}.opus`)
  })

  /**
   * The keys come from this project's own archive, so this should never fire.
   * It exists because being wrong means writing outside the app's directory.
   */
  it('refuses anything that is not a key rather than joining it onto a path', () => {
    expect(() => recordingPath('../../escaped')).toThrow(/not a recording key/i)
  })
})

describe('trackAudioKeys', () => {
  it('takes the narration and both sides of every question, and nothing else', () => {
    const content = contentOf(
      topic('a', 'javascript', [key('1'), key('2')], [[key('3'), key('4')]]),
      topic('b', 'python', [key('9')], [[key('8'), key('7')]]),
    )

    expect(trackAudioKeys(content, 'javascript')).toEqual([key('1'), key('2'), key('3'), key('4')])
  })

  // A key is the hash of the words, so one script read by two topics is one
  // file, asked for once and downloaded once.
  it('names a key shared by two topics once', () => {
    const content = contentOf(
      topic('a', 'javascript', [key('1')], []),
      topic('b', 'javascript', [key('1')], [[key('1'), key('2')]]),
    )

    expect(trackAudioKeys(content, 'javascript')).toEqual([key('1'), key('2')])
  })

  it('takes the questions of a topic that has no narration', () => {
    const content = contentOf(topic('a', 'javascript', null, [[key('3'), key('4')]]))

    expect(trackAudioKeys(content, 'javascript')).toEqual([key('3'), key('4')])
  })

  it('is empty for a track the archive has no topics for', () => {
    expect(trackAudioKeys(contentOf(), 'javascript')).toEqual([])
  })
})

describe('archiveAudioKeys', () => {
  it('gathers all audio keys across all tracks and topics', () => {
    const content = contentOf(
      topic('a', 'javascript', [key('1')], [[key('2'), key('3')]]),
      topic('b', 'browser', [key('4')], [[key('5'), key('6')]]),
    )

    expect(archiveAudioKeys(content)).toEqual(
      new Set([key('1'), key('2'), key('3'), key('4'), key('5'), key('6')]),
    )
  })
})

describe('what the device holds', () => {
  it('finds nothing before anything has been downloaded', async () => {
    expect(await heldRecordings(files, [key('a')])).toEqual(new Set())
    expect(await heldBytes(files, [])).toBe(0)
  })

  it('reports only the keys it was asked about', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(key('a')), new Uint8Array(10))
    await files.writeBytes(recordingPath(key('b')), new Uint8Array(20))

    expect(await heldRecordings(files, [key('a')])).toEqual(new Set([key('a')]))
  })

  it('adds up what the held recordings take', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(key('a')), new Uint8Array(10))
    await files.writeBytes(recordingPath(key('b')), new Uint8Array(20))

    expect(await heldBytes(files, [key('a'), key('b')])).toBe(30)
  })

  // The archive is replaced whole and the library is not, so the directory
  // outlives any one version of the curriculum and can hold keys no track
  // names any more.
  it('ignores a recording no track asks for', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(key('c')), new Uint8Array(10))

    expect(await heldRecordings(files, [key('a')])).toEqual(new Set())
  })

  it('counts a key it holds nothing for as nothing rather than failing', async () => {
    expect(await heldBytes(files, [key('a')])).toBe(0)
  })
})

describe('pruning the audio library', () => {
  it('deletes recordings no longer referenced by the archive while keeping active ones', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(recordingPath(key('1')), new Uint8Array(10))
    await files.writeBytes(recordingPath(key('2')), new Uint8Array(20))

    const content = contentOf(topic('a', 'javascript', [key('1')], []))

    const result = await pruneAudioLibrary(files, content)
    expect(result).toEqual({ deleted: [key('2')], kept: 1 })

    expect(await files.exists(recordingPath(key('1')))).toBe(true)
    expect(await files.exists(recordingPath(key('2')))).toBe(false)
  })

  it('handles an empty audio directory without throwing', async () => {
    const content = contentOf(topic('a', 'javascript', [key('1')], []))
    const result = await pruneAudioLibrary(files, content)
    expect(result).toEqual({ deleted: [], kept: 0 })
  })

  it('ignores non-recording files in the audio directory', async () => {
    await files.makeDirectory(AUDIO_ROOT)
    await files.writeBytes(`${AUDIO_ROOT}/not-a-recording.txt`, new Uint8Array(5))

    const content = contentOf()
    const result = await pruneAudioLibrary(files, content)
    expect(result).toEqual({ deleted: [], kept: 0 })
    expect(await files.exists(`${AUDIO_ROOT}/not-a-recording.txt`)).toBe(true)
  })
})
