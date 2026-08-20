import { describe, expect, it } from 'vitest'
import { isWav } from './audio'

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

describe('isWav', () => {
  it('accepts a RIFF WAVE header', () => {
    expect(isWav(bytes('RIFF    WAVEfmt '))).toBe(true)
  })

  it('rejects an HTML error page, which Piper serves with the same content type', () => {
    expect(isWav(bytes('<!doctype html><title>500 Internal Server Error</title>'))).toBe(false)
  })

  it('rejects a body too short to have a header at all', () => {
    expect(isWav(bytes('RIFF'))).toBe(false)
    expect(isWav(new Uint8Array())).toBe(false)
  })

  it('rejects a RIFF container that is not WAVE', () => {
    expect(isWav(bytes('RIFF    AVI '))).toBe(false)
  })
})
