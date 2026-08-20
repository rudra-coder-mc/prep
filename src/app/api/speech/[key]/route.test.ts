import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { readCachedAudio } from '@/lib/speech'
import { GET } from './route'

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@/lib/speech', () => ({
  readCachedAudio: vi.fn(),
}))

const getSession = vi.mocked(auth.api.getSession)
const readCached = vi.mocked(readCachedAudio)

const WAV = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])
const KEY = 'a'.repeat(64)

function get(key: string) {
  return GET(new Request(`http://localhost/api/speech/${key}`), {
    params: Promise.resolve({ key }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  readCached.mockResolvedValue(WAV)
})

describe('GET /api/speech/[key]', () => {
  it('refuses to let a missing recording be cached, since the next build makes it', async () => {
    readCached.mockResolvedValue(null)

    const response = await get(KEY)

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('answers with the recording that was built for that key', async () => {
    const response = await get(KEY)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/wav')
    expect(response.headers.get('Content-Length')).toBe(String(WAV.byteLength))
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(WAV)
    expect(readCached).toHaveBeenCalledWith(KEY)
  })

  it('lets the browser keep it forever, and keep it to itself', async () => {
    const cacheControl = (await get(KEY)).headers.get('Cache-Control')

    // A key is the hash of the words, so the bytes behind one never change.
    expect(cacheControl).toContain('immutable')
    // Lessons are behind a session, and so is the voice reading them.
    expect(cacheControl).toContain('private')
  })

  it('says a key has nothing built for it rather than guessing', async () => {
    readCached.mockResolvedValue(null)

    const response = await get(KEY)

    expect(response.status).toBe(404)
    expect(response.headers.get('Content-Type')).toContain('application/json')
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
