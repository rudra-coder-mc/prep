import 'server-only'
import { and, desc, eq, gt, gte, inArray, lt, notInArray } from 'drizzle-orm'
import { db } from '@/db'
import {
  attempts,
  dailyActivity,
  deviceSync,
  exerciseProgress,
  reviewSchedule,
  topicProgress,
  trackTier,
} from '@/db/schema'
import { getQuestionsByKeys, getTopic } from '@prep/content'
import {
  addDays,
  countDueToday,
  replaySchedule,
  toDayString,
  type ExerciseStatus,
  type Result,
  type ScheduledQuestion,
  type Tier,
} from '@prep/core'
import { enrol, enrolLearnedTopics } from '@/lib/progress'
import { getTrackTier } from '@/lib/track-tier'

/**
 * The two-way exchange of progress with a device.
 *
 * Four things travel, and nothing else does, because everything else is derived
 * from them: attempts, learned marks, tier picks and exercise progress. The
 * schedule, the streak and every topic status are rebuilt on whichever side
 * receives them, which is why two devices merging have nothing to resolve.
 *
 * Attempts merge by id, and an attempt is immutable, so the same one arriving
 * twice changes nothing. The other three merge by timestamp with the later one
 * winning. Every rule is commutative and idempotent, so a sync that fails
 * halfway is repaired by the next one rather than needing to be rolled back.
 * Exercise progress is the one collection nothing derives, which is why it is
 * carried rather than rebuilt. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */

export type IncomingAttempt = {
  /** Made by whichever side recorded the answer, and the whole of its identity. */
  id: string
  questionId: string
  topicSlug: string
  answer: string
  result: Result
  confidence: number
  hintsUsed: number
  notes: string | null
  attemptedAt: Date
}

export type LearnedMark = { topicSlug: string; learnedAt: Date }
export type TierPick = { technology: string; tier: Tier; updatedAt: Date }

/** How an exercise went, which is state rather than a fact entered at a moment. */
export type ExerciseRecord = {
  exerciseSlug: string
  topicSlug: string
  status: ExerciseStatus
  notes: string | null
  completedAt: Date | null
  updatedAt: Date
}

export type SyncRequest = {
  device: { id: string; name: string }
  /** The `syncedAt` of this device's last exchange, or null if it has never had one. */
  since: Date | null
  attempts: IncomingAttempt[]
  topicProgress: LearnedMark[]
  trackTiers: TierPick[]
  exerciseProgress: ExerciseRecord[]
}

export type SyncResponse = {
  /** What the device sends back as `since` next time. */
  syncedAt: Date
  attempts: IncomingAttempt[]
  topicProgress: LearnedMark[]
  trackTiers: TierPick[]
  exerciseProgress: ExerciseRecord[]
}

export async function sync(
  userId: string,
  request: SyncRequest,
  now = new Date(),
): Promise<SyncResponse> {
  // Taken before anything is written, so a row this exchange creates is never
  // behind the watermark the device will ask from next time. The cost of being
  // early is sending a row twice, and the cost of being late is losing it.
  const syncedAt = now

  const changedTracks = await mergeTierPicks(userId, request.trackTiers)
  const newlyLearned = await mergeLearnedMarks(userId, request.topicProgress)
  await mergeExerciseProgress(userId, request.exerciseProgress)
  const ingested = await ingestAttempts(userId, request.attempts, now)

  await enrolNewlyLearned(userId, newlyLearned)
  for (const technology of changedTracks) {
    await enrolLearnedTopics(userId, technology, await getTrackTier(userId, technology), now)
  }

  await rebuildSchedules(userId, ingested.questionKeys)
  await rebuildLastReviewed(userId, ingested.topicSlugs)
  await rebuildActivity(userId, ingested.days, now)
  await recordDevice(userId, request.device, now)

  return {
    syncedAt,
    attempts: await attemptsSince(userId, request.since, request.attempts),
    topicProgress: await learnedMarks(userId),
    trackTiers: await tierPicks(userId),
    exerciseProgress: await exerciseRecords(userId),
  }
}

/* -------------------------------------------------------------------------- */
/* Taking what the device has                                                 */
/* -------------------------------------------------------------------------- */

