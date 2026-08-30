import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { InvalidScriptError, narrate, SpeechServiceError } from '@/lib/speech'
import { POST } from './route'

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@/lib/speech', async () => {
  const narration = await import('@/lib/speech/narrate')
  const piper = await import('@/lib/speech/piper')
  return {
    narrate: vi.fn(),
    InvalidScriptError: narration.InvalidScriptError,
    SpeechServiceError: piper.SpeechServiceError,
  }
})

const getSession = vi.mocked(auth.api.getSession)
const narrateMock = vi.mocked(narrate)

/** Opaque here: the route is mocked at `narrate` and never reads the bytes. */
const OPUS = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0])

function post(body: unknown) {
  return new Request('http://localhost/api/speech', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
})

describe('POST /api/speech', () => {
  it('answers with the audio, its content type and its length', async () => {
    narrateMock.mockResolvedValue({ audio: OPUS, key: 'abc', source: 'engine' })

    const response = await POST(post({ text: 'Say this.' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/ogg')
    expect(response.headers.get('Content-Length')).toBe(String(OPUS.byteLength))
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(OPUS)
  })

  it('says whether the audio was already synthesised', async () => {
    narrateMock.mockResolvedValue({ audio: OPUS, key: 'abc', source: 'engine' })
    expect((await POST(post({ text: 'Say this.' }))).headers.get('X-Speech-Cache')).toBe('miss')

    narrateMock.mockResolvedValue({ audio: OPUS, key: 'abc', source: 'cache' })
    const cached = await POST(post({ text: 'Say this.' }))
    expect(cached.headers.get('X-Speech-Cache')).toBe('hit')
    expect(cached.headers.get('X-Speech-Key')).toBe('abc')
  })

  it('refuses a request with no session, without reaching the engine', async () => {
    getSession.mockResolvedValue(null as never)

    expect((await POST(post({ text: 'Say this.' }))).status).toBe(401)
    expect(narrateMock).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    expect((await POST(post('not json'))).status).toBe(400)
  })

  it('rejects a body with no text', async () => {
    expect((await POST(post({}))).status).toBe(400)
    expect((await POST(post({ text: 42 }))).status).toBe(400)
    expect(narrateMock).not.toHaveBeenCalled()
  })

  it('turns an unspeakable script into a 400 that says why', async () => {
    narrateMock.mockRejectedValue(
      new InvalidScriptError('empty', 'A narration script cannot be empty'),
    )

    const response = await POST(post({ text: ' ' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'A narration script cannot be empty' })
  })

  it('turns the engine being down into a 502 rather than an audio element of nothing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    narrateMock.mockRejectedValue(new SpeechServiceError('unreachable'))

    const response = await POST(post({ text: 'Say this.' }))

    // The engine runs with the app now, so there is nothing for the reader to
    // start and nothing worth telling them to run.
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'The voice is not available right now.',
    })
  })

  it('lets an unexpected failure through rather than dressing it as a gateway error', async () => {
    narrateMock.mockRejectedValue(new Error('something else entirely'))

    await expect(POST(post({ text: 'Say this.' }))).rejects.toThrow('something else entirely')
  })
})
