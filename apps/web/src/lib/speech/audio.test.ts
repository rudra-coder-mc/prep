import { describe, expect, it } from 'vitest'
import { isOggOpus } from './audio'

/** An Ogg page header, then `OpusHead` where the first packet starts. */
function oggOpus(): Uint8Array {
  const bytes = new Uint8Array(36)
  bytes.set(new TextEncoder().encode('OggS'), 0)
  bytes.set(new TextEncoder().encode('OpusHead'), 28)
  return bytes
}

function ascii(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

describe('isOggOpus', () => {
  it('accepts an Ogg page carrying an Opus identification header', () => {
    expect(isOggOpus(oggOpus())).toBe(true)
  })

  it('rejects an HTML error page, which the engine can serve as audio would be', () => {
    expect(isOggOpus(ascii('<!doctype html><title>500 Internal Server Error</title>'))).toBe(false)
  })

  it('rejects a WAV, which is what the engine returned before it compressed', () => {
    expect(isOggOpus(ascii('RIFF    WAVEfmt data goes here and on'))).toBe(false)
  })

  it('rejects an Ogg carrying something other than Opus', () => {
    const vorbis = oggOpus()
    vorbis.set(ascii('\x01vorbis '), 28)
    expect(isOggOpus(vorbis)).toBe(false)
  })

  it('rejects a body too short to have a header at all', () => {
    expect(isOggOpus(ascii('OggS'))).toBe(false)
    expect(isOggOpus(new Uint8Array())).toBe(false)
  })
})
