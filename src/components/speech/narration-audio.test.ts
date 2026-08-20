import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchNarrationAudio, NarrationUnavailableError } from './narration-audio'

function respond(body: BodyInit, init?: ResponseInit) {
  const fetchMock = vi.fn(async () => new Response(body, init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchNarrationAudio', () => {
  it('posts the script and returns the audio', async () => {
    const fetchMock = respond('RIFF....WAVE', { headers: { 'Content-Type': 'audio/wav' } })

    const audio = await fetchNarrationAudio('Say this section.')

    expect(await audio.text()).toBe('RIFF....WAVE')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/speech')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Say this section.' })
  })

  it('reports the reason the endpoint gave', async () => {
    respond(JSON.stringify({ error: 'A narration script cannot be empty' }), { status: 400 })

    await expect(fetchNarrationAudio(' ')).rejects.toThrow('A narration script cannot be empty')
  })

  it('says what to do about an expired session rather than repeating the status', async () => {
    respond(JSON.stringify({ error: 'Sign in first' }), { status: 401 })

    await expect(fetchNarrationAudio('anything')).rejects.toThrow(/[Ss]ign in again/)
  })

  it('falls back to a plain message when the failure is not JSON', async () => {
    respond('<!doctype html><title>502</title>', { status: 502 })

    await expect(fetchNarrationAudio('anything')).rejects.toThrow(
      'The voice is not available right now.',
    )
  })

  it('turns a network failure into something the player can show', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(fetchNarrationAudio('anything')).rejects.toBeInstanceOf(NarrationUnavailableError)
  })

  it('lets an abort through as an abort, since that is the player moving on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The user aborted a request.', 'AbortError')
      }),
    )

    await expect(fetchNarrationAudio('anything')).rejects.not.toBeInstanceOf(
      NarrationUnavailableError,
    )
  })
})
