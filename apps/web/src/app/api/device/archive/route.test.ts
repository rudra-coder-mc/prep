import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { openArchive } from '@/lib/archive'
import { GET } from './route'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/archive', () => ({ openArchive: vi.fn() }))

const getSession = vi.mocked(auth.api.getSession)
const open = vi.mocked(openArchive)

const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5])

const MANIFEST = {
  version: 'd26e2e8417e4bed2',
  topics: 46,
  questions: 563,
  exercises: 92,
  narrationSections: 291,
  files: ['content.json'],
  archive: { file: 'archive.zip', bytes: ZIP.byteLength },
}

function opened() {
  return {
    manifest: MANIFEST,
    bytes: ZIP.byteLength,
    body: new Response(ZIP).body as ReadableStream<Uint8Array>,
  }
}

function get() {
  return GET(new Request('http://localhost/api/device/archive'))
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  open.mockResolvedValue(opened())
})

describe('GET /api/device/archive', () => {
  it('sends the artefact whole, with its size', async () => {
    const response = await get()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')
    expect(response.headers.get('Content-Length')).toBe(String(ZIP.byteLength))
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(ZIP)
  })

  /**
   * A device asks the version endpoint, decides to refresh, and downloads. A
   * rebuild in between would hand it an archive it never asked for, and it has
   * no other way of telling: the URL is the same at every version.
   */
  it('names the version it is sending, so a device can tell what it got', async () => {
    expect((await get()).headers.get('X-Content-Version')).toBe('d26e2e8417e4bed2')
  })

  it('is never cached, because one URL serves every version', async () => {
    expect((await get()).headers.get('Cache-Control')).toBe('no-store')
  })

  it('says it has nothing to serve when no archive has been built', async () => {
    open.mockResolvedValue(null)

    const response = await get()

    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect((await response.json()).error).toMatch(/archive/i)
  })

  it('refuses a request with no session, without opening anything', async () => {
    getSession.mockResolvedValue(null as never)

    expect((await get()).status).toBe(401)
    expect(open).not.toHaveBeenCalled()
  })
})
