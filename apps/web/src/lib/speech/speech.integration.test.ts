import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { narrate } from './narrate'
import { scriptKey } from './cache'
import { speechServiceUrl, synthesise, transcode } from './piper'

/**
 * Against the real speech engine, because the thing worth proving is that the
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

/**
 * The Opus identification header, which sits in the first Ogg page at a fixed
 * offset. Reading it is how this tells a real Opus stream from a body that
 * merely starts with the right four letters.
 */
function opusHead(audio: Uint8Array) {
  const view = new DataView(audio.buffer, audio.byteOffset, audio.byteLength)
  return {
    ogg: new TextDecoder('ascii').decode(audio.subarray(0, 4)),
    magic: new TextDecoder('ascii').decode(audio.subarray(28, 36)),
    version: view.getUint8(36),
    channels: view.getUint8(37),
    /** What was encoded, which Opus records and then works at 48 kHz. */
    inputSampleRate: view.getUint32(40, true),
  }
}

/** A second of silence, which is enough for the encoder to have something to do. */
function silentWav(rate = 22050): Uint8Array {
  const data = new Uint8Array(rate * 2)
  const wav = new Uint8Array(44 + data.length)
  const view = new DataView(wav.buffer)
  const ascii = (text: string, at: number) => wav.set(new TextEncoder().encode(text), at)

  ascii('RIFF', 0)
  view.setUint32(4, 36 + data.length, true)
  ascii('WAVE', 8)
  ascii('fmt ', 12)
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii('data', 36)
  view.setUint32(40, data.length, true)

  return wav
}

describe('narrate against the speech engine', () => {
  it('turns a script into audio a browser can play', async () => {
    const narration = await narrate(SCRIPT)

    expect(narration.source).toBe('engine')
    expect(narration.key).toBe(scriptKey(SCRIPT))
    expect(opusHead(narration.audio)).toEqual({
      ogg: 'OggS',
      magic: 'OpusHead',
      version: 1,
      channels: 1,
      inputSampleRate: 22050,
    })

    // Roughly 4 KB per second of speech at 32 kbps, so a sentence is a few
    // kilobytes. The floor only has to rule out a header with no audio behind
    // it, and the ceiling is what says the recording really was compressed:
    // this sentence as a WAV would be over a hundred kilobytes.
    expect(narration.audio.byteLength).toBeGreaterThan(4_000)
    expect(narration.audio.byteLength).toBeLessThan(50_000)
  })

  it('serves the second request for the same script from the cache', async () => {
    const first = await narrate(SCRIPT)
    const second = await narrate(SCRIPT)

    expect(second.source).toBe('cache')
    expect(second.audio).toEqual(first.audio)
    expect(await readdir(directory)).toEqual([`${scriptKey(SCRIPT)}.opus`])
  })
})

/**
 * The migration off WAV rests entirely on the engine converting one, and it is
 * the one part of it that cannot be proved with a stub: what a hand-built
 * fixture cannot tell you is whether the encoder in the image accepts a real
 * recording and hands back a real Opus stream.
 */
describe('transcode against the speech engine', () => {
  it('turns an uncompressed recording into Opus at a fraction of the size', async () => {
    const wav = silentWav()

    const opus = await transcode(wav)

    expect(opusHead(opus)).toMatchObject({ ogg: 'OggS', magic: 'OpusHead', channels: 1 })
    expect(opus.byteLength).toBeLessThan(wav.byteLength / 4)
  })
})

/**
 * The engine is shared, and the callers do not know about each other: a reader
 * pressing play, a page warming the section it expects to need next, and
 * `npm run narration:build` recording a whole track all reach the same
 * container. Before it synthesised one at a time, four requests at once were
 * four inferences at once, which is four times the memory and enough to kill
 * the process for all of them. See
 * docs/decisions/0046-the-speech-engine-synthesises-one-at-a-time.md.
 *
 * What this proves is that concurrent callers all get their audio and the
 * engine is still there afterwards. The memory it now holds flat is not visible
 * from here; `services/tts/server.py` names the measurement.
 */
describe('the speech engine under concurrent callers', () => {
  const SCRIPTS = [
    'A promise is a value that has not arrived yet.',
    'The prototype chain is a lookup and never a copy.',
    'One macrotask per turn, and microtasks until there are none left.',
    'A closure keeps its whole scope alive, not only what it reads.',
  ]

  it('answers every one of them and survives', async () => {
    const recordings = await Promise.all(SCRIPTS.map((script) => synthesise(script)))

    for (const recording of recordings) {
      expect(opusHead(recording)).toMatchObject({ ogg: 'OggS', magic: 'OpusHead', channels: 1 })
      expect(recording.byteLength).toBeGreaterThan(4_000)
    }

    const info = await fetch(`${speechServiceUrl()}/info`)
    expect(info.ok).toBe(true)
  })
})
