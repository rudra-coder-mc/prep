import { z } from 'zod'
import { auth } from '@/lib/auth'
import { EXERCISE_STATUSES, RESULTS, TIERS } from '@prep/core'
import { sync } from '@/lib/sync'

/**
 * The exchange of progress with a device, and the one device endpoint that
 * writes. Everything the device has that this server does not goes up, and
 * everything this server has that the device does not comes back, in one
 * request, because a phone gets one moment of connectivity and there is no
 * reason to spend it on four.
 *
 * The merge itself is in @/lib/sync. This is the shape of the wire and nothing
 * else: dates arrive as strings and leave as strings, and everything inside
 * works in `Date`.
 */

/** Rejects "tuesday" and "", which `new Date` would otherwise turn into an Invalid Date. */
const timestamp = z.iso.datetime().transform((value) => new Date(value))

const attempt = z.object({
  id: z.string().min(1),
  // Made by questionKey, and the half after the # is what says which question.
  questionId: z.string().regex(/^[^#]+#[^#]+$/, 'must be a topic slug and a question id'),
  topicSlug: z.string().min(1),
  answer: z.string(),
  result: z.enum(RESULTS),
  confidence: z.number().int().min(1).max(5),
  hintsUsed: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  attemptedAt: timestamp,
})

const exercise = z.object({
  // Made by exerciseKey, which joins the topic slug and the exercise id with a
  // slash, so the whole thing is three segments.
  exerciseSlug: z
    .string()
    .regex(/^[^/]+\/[^/]+\/[^/]+$/, 'must be a topic slug and an exercise id'),
  topicSlug: z.string().min(1),
  status: z.enum(EXERCISE_STATUSES),
  notes: z.string().nullable(),
  completedAt: timestamp.nullable(),
  updatedAt: timestamp,
})

const requestSchema = z.object({
  device: z.object({ id: z.string().min(1), name: z.string().min(1) }),
  since: timestamp.nullable(),
  attempts: z.array(attempt),
  topicProgress: z.array(z.object({ topicSlug: z.string().min(1), learnedAt: timestamp })),
  trackTiers: z.array(
    z.object({ technology: z.string().min(1), tier: z.enum(TIERS), updatedAt: timestamp }),
  ),
  exerciseProgress: z.array(exercise),
})

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problem(400, 'Send a sync as JSON')
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return problem(400, `That is not a sync: ${z.prettifyError(parsed.error)}`)
  }

  const result = await sync(session.user.id, parsed.data)

  return Response.json(
    {
      syncedAt: result.syncedAt.toISOString(),
      attempts: result.attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
      topicProgress: result.topicProgress.map((t) => ({
        ...t,
        learnedAt: t.learnedAt.toISOString(),
      })),
      trackTiers: result.trackTiers.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() })),
      exerciseProgress: result.exerciseProgress.map((e) => ({
        ...e,
        completedAt: e.completedAt?.toISOString() ?? null,
        updatedAt: e.updatedAt.toISOString(),
      })),
    },
    // The device stores the answer and asks again from the watermark in it, so a
    // cached one would be a sync that never happened.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
