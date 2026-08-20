import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { narrate } from './narrate'
import { scriptKey } from './cache'

/**
 * Against the real Piper container, because the thing worth proving is that the
 * bytes it sends back are audio a browser will play. `scripts/with-services.sh`
 * brings it up, the same way it brings up Postgres for the other integration
 * tests.
 *
 * Synthesis runs at roughly three and a half times real time, so these scripts
 * are kept to one short sentence each.
 */
const SCRIPT = 'A closure is a function that remembers where it was born.'

let directory: string

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'prep-speech-integration-'))
  process.env.SPEECH_CACHE_DIR = directory
  process.env.SPEECH_SERVICE_URL ??= `http://127.0.0.1:${process.env.TTS_PORT ?? 5001}`
})

afterAll(async () => {
  await rm(directory, { recursive: true, force: true })
})

function wavHeader(audio: Uint8Array) {
  const view = new DataView(audio.buffer, audio.byteOffset, audio.byteLength)
  return {
    riff: new TextDecoder('ascii').decode(audio.subarray(0, 4)),
    wave: new TextDecoder('ascii').decode(audio.subarray(8, 12)),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    bitsPerSample: view.getUint16(34, true),
  }
}

describe('narrate against the speech engine', () => {
  it('turns a script into audio a browser can play', async () => {
    const narration = await narrate(SCRIPT)

    expect(narration.source).toBe('engine')
    expect(narration.key).toBe(scriptKey(SCRIPT))
    expect(wavHeader(narration.audio)).toEqual({
      riff: 'RIFF',
      wave: 'WAVE',
      channels: 1,
      sampleRate: 22050,
      bitsPerSample: 16,
    })

    // Roughly 44 KB per second of speech, so a sentence is tens of kilobytes.
    // The floor only has to rule out a header with no audio behind it.
    expect(narration.audio.byteLength).toBeGreaterThan(44_100)
  })

  it('serves the second request for the same script from the cache', async () => {
    const first = await narrate(SCRIPT)
    const second = await narrate(SCRIPT)

    expect(second.source).toBe('cache')
    expect(second.audio).toEqual(first.audio)
    expect(await readdir(directory)).toEqual([`${scriptKey(SCRIPT)}.wav`])
  })
})