/** Later pick wins. Returns the tracks whose tier actually moved. */
async function mergeTierPicks(userId: string, picks: TierPick[]): Promise<string[]> {
  const changed: string[] = []

  for (const pick of picks) {
    const [stored] = await db
      .select({ tier: trackTier.tier, updatedAt: trackTier.updatedAt })
      .from(trackTier)
      .where(and(eq(trackTier.userId, userId), eq(trackTier.technology, pick.technology)))
      .limit(1)

    if (stored && stored.updatedAt >= pick.updatedAt) continue

    await db
      .insert(trackTier)
      .values({
        userId,
        technology: pick.technology,
        tier: pick.tier,
        updatedAt: pick.updatedAt,
      })
      .onConflictDoUpdate({
        target: [trackTier.userId, trackTier.technology],
        set: { tier: pick.tier, updatedAt: pick.updatedAt },
      })

    if (stored?.tier !== pick.tier) changed.push(pick.technology)
  }

  return changed
}

/**
 * Later mark wins. Returns the topics whose mark moved, which are the ones that
 * still have to be enrolled.
 */
async function mergeLearnedMarks(userId: string, marks: LearnedMark[]): Promise<LearnedMark[]> {
  const moved: LearnedMark[] = []

  for (const mark of marks) {
    const [stored] = await db
      .select({ learnedAt: topicProgress.learnedAt })
      .from(topicProgress)
      .where(and(eq(topicProgress.userId, userId), eq(topicProgress.topicSlug, mark.topicSlug)))
      .limit(1)

    if (stored?.learnedAt && stored.learnedAt >= mark.learnedAt) continue

    await db
      .insert(topicProgress)
      .values({ userId, topicSlug: mark.topicSlug, learnedAt: mark.learnedAt })
      .onConflictDoUpdate({
        target: [topicProgress.userId, topicProgress.topicSlug],
        set: { learnedAt: mark.learnedAt },
      })

    moved.push(mark)
  }

  return moved
}

/**
 * Later row wins, the way a tier pick does. Nothing is returned because nothing
 * follows from it: an exercise has no schedule, no ladder and no streak, and the
 * only thing that reads it is a screen.
 */
async function mergeExerciseProgress(userId: string, records: ExerciseRecord[]): Promise<void> {
  for (const record of records) {
    const [stored] = await db
      .select({ updatedAt: exerciseProgress.updatedAt })
      .from(exerciseProgress)
      .where(
        and(
          eq(exerciseProgress.userId, userId),
          eq(exerciseProgress.exerciseSlug, record.exerciseSlug),
        ),
      )
      .limit(1)

    if (stored && stored.updatedAt >= record.updatedAt) continue

    await db
      .insert(exerciseProgress)
      .values({
        userId,
        exerciseSlug: record.exerciseSlug,
        topicSlug: record.topicSlug,
        status: record.status,
        notes: record.notes,
        completedAt: record.completedAt,
        updatedAt: record.updatedAt,
      })
      .onConflictDoUpdate({
        target: [exerciseProgress.userId, exerciseProgress.exerciseSlug],
        set: {
          topicSlug: record.topicSlug,
          status: record.status,
          notes: record.notes,
          completedAt: record.completedAt,
          updatedAt: record.updatedAt,
        },
      })
  }
}

type Ingested = { questionKeys: string[]; topicSlugs: string[]; days: Set<string> }

/**
 * Inserts what the device answered. Nothing is updated: an attempt already here
 * is the same attempt, since its id was made when the answer was given.
 */
async function ingestAttempts(
  userId: string,
  incoming: IncomingAttempt[],
  now: Date,
): Promise<Ingested> {
  if (incoming.length === 0) {
    return { questionKeys: [], topicSlugs: [], days: new Set() }
  }

  await db
    .insert(attempts)
    .values(
      incoming.map((a) => ({
        id: a.id,
        userId,
        questionId: a.questionId,
        topicSlug: a.topicSlug,
        answer: a.answer,
        result: a.result,
        confidence: a.confidence,
        hintsUsed: a.hintsUsed,
        notes: a.notes,
        attemptedAt: a.attemptedAt,
        recordedAt: now,
      })),
    )
    .onConflictDoNothing({ target: attempts.id })

  return {
    questionKeys: [...new Set(incoming.map((a) => a.questionId))],
    topicSlugs: [...new Set(incoming.map((a) => a.topicSlug))],
    days: new Set(incoming.map((a) => toDayString(a.attemptedAt))),
  }
}

/* -------------------------------------------------------------------------- */
/* Rebuilding what is derived from it                                         */
/* -------------------------------------------------------------------------- */

/**
 * Marking a topic learned is what enrols its questions, so a mark that arrived
 * from a device has to enrol them here too. Each topic is enrolled as of when it
 * was learned rather than now, so a question learned offline on Monday is due
 * from Monday.
 */
