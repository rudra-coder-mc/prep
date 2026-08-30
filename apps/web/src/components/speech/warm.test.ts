import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { warmAnswer, warmNarration } from './warm'

const KEY = 'f'.repeat(64)

let fetchMock: ReturnType<typeof vi.fn>

function sent() {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
  return { url, method: init.method, body: JSON.parse(String(init.body)) }
}

beforeEach(() => {
  fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('warming a recording', () => {
  it('names a section by its key', () => {
    warmNarration(KEY)

    expect(sent()).toEqual({
      url: '/api/speech/warm',
      method: 'POST',
      body: { narration: KEY },
    })
  })

  it('names an answer by its question, since the answer has no key on the page yet', () => {
    warmAnswer('javascript/closures', 'q1')

    expect(sent().body).toEqual({ answer: { topic: 'javascript/closures', question: 'q1' } })
  })

  it('swallows a refusal, because nobody is waiting on a warm', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 502 }))

    expect(() => warmNarration(KEY)).not.toThrow()
  })

  it('swallows an unreachable server rather than leaving an unhandled rejection', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))

    expect(() => warmNarration(KEY)).not.toThrow()
    await Promise.resolve()
  })
})
