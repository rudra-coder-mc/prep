import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cacheDirectory, readCachedAudio, scriptKey, writeCachedAudio } from './cache'

const KEY = 'a'.repeat(64)
const AUDIO = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 1, 2, 3])

let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prep-speech-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('readCachedAudio', () => {
  it('returns null when nothing has been synthesised for the key', async () => {
    expect(await readCachedAudio(KEY, directory)).toBeNull()
  })

  it('returns null when the directory does not exist at all', async () => {
    expect(await readCachedAudio(KEY, join(directory, 'never-written'))).toBeNull()
  })
})

describe('writeCachedAudio', () => {
  it('round-trips the bytes it was given', async () => {
    await writeCachedAudio(KEY, AUDIO, directory)
    expect(await readCachedAudio(KEY, directory)).toEqual(AUDIO)
  })

  it('creates the directory rather than failing on a first run', async () => {
    const fresh = join(directory, 'nested', 'speech')
    await writeCachedAudio(KEY, AUDIO, fresh)
    expect(await readCachedAudio(KEY, fresh)).toEqual(AUDIO)
  })

  it('leaves no partial file behind, so a reader never sees half a recording', async () => {
    await writeCachedAudio(KEY, AUDIO, directory)
    expect(await readdir(directory)).toEqual([`${KEY}.wav`])
  })

  it('overwrites an entry rather than refusing, so a rebuild can replace one', async () => {
    await writeCachedAudio(KEY, AUDIO, directory)
    const replacement = new Uint8Array([0x52, 0x49, 0x46, 0x46, 9])
    await writeCachedAudio(KEY, replacement, directory)
    expect(await readCachedAudio(KEY, directory)).toEqual(replacement)
  })

  it('writes concurrently to the same key without corrupting it', async () => {
    await Promise.all([
      writeCachedAudio(KEY, AUDIO, directory),
      writeCachedAudio(KEY, AUDIO, directory),
      writeCachedAudio(KEY, AUDIO, directory),
    ])
    expect(await readdir(directory)).toEqual([`${KEY}.wav`])
    expect(await readCachedAudio(KEY, directory)).toEqual(AUDIO)
  })
})

describe('cacheDirectory', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('follows SPEECH_CACHE_DIR when the stack sets it', () => {
    vi.stubEnv('SPEECH_CACHE_DIR', '/cache/speech')
    expect(cacheDirectory()).toBe('/cache/speech')
  })

  it('falls back to a directory git ignores, for a run outside the stack', () => {
    vi.stubEnv('SPEECH_CACHE_DIR', undefined)
    expect(cacheDirectory()).toBe('.speech-cache')
  })
})

describe('scriptKey', () => {
  it('is the same for text that differs only in how it was laid out', () => {
    expect(scriptKey('One thing.\nThen another.')).toBe(scriptKey('One thing. Then another.'))
  })

  it('changes when a word changes', () => {
    expect(scriptKey('One thing.')).not.toBe(scriptKey('One think.'))
  })

  it('is a hex digest, so it is safe as a file name', () => {
    expect(scriptKey('anything')).toMatch(/^[0-9a-f]{64}$/)
  })
})
