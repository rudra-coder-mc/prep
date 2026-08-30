import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { readCachedAudio } from '@/lib/speech'
import { GET } from './route'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/speech', () => ({ readCachedAudio: vi.fn() }))

const getSession = vi.mocked(auth.api.getSession)
const readCached = vi.mocked(readCachedAudio)

const OPUS = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0, 0, 0, 0])
const KEY = 'a'.repeat(64)

function get(key: string) {
  return GET(new Request(`http://localhost/api/device/audio/${key}`), {
    params: Promise.resolve({ key }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  readCached.mockResolvedValue(OPUS)
})

describe('GET /api/device/audio/[key]', () => {
  it('sends the recording behind a key', async () => {
    const response = await get(KEY)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('audio/ogg')
    expect(response.headers.get('Content-Length')).toBe(String(OPUS.byteLength))
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(OPUS)
    expect(readCached).toHaveBeenCalledWith(KEY)
  })

  /**
   * The one rule that separates this from `/api/speech/[key]`. A phone holds a
   * track's worth of keys and asks for the ones it lacks, so a thousand misses
   * that each synthesised would occupy the machine for a day.
   * `npm run narration:build` is what makes them, ahead of being asked.
   */
  it('reports a recording that has not been made rather than making it', async () => {
    readCached.mockResolvedValue(null)

    const response = await get(KEY)

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    // The device can act on this: the answer is to record the track, not retry.
    expect((await response.json()).error).toMatch(/has not been recorded/i)
  })

  it('lets a device keep what it downloads forever, since a key names its bytes', async () => {
    const cacheControl = (await get(KEY)).headers.get('Cache-Control')

    expect(cacheControl).toContain('immutable')
    expect(cacheControl).toContain('private')
  })

  it('never lets a key name a file, since it is used as one', async () => {
    for (const key of ['../../etc/passwd', `${KEY}.opus`, 'ABC', '', 'a'.repeat(63)]) {
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
