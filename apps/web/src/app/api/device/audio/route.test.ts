import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { cachedAudioSize } from '@/lib/speech'
import { POST } from './route'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/speech', () => ({ cachedAudioSize: vi.fn() }))

const getSession = vi.mocked(auth.api.getSession)
const sizeOf = vi.mocked(cachedAudioSize)

const key = (character: string) => character.repeat(64)

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/device/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  sizeOf.mockResolvedValue(4096)
})

describe('POST /api/device/audio', () => {
  it('reports what each key weighs', async () => {
    const response = await post({ keys: [key('a'), key('b')] })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      recordings: [
        { key: key('a'), bytes: 4096 },
        { key: key('b'), bytes: 4096 },
      ],
    })
  })

  /**
   * The phone subtracts the answer from the keys it asked about to get the
   * count of what has not been recorded, so a miss has to be an absence rather
   * than a zero or a null it would then have to filter out.
   */
  it('leaves out a key that has not been recorded', async () => {
    sizeOf.mockImplementation(async (asked) => (asked === key('a') ? 4096 : null))

    const { recordings } = await (await post({ keys: [key('a'), key('b')] })).json()

    expect(recordings).toEqual([{ key: key('a'), bytes: 4096 }])
  })

  it('answers a key asked for twice once', async () => {
    const { recordings } = await (await post({ keys: [key('a'), key('a')] })).json()

    expect(recordings).toEqual([{ key: key('a'), bytes: 4096 }])
    expect(sizeOf).toHaveBeenCalledTimes(1)
  })

  it('asks nothing of the cache for an empty list', async () => {
    const { recordings } = await (await post({ keys: [] })).json()

    expect(recordings).toEqual([])
    expect(sizeOf).not.toHaveBeenCalled()
  })

  it('never lets an answer be held onto, since a track gets recorded', async () => {
    const response = await post({ keys: [key('a')] })

    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('refuses a device without a session', async () => {
    getSession.mockResolvedValue(null as never)

    const response = await post({ keys: [key('a')] })

    expect(response.status).toBe(401)
    expect(sizeOf).not.toHaveBeenCalled()
  })

  it('refuses anything that is not a sha256 key', async () => {
    const response = await post({ keys: ['../../etc/passwd'] })

    expect(response.status).toBe(400)
    expect(sizeOf).not.toHaveBeenCalled()
  })

  it('refuses more keys than one request is meant to carry', async () => {
    const response = await post({ keys: Array.from({ length: 1001 }, () => key('a')) })

    expect(response.status).toBe(400)
    expect(sizeOf).not.toHaveBeenCalled()
  })

  it('refuses a body that is not JSON', async () => {
    expect((await post('not json at all')).status).toBe(400)
  })
})