async function enrolNewlyLearned(userId: string, marks: LearnedMark[]) {
  for (const mark of marks) {
    const [technology, directory] = mark.topicSlug.split('/')
    if (!technology || !directory) continue

    const topic = await getTopic(technology, directory)
    if (!topic) continue

    await enrol(userId, [topic], await getTrackTier(userId, technology), mark.learnedAt)
  }
}

/**
 * Replays each affected question's whole history through the interval ladder.
 *
 * Rebuilding rather than stepping is what makes an attempt from three days ago
 * land where it would have landed had it arrived on the day. A question whose
 * content has been deleted has no form to replay against, so its schedule row is
 * left as it stands.
 */
async function rebuildSchedules(userId: string, questionKeys: string[]) {
  if (questionKeys.length === 0) return

  const forms = new Map(
    (await getQuestionsByKeys(questionKeys)).map(({ topic, question }) => [
      `${topic.slug}#${question.id}`,
      question.form,
    ]),
  )

  const history = await db
    .select({
      questionId: attempts.questionId,
      topicSlug: attempts.topicSlug,
      result: attempts.result,
      attemptedAt: attempts.attemptedAt,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), inArray(attempts.questionId, questionKeys)))

  for (const key of questionKeys) {
    const form = forms.get(key)
    if (!form) continue

    const forQuestion = history.filter((row) => row.questionId === key)
    const replayed = replaySchedule(form, forQuestion)
    const topicSlug = forQuestion[0]?.topicSlug
    if (!replayed || !topicSlug) continue

    await db
      .insert(reviewSchedule)
      .values({
        userId,
        questionId: key,
        topicSlug,
        dueAt: replayed.dueAt,
        intervalStep: replayed.step,
        lastResult: replayed.lastResult,
        updatedAt: replayed.updatedAt,
      })
      .onConflictDoUpdate({
        target: [reviewSchedule.userId, reviewSchedule.questionId],
        set: {
          dueAt: replayed.dueAt,
          intervalStep: replayed.step,
          lastResult: replayed.lastResult,
          updatedAt: replayed.updatedAt,
        },
      })
  }
}

/** Derived from the attempts rather than taken from the device, for one definition of it. */
async function rebuildLastReviewed(userId: string, topicSlugs: string[]) {
  for (const topicSlug of topicSlugs) {
    // The latest row rather than max(), so the timestamp comes back through the
    // column's own mapping instead of as a string to be parsed here.
    const [row] = await db
      .select({ attemptedAt: attempts.attemptedAt })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.topicSlug, topicSlug)))
      .orderBy(desc(attempts.attemptedAt))
      .limit(1)

    const lastReviewedAt = row?.attemptedAt
    if (!lastReviewedAt) continue

    await db
      .insert(topicProgress)
      .values({ userId, topicSlug, lastReviewedAt })
      .onConflictDoUpdate({
        target: [topicProgress.userId, topicProgress.topicSlug],
        set: { lastReviewedAt },
      })
  }
}

/**
 * Counts each affected day's attempts back into the activity table, which is
 * what the streak is derived from. A week answered offline has to count as the
 * week it happened on rather than as the day it was handed over.
 *
 * Only today's queue can be said to have been cleared, because clearing is a
 * statement about the schedule as it stands. A past day's stored answer is left
 * alone, and a past day being reconstructed gets false, which changes nothing:
 * a day with attempts on it already counts toward the streak.
 */
