import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import {
  answerScriptFor,
  hasCachedAudio,
  scriptFor,
  SpeechServiceError,
  warmRecording,
} from '@/lib/speech'
import { POST } from './route'

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}))

vi.mock('@/lib/speech', async () => {
  const { SpeechServiceError } = await import('@/lib/speech/piper')
  const { scriptKey } = await import('@/lib/speech/cache')
  return {
    answerScriptFor: vi.fn(),
    hasCachedAudio: vi.fn(),
    scriptFor: vi.fn(),
    scriptKey,
    SpeechServiceError,
    warmRecording: vi.fn(),
  }
})

const getSession = vi.mocked(auth.api.getSession)
const recorded = vi.mocked(hasCachedAudio)
const resolveScript = vi.mocked(scriptFor)
const resolveAnswer = vi.mocked(answerScriptFor)
const synthesise = vi.mocked(warmRecording)

const KEY = 'a'.repeat(64)
const SECTION = 'A closure remembers where it was born.'
const ANSWER = 'The answer. It keeps the variable alive.'

function warm(body: unknown) {
  return POST(
    new Request('http://localhost/api/speech/warm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  recorded.mockResolvedValue(false)
  resolveScript.mockResolvedValue(SECTION)
  resolveAnswer.mockResolvedValue(ANSWER)
  synthesise.mockResolvedValue('recorded')
})

describe('POST /api/speech/warm', () => {
  it('makes a section that has never been asked for, and sends none of it back', async () => {
    const response = await warm({ narration: KEY })

    expect(response.status).toBe(204)
    expect(response.headers.get('X-Speech-Warm')).toBe('recorded')
    expect(await response.text()).toBe('')
    expect(synthesise).toHaveBeenCalledWith(SECTION)
  })

  it('does not read a recording that already exists to find out it exists', async () => {
    recorded.mockResolvedValue(true)

    const response = await warm({ narration: KEY })

    expect(response.status).toBe(204)
    expect(response.headers.get('X-Speech-Warm')).toBe('kept')
    expect(synthesise).not.toHaveBeenCalled()
  })

  it('records an answer from the question it belongs to, never from a key', async () => {
    const response = await warm({ answer: { topic: 'javascript/closures', question: 'q1' } })

    expect(response.status).toBe(204)
    expect(resolveAnswer).toHaveBeenCalledWith('javascript/closures', 'q1')
    expect(synthesise).toHaveBeenCalledWith(ANSWER)
    // Warming an answer must not become a way to hear one before answering.
    expect(response.headers.get('Content-Length')).toBeNull()
  })

  it('says so when a newer warm took its turn, rather than reporting a recording', async () => {
    synthesise.mockResolvedValue('superseded')

    const response = await warm({ narration: KEY })

    expect(response.status).toBe(204)
    expect(response.headers.get('X-Speech-Warm')).toBe('superseded')
  })

  it('refuses a key nothing in content hashes to, rather than synthesising it', async () => {
    resolveScript.mockResolvedValue(null)

    expect((await warm({ narration: KEY })).status).toBe(404)
    expect(synthesise).not.toHaveBeenCalled()
  })

  it('refuses a question that does not exist', async () => {
    resolveAnswer.mockResolvedValue(null)

    expect((await warm({ answer: { topic: 'javascript/closures', question: 'no' } })).status).toBe(
      404,
    )
    expect(synthesise).not.toHaveBeenCalled()
  })

  it('never lets a key name a file, since it is used as one', async () => {
    for (const narration of ['../../etc/passwd', `${KEY}.opus`, 'ABC', '', 'a'.repeat(63)]) {
      expect((await warm({ narration })).status).toBe(400)
    }

    expect(resolveScript).not.toHaveBeenCalled()
  })

  it('refuses a body that names neither a section nor a question', async () => {
    for (const body of [{}, { narration: 7 }, { answer: {} }, { answer: { topic: 'x' } }, []]) {
      expect((await warm(body)).status).toBe(400)
    }
  })

  it('refuses a body that is not JSON', async () => {
    const response = await POST(
      new Request('http://localhost/api/speech/warm', { method: 'POST', body: 'not json' }),
    )

    expect(response.status).toBe(400)
  })

  it('says the voice is unavailable when the engine does not answer', async () => {
    synthesise.mockRejectedValue(new SpeechServiceError('unreachable'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect((await warm({ narration: KEY })).status).toBe(502)
  })

  it('refuses a request with no session, without resolving anything', async () => {
    getSession.mockResolvedValue(null as never)

    expect((await warm({ narration: KEY })).status).toBe(401)
    expect(resolveScript).not.toHaveBeenCalled()
  })
})
