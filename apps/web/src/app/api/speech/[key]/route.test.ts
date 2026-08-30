import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { narrate, readCachedAudio, scriptFor, SpeechServiceError } from '@/lib/speech'
import { GET } from './route'

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@/lib/speech', async () => {
  const { SpeechServiceError } = await import('@/lib/speech/piper')
  return { readCachedAudio: vi.fn(), scriptFor: vi.fn(), narrate: vi.fn(), SpeechServiceError }
})

const getSession = vi.mocked(auth.api.getSession)
const readCached = vi.mocked(readCachedAudio)
const resolveScript = vi.mocked(scriptFor)
const synthesise = vi.mocked(narrate)

const WAV = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])
const KEY = 'a'.repeat(64)
const SCRIPT = 'A closure remembers where it was born.'

function get(key: string) {
  return GET(new Request(`http://localhost/api/speech/${key}`), {
    params: Promise.resolve({ key }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  readCached.mockResolvedValue(WAV)
  resolveScript.mockResolvedValue(SCRIPT)
  synthesise.mockResolvedValue({ audio: WAV, key: KEY, source: 'engine' })
})

describe('GET /api/speech/[key]', () => {
  it('answers a recorded key from the cache without going near the content', async () => {
    const response = await get(KEY)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/wav')
    expect(response.headers.get('Content-Length')).toBe(String(WAV.byteLength))
    expect(response.headers.get('X-Speech-Cache')).toBe('hit')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(WAV)
    expect(readCached).toHaveBeenCalledWith(KEY)
    expect(resolveScript).not.toHaveBeenCalled()
  })

  it('makes the recording the first time a key is asked for', async () => {
    readCached.mockResolvedValue(null)

    const response = await get(KEY)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/wav')
    expect(response.headers.get('X-Speech-Cache')).toBe('miss')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(WAV)
    // Resolved on this side of the wire, so a question's script is never
    // something the browser has to hold or send back.
    expect(synthesise).toHaveBeenCalledWith(SCRIPT)
  })

  it('lets the browser keep it forever whether it was read or made', async () => {
    readCached.mockResolvedValue(null)
    const cacheControl = (await get(KEY)).headers.get('Cache-Control')

    // A key is the hash of the words, so the bytes behind one never change.
    expect(cacheControl).toContain('immutable')
    // Lessons are behind a session, and so is the voice reading them.
    expect(cacheControl).toContain('private')
  })

  it('refuses a key nothing in content hashes to, rather than synthesising it', async () => {
    readCached.mockResolvedValue(null)
    resolveScript.mockResolvedValue(null)

    const response = await get(KEY)

    expect(response.status).toBe(404)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(synthesise).not.toHaveBeenCalled()
  })

  it('says the voice is unavailable when the engine does not answer, and names no command', async () => {
    readCached.mockResolvedValue(null)
    synthesise.mockRejectedValue(new SpeechServiceError('unreachable'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await get(KEY)

    expect(response.status).toBe(502)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).error).not.toMatch(/npm run/)
  })

  it('never lets a key name a file, since it is used as one', async () => {
    for (const key of ['../../etc/passwd', `${KEY}.wav`, 'ABC', '', 'a'.repeat(63)]) {
      expect((await get(key)).status).toBe(404)
    }

    expect(readCached).not.toHaveBeenCalled()
  })

  it('refuses a request with no session, without touching the cache', async () => {
    getSession.mockResolvedValue(null as never)

    expect((await get(KEY)).status).toBe(401)
    expect(readCached).not.toHaveBeenCalled()
  })
})