async function rebuildActivity(userId: string, days: Set<string>, now: Date) {
  if (days.size === 0) return

  const sorted = [...days].sort()
  const first = sorted[0] as string
  const last = sorted.at(-1) as string
  // A calendar day in APP_TIMEZONE can begin and end up to a day either side of
  // the UTC day of the same name, so the window is widened before filtering.
  const from = new Date(`${addDays(first, -1)}T00:00:00.000Z`)
  const to = new Date(`${addDays(last, 2)}T00:00:00.000Z`)

  const rows = await db
    .select({ attemptedAt: attempts.attemptedAt })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        gte(attempts.attemptedAt, from),
        lt(attempts.attemptedAt, to),
      ),
    )

  const counts = new Map<string, number>()
  for (const row of rows) {
    const day = toDayString(row.attemptedAt)
    if (days.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  const today = toDayString(now)
  const cleared = days.has(today) ? await queueIsClear(userId, now) : false

  for (const [day, reviewed] of counts) {
    await db
      .insert(dailyActivity)
      .values({ userId, day, reviewed, queueCleared: day === today && cleared })
      .onConflictDoUpdate({
        target: [dailyActivity.userId, dailyActivity.day],
        set:
          day === today
            ? { reviewed, queueCleared: cleared }
            : // A past day's clearing cannot be recomputed, so it stays as recorded.
              { reviewed },
      })
  }
}

async function queueIsClear(userId: string, now: Date): Promise<boolean> {
  const remaining = await db
    .select({
      questionId: reviewSchedule.questionId,
      topicSlug: reviewSchedule.topicSlug,
      dueAt: reviewSchedule.dueAt,
      intervalStep: reviewSchedule.intervalStep,
      lastResult: reviewSchedule.lastResult,
    })
    .from(reviewSchedule)
    .where(eq(reviewSchedule.userId, userId))

  return countDueToday(remaining as ScheduledQuestion[], now) === 0
}

async function recordDevice(userId: string, device: { id: string; name: string }, now: Date) {
  await db
    .insert(deviceSync)
    .values({ userId, deviceId: device.id, name: device.name, lastSyncedAt: now })
    .onConflictDoUpdate({
      target: [deviceSync.userId, deviceSync.deviceId],
      set: { name: device.name, lastSyncedAt: now },
    })
}

/* -------------------------------------------------------------------------- */
/* Handing back what the device is missing                                    */
/* -------------------------------------------------------------------------- */

/**
 * How far back a watermark is actually read from.
 *
 * `recorded_at` is stamped when an exchange starts and committed when it
 * finishes, so a sync running alongside another one can commit a row dated
 * fractionally before the watermark it just handed out. Reading from slightly
 * behind the watermark covers that: an attempt sent twice is dropped by its id,
 * and one never sent is gone for good.
 */
const WATERMARK_OVERLAP_MS = 60_000

/**
 * Attempts by when the server learned of them rather than by when they were
 * answered, so an attempt another device only just delivered still reaches this
 * one however old it is.
 */
async function attemptsSince(
  userId: string,
  since: Date | null,
  justSent: IncomingAttempt[],
): Promise<IncomingAttempt[]> {
  const sentIds = justSent.map((a) => a.id)
  const from = since ? new Date(since.getTime() - WATERMARK_OVERLAP_MS) : null

  const rows = await db
    .select({
      id: attempts.id,
      questionId: attempts.questionId,
      topicSlug: attempts.topicSlug,
      answer: attempts.answer,
      result: attempts.result,
      confidence: attempts.confidence,
      hintsUsed: attempts.hintsUsed,
      notes: attempts.notes,
      attemptedAt: attempts.attemptedAt,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, userId),
        from ? gt(attempts.recordedAt, from) : undefined,
        sentIds.length > 0 ? notInArray(attempts.id, sentIds) : undefined,
      ),
    )
    .orderBy(attempts.attemptedAt)

  return rows
}

async function learnedMarks(userId: string): Promise<LearnedMark[]> {
  const rows = await db
    .select({ topicSlug: topicProgress.topicSlug, learnedAt: topicProgress.learnedAt })
    .from(topicProgress)
    .where(eq(topicProgress.userId, userId))

  return rows.flatMap((row) =>
    row.learnedAt ? [{ topicSlug: row.topicSlug, learnedAt: row.learnedAt }] : [],
  )
}

/**
 * The whole state rather than a delta, in both directions. There is one row per
 * track, one per topic and one per exercise, so the curriculum bounds them: a
 * full exchange stays small forever, and neither side needs a watermark to
 * reconcile them.
 */
async function tierPicks(userId: string): Promise<TierPick[]> {
  return db
    .select({
      technology: trackTier.technology,
      tier: trackTier.tier,
      updatedAt: trackTier.updatedAt,
    })
    .from(trackTier)
    .where(eq(trackTier.userId, userId))
}

/** In full as well, and bounded the same way: one row per exercise, at most. */
async function exerciseRecords(userId: string): Promise<ExerciseRecord[]> {
  return db
    .select({
      exerciseSlug: exerciseProgress.exerciseSlug,
      topicSlug: exerciseProgress.topicSlug,
      status: exerciseProgress.status,
      notes: exerciseProgress.notes,
      completedAt: exerciseProgress.completedAt,
      updatedAt: exerciseProgress.updatedAt,
    })
    .from(exerciseProgress)
    .where(eq(exerciseProgress.userId, userId))
}
