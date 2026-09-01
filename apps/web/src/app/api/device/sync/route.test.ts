import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const sync = vi.fn()

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => getSession(...args) } },
}))
vi.mock('@/lib/sync', () => ({ sync: (...args: unknown[]) => sync(...args) }))

const { POST } = await import('./route')

const SIGNED_IN = { user: { id: 'user-1' } }

const BODY = {
  device: { id: 'device-1', name: 'Pixel' },
  since: null,
  attempts: [
    {
      id: 'attempt-1',
      questionId: 'javascript/closures#what-is-a-closure',
      topicSlug: 'javascript/closures',
      answer: 'the first option',
      result: 'passed',
      confidence: 3,
      hintsUsed: 0,
      notes: null,
      attemptedAt: '2026-08-17T09:00:00.000Z',
    },
  ],
  topicProgress: [{ topicSlug: 'javascript/closures', learnedAt: '2026-08-16T09:00:00.000Z' }],
  trackTiers: [{ technology: 'javascript', tier: 'swe-2', updatedAt: '2026-08-16T09:00:00.000Z' }],
  exerciseProgress: [
    {
      exerciseSlug: 'javascript/closures/counter',
      topicSlug: 'javascript/closures',
      status: 'completed',
      notes: 'took two goes',
      completedAt: '2026-08-16T10:00:00.000Z',
      updatedAt: '2026-08-16T10:00:00.000Z',
    },
  ],
}

function post(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/device/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

/** The same body with one field replaced, for the rejections below. */
function withField(path: string, value: unknown) {
  const body = structuredClone(BODY) as Record<string, unknown>
  const parts = path.split('.')
  let cursor = body
  for (const part of parts.slice(0, -1)) cursor = cursor[part] as Record<string, unknown>
  cursor[parts.at(-1) as string] = value
  return body
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue(SIGNED_IN)
  sync.mockResolvedValue({
    syncedAt: new Date('2026-08-19T09:00:00.000Z'),
    attempts: [],
    topicProgress: [],
    trackTiers: [],
    exerciseProgress: [],
  })
})

describe('POST /api/device/sync', () => {
  it('refuses a request with no session', async () => {
    getSession.mockResolvedValue(null)

    const response = await post(BODY)

    expect(response.status).toBe(401)
    expect(sync).not.toHaveBeenCalled()
  })

  it('hands the exchange over with every timestamp already a date', async () => {
    await post(BODY)

    const [userId, request] = sync.mock.calls[0] ?? []
    expect(userId).toBe('user-1')
    expect(request.attempts[0].attemptedAt).toEqual(new Date('2026-08-17T09:00:00.000Z'))
    expect(request.topicProgress[0].learnedAt).toEqual(new Date('2026-08-16T09:00:00.000Z'))
    expect(request.trackTiers[0].updatedAt).toEqual(new Date('2026-08-16T09:00:00.000Z'))
    expect(request.exerciseProgress[0].completedAt).toEqual(new Date('2026-08-16T10:00:00.000Z'))
    expect(request.since).toBeNull()
  })

  it('answers with the exchange, dates as strings the device can parse', async () => {
    sync.mockResolvedValue({
      syncedAt: new Date('2026-08-19T09:00:00.000Z'),
      attempts: [
        {
          id: 'attempt-2',
          questionId: 'javascript/closures#shared-scope',
          topicSlug: 'javascript/closures',
          answer: '',
          result: 'weak',
          confidence: 3,
          hintsUsed: 1,
          notes: null,
          attemptedAt: new Date('2026-08-18T09:00:00.000Z'),
        },
      ],
      topicProgress: [
        { topicSlug: 'javascript/closures', learnedAt: new Date('2026-08-16T09:00:00.000Z') },
      ],
      trackTiers: [
        {
          technology: 'javascript',
          tier: 'swe-2',
          updatedAt: new Date('2026-08-16T09:00:00.000Z'),
        },
      ],
      exerciseProgress: [
        {
          exerciseSlug: 'javascript/closures/counter',
          topicSlug: 'javascript/closures',
          status: 'in_progress',
          notes: null,
          completedAt: null,
          updatedAt: new Date('2026-08-16T10:00:00.000Z'),
        },
      ],
    })

    const body = await (await post(BODY)).json()

    expect(body.syncedAt).toBe('2026-08-19T09:00:00.000Z')
    expect(body.attempts[0].attemptedAt).toBe('2026-08-18T09:00:00.000Z')
    expect(body.topicProgress[0].learnedAt).toBe('2026-08-16T09:00:00.000Z')
    expect(body.trackTiers[0].updatedAt).toBe('2026-08-16T09:00:00.000Z')
    expect(body.exerciseProgress[0].updatedAt).toBe('2026-08-16T10:00:00.000Z')
    // A row still in progress has no completion, and null survives the trip
    // rather than arriving as the string "null".
    expect(body.exerciseProgress[0].completedAt).toBeNull()
  })

  it('takes a since and passes it on as a date', async () => {
    await post({ ...BODY, since: '2026-08-18T09:00:00.000Z' })

    expect(sync.mock.calls[0]?.[1].since).toEqual(new Date('2026-08-18T09:00:00.000Z'))
  })

  it.each([
    ['a body that is not an object', 'not a body'],
    ['a missing device', { ...BODY, device: undefined }],
    ['an unnamed device', withField('device.name', '')],
    ['a result the ladder has no rung for', withField('attempts.0.result', 'brilliant')],
    ['a tier that is not one of the four', withField('trackTiers.0.tier', 'principal')],
    [
      'an exercise status the platform has no meaning for',
      withField('exerciseProgress.0.status', 'abandoned'),
    ],
    [
      'an exercise key with no exercise in it',
      withField('exerciseProgress.0.exerciseSlug', 'javascript/closures'),
    ],
    ['a confidence off the scale', withField('attempts.0.confidence', 9)],
    ['a date that is not one', withField('attempts.0.attemptedAt', 'tuesday')],
    [
      'a question key with no question in it',
      withField('attempts.0.questionId', 'javascript/closures'),
    ],
  ])('rejects %s', async (_name, body) => {
    const response = await post(body)

    expect(response.status).toBe(400)
    expect(sync).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON at all', async () => {
    const response = await POST(
      new Request('http://localhost/api/device/sync', { method: 'POST', body: 'not json' }),
    )

    expect(response.status).toBe(400)
  })

  /** A sync carrying nothing is how a device asks what it has missed. */
  it('accepts an exchange with nothing to give', async () => {
    const response = await post({
      device: { id: 'device-1', name: 'Pixel' },
      since: null,
      attempts: [],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    })

    expect(response.status).toBe(200)
    expect(sync).toHaveBeenCalled()
  })
})
