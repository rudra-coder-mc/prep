import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeOpus } from './audio.fixture'
import { speechServiceUrl, SpeechServiceError, synthesise } from './piper'

const OPUS = fakeOpus(1, 2, 3)

function respondWith(body: Uint8Array<ArrayBuffer>, init?: ResponseInit) {
  return vi.fn(async () => new Response(body, init))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('synthesise', () => {
  it('posts the text as JSON to the engine', async () => {
    const fetchMock = respondWith(OPUS)
    vi.stubGlobal('fetch', fetchMock)

    await synthesise('Say this.', 'http://tts:5000')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://tts:5000/synthesize')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ text: 'Say this.' })
  })

  it('returns the recording', async () => {
    vi.stubGlobal('fetch', respondWith(OPUS))
    expect(await synthesise('Say this.', 'http://tts:5000')).toEqual(OPUS)
  })

  it('fails when the engine cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('connect ECONNREFUSED')
      }),
    )

    await expect(synthesise('Say this.', 'http://tts:5000')).rejects.toBeInstanceOf(
      SpeechServiceError,
    )
  })

  it('fails on an error status rather than caching the error page', async () => {
    vi.stubGlobal('fetch', respondWith(new Uint8Array(), { status: 500 }))

    await expect(synthesise('Say this.', 'http://tts:5000')).rejects.toThrow(/answered 500/)
  })

  it('fails when a 200 body is not audio, since a broken engine serves an HTML page', async () => {
    const html = new TextEncoder().encode('<!doctype html><title>500</title>')
    vi.stubGlobal('fetch', respondWith(html))

    await expect(synthesise('Say this.', 'http://tts:5000')).rejects.toThrow(/not Ogg Opus/)
  })
})

describe('speechServiceUrl', () => {
  it('points at the tts container by default', () => {
    vi.stubEnv('SPEECH_SERVICE_URL', undefined)
    expect(speechServiceUrl()).toBe('http://tts:5000')
  })

  it('follows SPEECH_SERVICE_URL when it is set', () => {
    vi.stubEnv('SPEECH_SERVICE_URL', 'http://127.0.0.1:5001')
    expect(speechServiceUrl()).toBe('http://127.0.0.1:5001')
  })
})
