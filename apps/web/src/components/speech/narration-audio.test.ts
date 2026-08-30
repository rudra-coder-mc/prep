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

const KEY = 'f'.repeat(64)

describe('fetchNarrationAudio', () => {
  it('asks for the section by key and nothing else', async () => {
    const fetchMock = respond('OggS....OpusHead', { headers: { 'Content-Type': 'audio/ogg' } })

    const audio = await fetchNarrationAudio(KEY)

    expect(await audio.text()).toBe('OggS....OpusHead')
    // One request whether it was recorded already or made on the spot, and no
    // script in it: the server resolves the key against its own content.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toBe(`/api/speech/${KEY}`)
  })

  it('reports the reason the endpoint gave', async () => {
    respond(JSON.stringify({ error: 'No narration has that name' }), { status: 404 })

    await expect(fetchNarrationAudio(KEY)).rejects.toThrow('No narration has that name')
  })

  it('says what to do about an expired session rather than repeating the status', async () => {
    respond(JSON.stringify({ error: 'Sign in first' }), { status: 401 })

    await expect(fetchNarrationAudio(KEY)).rejects.toThrow(/[Ss]ign in again/)
  })

  it('falls back to a plain message when the failure is not JSON', async () => {
    respond('<!doctype html><title>502</title>', { status: 502 })

    await expect(fetchNarrationAudio(KEY)).rejects.toThrow('The voice is not available right now.')
  })

  it('turns a network failure into something the player can show', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(fetchNarrationAudio(KEY)).rejects.toBeInstanceOf(NarrationUnavailableError)
  })

  it('lets an abort through as an abort, since that is the player moving on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('The user aborted a request.', 'AbortError')
      }),
    )

    await expect(fetchNarrationAudio(KEY)).rejects.not.toBeInstanceOf(NarrationUnavailableError)
  })
})
