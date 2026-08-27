import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { InvalidScriptError, narrate } from './narrate'
import { scriptKey } from './cache'
import { MAX_SCRIPT_LENGTH } from './script'

const WAV = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45, 7])

let directory: string
let engine: ReturnType<typeof vi.fn>

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prep-narrate-'))
  vi.stubEnv('SPEECH_CACHE_DIR', directory)

  engine = vi.fn(async () => new Response(WAV))
  vi.stubGlobal('fetch', engine)
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

describe('narrate', () => {
  it('synthesises a script it has not seen and says where the audio came from', async () => {
    const narration = await narrate('Closures, explained out loud.')

    expect(narration.source).toBe('engine')
    expect(narration.audio).toEqual(WAV)
    expect(narration.key).toBe(scriptKey('Closures, explained out loud.'))
    expect(engine).toHaveBeenCalledOnce()
  })

  it('serves the same script from cache without touching the engine again', async () => {
    await narrate('Closures, explained out loud.')
    const second = await narrate('Closures, explained out loud.')

    expect(second.source).toBe('cache')
    expect(second.audio).toEqual(WAV)
    expect(engine).toHaveBeenCalledOnce()
  })

  it('treats a script relaid-out as the same script', async () => {
    await narrate('One thing.\nThen another.')
    const second = await narrate('  One thing. Then another.  ')

    expect(second.source).toBe('cache')
    expect(engine).toHaveBeenCalledOnce()
  })

  it('speaks the normalised text, not the line breaks it was written with', async () => {
    await narrate('One thing.\n\nThen another.')

    const [, init] = engine.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ text: 'One thing. Then another.' })
  })

  it('leaves an edited script to synthesise afresh rather than serving the old audio', async () => {
    await narrate('One thing.')
    const second = await narrate('One other thing.')

    expect(second.source).toBe('engine')
    expect(engine).toHaveBeenCalledTimes(2)
    expect(await readdir(directory)).toHaveLength(2)
  })

  it('refuses an empty script instead of letting the engine throw', async () => {
    await expect(narrate('   \n  ')).rejects.toBeInstanceOf(InvalidScriptError)
    expect(engine).not.toHaveBeenCalled()
  })

  it('refuses a script too long to synthesise in one request', async () => {
    await expect(narrate('a'.repeat(MAX_SCRIPT_LENGTH + 1))).rejects.toBeInstanceOf(
      InvalidScriptError,
    )
    expect(engine).not.toHaveBeenCalled()
  })

  it('synthesises once when the same script is asked for twice at once', async () => {
    const [first, second] = await Promise.all([
      narrate('Two listeners, one recording.'),
      narrate('Two listeners, one recording.'),
    ])

    expect(engine).toHaveBeenCalledOnce()
    expect(first.audio).toEqual(WAV)
    expect(second.audio).toEqual(WAV)
    expect(await readdir(directory)).toHaveLength(1)
  })

  it('caches nothing when the engine fails, so a retry is a real retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array(), { status: 500 })),
    )

    await expect(narrate('Closures, explained out loud.')).rejects.toThrow()
    expect(await readdir(directory)).toEqual([])
  })
})
