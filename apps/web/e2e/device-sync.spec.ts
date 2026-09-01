import { expect, test } from '@playwright/test'
import { SIGNED_OUT_STATE } from './constants'
import { deviceHeaders } from './device'

test.use({ storageState: SIGNED_OUT_STATE })

const TOPIC = 'javascript/closures'
const QUESTION = `${TOPIC}#what-is-a-closure`
const EXERCISE = 'javascript/prototypes/safe-lookup'

/**
 * The exchange as a device runs it: over HTTP, with a bearer token and nothing
 * else, against the real server and a real database.
 *
 * What the merge does to rows is pinned in
 * apps/web/src/lib/sync.integration.test.ts, where the two sides can be compared
 * exactly. What this adds is everything between the phone and that function:
 * the header, the JSON, the watermark that comes back, and a second device
 * seeing what the first one handed over.
 *
 * It answers a question and marks a topic learned, which is the same state the
 * review specs create, and deliberately picks no tier: the pick is what the
 * dashboard and tier specs read. The exercise it records belongs to a topic no
 * other spec opens, for the same reason.
 */
test('a device hands over what it answered and is handed back what it missed', async ({
  request,
}) => {
  const headers = await deviceHeaders(request)
  const attemptId = crypto.randomUUID()
  const attemptedAt = new Date().toISOString()

  const pushed = await request.post('/api/device/sync', {
    headers,
    data: {
      device: { id: 'e2e-phone', name: 'E2E phone' },
      since: null,
      attempts: [
        {
          id: attemptId,
          questionId: QUESTION,
          topicSlug: TOPIC,
          answer: 'a function that keeps its scope',
          result: 'passed',
          confidence: 3,
          hintsUsed: 0,
          notes: null,
          attemptedAt,
        },
      ],
      topicProgress: [{ topicSlug: TOPIC, learnedAt: attemptedAt }],
      trackTiers: [],
      exerciseProgress: [
        {
          exerciseSlug: EXERCISE,
          topicSlug: 'javascript/prototypes',
          status: 'completed',
          notes: 'done on the train',
          completedAt: attemptedAt,
          updatedAt: attemptedAt,
        },
      ],
    },
  })

  expect(pushed.status()).toBe(200)
  const first = await pushed.json()

  // The watermark the device stores and asks from next time.
  expect(Date.parse(first.syncedAt)).not.toBeNaN()
  // Its own attempt is not read back to it.
  expect(first.attempts.map((a: { id: string }) => a.id)).not.toContain(attemptId)
  expect(first.topicProgress.map((t: { topicSlug: string }) => t.topicSlug)).toContain(TOPIC)

  // A second device, which has never synced, is given everything including what
  // the first one just handed over.
  const other = await request.post('/api/device/sync', {
    headers,
    data: {
      device: { id: 'e2e-tablet', name: 'E2E tablet' },
      since: null,
      attempts: [],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    },
  })

  expect(other.status()).toBe(200)
  const seen = await other.json()
  const mine = seen.attempts.find((a: { id: string }) => a.id === attemptId)
  expect(mine).toBeDefined()
  expect(mine.questionId).toBe(QUESTION)
  expect(mine.result).toBe('passed')
  expect(mine.attemptedAt).toBe(attemptedAt)

  // Exercise progress is state rather than a fact about a moment, so it comes
  // back in full to every device including the one that sent it.
  const exercise = seen.exerciseProgress.find(
    (row: { exerciseSlug: string }) => row.exerciseSlug === EXERCISE,
  )
  expect(exercise).toMatchObject({ status: 'completed', notes: 'done on the train' })

  // Asking again from the watermark brings back nothing the device does not
  // already hold, which is what makes a sync on every launch cheap. Not nothing
  // at all: the read reaches a minute back past the watermark on purpose, so
  // that a row committed by a sync running alongside this one is never skipped.
  const again = await request.post('/api/device/sync', {
    headers,
    data: {
      device: { id: 'e2e-tablet', name: 'E2E tablet' },
      since: seen.syncedAt,
      attempts: [],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    },
  })

  const held = new Set(seen.attempts.map((a: { id: string }) => a.id))
  const returned = (await again.json()).attempts as { id: string }[]
  expect(returned.filter((a) => !held.has(a.id))).toEqual([])
})

test('a sync needs a session', async ({ request }) => {
  const response = await request.post('/api/device/sync', {
    data: {
      device: { id: 'e2e-phone', name: 'E2E phone' },
      since: null,
      attempts: [],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    },
  })

  expect(response.status()).toBe(401)
})

test('a malformed sync is refused rather than half applied', async ({ request }) => {
  const headers = await deviceHeaders(request)

  const response = await request.post('/api/device/sync', {
    headers,
    data: {
      device: { id: 'e2e-phone', name: 'E2E phone' },
      since: null,
      attempts: [{ id: 'nonsense', questionId: QUESTION, topicSlug: TOPIC, result: 'brilliant' }],
      topicProgress: [],
      trackTiers: [],
      exerciseProgress: [],
    },
  })

  expect(response.status()).toBe(400)
})
