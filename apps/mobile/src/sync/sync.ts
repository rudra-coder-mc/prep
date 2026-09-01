import type { ArchiveContent } from '@prep/content/archive/types'
import {
  addDays,
  countDueToday,
  DEFAULT_TIER,
  replaySchedule,
  toDayString,
  type AnswerForm,
  type Result,
  type Tier,
} from '@prep/core'
import { readExerciseProgress } from '../db/exercises'
import { readSchedule } from '../db/schedule'
import { readLearnedTopics, readTierPicks, readTrackTiers } from '../db/progress'
import { readSetting, writeSetting } from '../db/settings'
import type { Database } from '../db/sqlite'
import { enrolLearnedTopics, enrolTopicQuestions } from '../library/learn'
import type {
  ServerClient,
  SyncAttempt,
  SyncExerciseProgress,
  SyncLearnedMark,
  SyncTierPick,
} from '../server/client'
import type { DeviceIdentity } from '../device/identity'

/**
 * The exchange of progress with the server, from the device's end.
 *
 * It is the mirror image of apps/web/src/lib/sync.ts and it merges by the same
 * rules: attempts by id, and learned marks, tier picks and exercise progress by
 * timestamp with the later winning. All of them are commutative and idempotent,
 * so nothing here is wrapped in a transaction and an exchange that fails halfway
 * is repaired by the next one. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 *
 * Nothing here catches anything. A sync is never required: the app works
 * entirely from what it already holds, so an unreachable server is the caller's
 * to shrug at. See docs/decisions/0047-the-phone-syncs-when-it-can.md.
 */

export type SyncOutcome = {
  /** What the next exchange asks from. */
  syncedAt: Date
  /** Attempts handed over, which is what was waiting on this device. */
  sent: number
  received: { attempts: number; learned: number; tiers: number; exercises: number }
}

export type SyncStores = {
  db: Database
  /** The curriculum this device holds, which is what a schedule is rebuilt against. */
  content: ArchiveContent
  client: ServerClient
  device: DeviceIdentity
}

export async function syncProgress(
  { db, content, client, device }: SyncStores,
  now = new Date(),
): Promise<SyncOutcome> {
  const pending = await unsyncedAttempts(db)

  const response = await client.sync({
    device,
    since: await lastSyncedAt(db),
    attempts: pending,
    // In full rather than as a delta, in both directions. There is one row per
    // topic, one per track and one per exercise, so the curriculum bounds them.
    topicProgress: await learnedMarks(db),
    trackTiers: await readTierPicks(db),
    exerciseProgress: await readExerciseProgress(db),
  })

  // The server has them, so they need never be sent again. Marked before the
  // rest: a failure below leaves attempts recorded twice at worst, and the
  // server drops the duplicates by id.
  await markSynced(
    db,
    pending.map((attempt) => attempt.id),
  )

  const changedTracks = await mergeTierPicks(db, response.trackTiers)
  const movedMarks = await mergeLearnedMarks(db, response.topicProgress)
  const movedExercises = await mergeExerciseProgress(db, response.exerciseProgress)
  const ingested = await ingestAttempts(db, response.attempts)

  // After the picks have been merged, so a topic learned elsewhere enrols the
  // questions the tier now in force covers rather than the one it replaced.
  const tiers = await readTrackTiers(db)
  await enrolNewlyLearned(db, content, tiers, movedMarks)
  for (const technology of changedTracks) {
    await enrolLearnedTopics(db, content, technology, tiers.get(technology) ?? DEFAULT_TIER, now)
  }

  await rebuildSchedules(db, content, [...ingested.questionKeys, ...(await unscheduled(db))])
  await rebuildLastReviewed(db, ingested.topicSlugs)
  await rebuildActivity(db, ingested.days, now)

  // Last, so an exchange that failed on any step above asks from the same
  // watermark again rather than stepping over what it did not finish.
  await writeSetting(db, 'last-synced-at', response.syncedAt.toISOString())

  return {
    syncedAt: response.syncedAt,
    sent: pending.length,
    received: {
      attempts: response.attempts.length,
      learned: movedMarks.length,
      tiers: changedTracks.length,
      exercises: movedExercises,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* What this device has that the server does not                              */
/* -------------------------------------------------------------------------- */

async function lastSyncedAt(db: Database): Promise<Date | null> {
  const stored = await readSetting(db, 'last-synced-at')
  return stored ? new Date(stored) : null
}

type AttemptRow = {
  id: string
  question_id: string
  topic_slug: string
  answer: string
  result: Result
  confidence: number
  hints_used: number
  notes: string | null
  attempted_at: string
}

/** Everything answered on this device that the server has not been told about. */
async function unsyncedAttempts(db: Database): Promise<SyncAttempt[]> {
  const rows = await db.all<AttemptRow>(
    `select id, question_id, topic_slug, answer, result, confidence, hints_used, notes, attempted_at
     from attempts where synced = 0 order by attempted_at`,
  )

  return rows.map((row) => ({
    id: row.id,
    questionId: row.question_id,
    topicSlug: row.topic_slug,
    answer: row.answer,
    result: row.result,
    confidence: row.confidence,
    hintsUsed: row.hints_used,
    notes: row.notes,
    attemptedAt: new Date(row.attempted_at),
  }))
}

async function learnedMarks(db: Database): Promise<SyncLearnedMark[]> {
  return [...(await readLearnedTopics(db))].map(([topicSlug, learnedAt]) => ({
    topicSlug,
    learnedAt,
  }))
}

async function markSynced(db: Database, ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const placeholders = ids.map(() => '?').join(', ')
  await db.run(`update attempts set synced = 1 where id in (${placeholders})`, ids)
}

/* -------------------------------------------------------------------------- */
/* Taking what came back                                                      */
/* -------------------------------------------------------------------------- */

/** Later pick wins. Returns the tracks whose tier actually moved. */
async function mergeTierPicks(db: Database, picks: SyncTierPick[]): Promise<string[]> {
  const stored = new Map((await readTierPicks(db)).map((pick) => [pick.technology, pick]))
  const changed: string[] = []

  for (const pick of picks) {
    const held = stored.get(pick.technology)
    if (held && held.updatedAt >= pick.updatedAt) continue

    await db.run(
      `insert into track_tier (technology, tier, updated_at) values (?, ?, ?)
       on conflict (technology) do update set tier = excluded.tier, updated_at = excluded.updated_at`,
      [pick.technology, pick.tier, pick.updatedAt.toISOString()],
    )

    if (held?.tier !== pick.tier) changed.push(pick.technology)
  }

  return changed
}

/**
 * Later mark wins. Returns the marks that moved, which are the ones whose
 * questions still have to be enrolled.
 */
async function mergeLearnedMarks(
  db: Database,
  marks: SyncLearnedMark[],
): Promise<SyncLearnedMark[]> {
  const stored = await readLearnedTopics(db)
  const moved: SyncLearnedMark[] = []

  for (const mark of marks) {
    const held = stored.get(mark.topicSlug)
    if (held && held >= mark.learnedAt) continue

    // The mark and nothing else: a topic reviewed here has a last-reviewed date
    // in the same row, and it is derived from the attempts rather than sent.
    await db.run(
      `insert into topic_progress (topic_slug, learned_at) values (?, ?)
       on conflict (topic_slug) do update set learned_at = excluded.learned_at`,
      [mark.topicSlug, mark.learnedAt.toISOString()],
    )

    moved.push(mark)
  }

  return moved
}

/**
 * Later row wins, the way a tier pick does. Returns how many moved, which is
 * only ever used to decide whether a screen has to read the tables again:
 * nothing follows from an exercise the way enrolment follows from a mark.
 */
async function mergeExerciseProgress(
  db: Database,
  records: SyncExerciseProgress[],
): Promise<number> {
  const stored = new Map(
    (await readExerciseProgress(db)).map((row) => [row.exerciseSlug, row.updatedAt]),
  )
  let moved = 0

  for (const record of records) {
    const held = stored.get(record.exerciseSlug)
    if (held && held >= record.updatedAt) continue

    await db.run(
      `insert into exercise_progress
         (exercise_slug, topic_slug, status, notes, completed_at, updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict (exercise_slug) do update set
         topic_slug = excluded.topic_slug,
         status = excluded.status,
         notes = excluded.notes,
         completed_at = excluded.completed_at,
         updated_at = excluded.updated_at`,
      [
        record.exerciseSlug,
        record.topicSlug,
        record.status,
        record.notes,
        record.completedAt?.toISOString() ?? null,
        record.updatedAt.toISOString(),
      ],
    )

    moved += 1
  }

  return moved
}

type Ingested = { questionKeys: string[]; topicSlugs: string[]; days: Set<string> }

/**
 * Writes down what was answered elsewhere. An attempt already here is the same
 * attempt, since its id was made where the answer was given, so the only thing
 * a second arrival changes is that the row is known to be on the server.
 */
async function ingestAttempts(db: Database, incoming: SyncAttempt[]): Promise<Ingested> {
  if (incoming.length === 0) return { questionKeys: [], topicSlugs: [], days: new Set() }

  await db.transaction(async () => {
    for (const attempt of incoming) {
      await db.run(
        `insert into attempts
           (id, question_id, topic_slug, answer, result, confidence, hints_used, notes, attempted_at, synced)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         on conflict (id) do update set synced = 1`,
        [
          attempt.id,
          attempt.questionId,
          attempt.topicSlug,
          attempt.answer,
          attempt.result,
          attempt.confidence,
          attempt.hintsUsed,
          attempt.notes,
          attempt.attemptedAt.toISOString(),
        ],
      )
    }
  })

  return {
    questionKeys: [...new Set(incoming.map((attempt) => attempt.questionId))],
    topicSlugs: [...new Set(incoming.map((attempt) => attempt.topicSlug))],
    days: new Set(incoming.map((attempt) => toDayString(attempt.attemptedAt))),
  }
}

/**
 * Marking a topic learned is what enrols its questions, so a mark that arrived
 * from the server has to enrol them here too, as of when it was learned rather
 * than now.
 *
 * A topic the archive on this device has never heard of is skipped: it was
 * learned on the laptop against content this phone has not downloaded yet. The
 * mark is stored either way, so the topic reads as learned, and its questions
 * are enrolled by whatever marks it learned next. See task 42 in TASKS.md.
 */
async function enrolNewlyLearned(
  db: Database,
  content: ArchiveContent,
  tiers: Map<string, Tier>,
  marks: SyncLearnedMark[],
): Promise<void> {
  for (const mark of marks) {
    const topic = content.topics.find((candidate) => candidate.slug === mark.topicSlug)
    if (!topic) continue

    await enrolTopicQuestions(
      db,
      topic,
      tiers.get(topic.technology) ?? DEFAULT_TIER,
      mark.learnedAt,
    )
  }
}

/* -------------------------------------------------------------------------- */
/* Rebuilding what is derived from it                                         */
/* -------------------------------------------------------------------------- */

/**
 * Questions this device has answers for and no ladder row, which is what an
 * ingest leaves behind when the archive was too old to hold the question.
 *
 * The server never has this problem: its content and its attempts move
 * together. Here the curriculum is a download that can lag days behind, and
 * without this the answers would sit in the table forever with nothing ever
 * putting the question back into rotation.
 */
async function unscheduled(db: Database): Promise<string[]> {
  const rows = await db.all<{ question_id: string }>(
    `select distinct question_id from attempts
     where question_id not in (select question_id from review_schedule)`,
  )
  return rows.map((row) => row.question_id)
}

/**
 * Replays each affected question's whole history through the interval ladder.
 *
 * Rebuilding rather than stepping is what makes an attempt from three days ago
 * land where it would have landed had it arrived on the day. A question this
 * device holds no copy of has no form to replay against, so its row is left as
 * it stands.
 */
async function rebuildSchedules(
  db: Database,
  content: ArchiveContent,
  questionKeys: string[],
): Promise<void> {
  const keys = [...new Set(questionKeys)]
  if (keys.length === 0) return

  const forms = questionForms(content)
  const placeholders = keys.map(() => '?').join(', ')
  const history = await db.all<{
    question_id: string
    topic_slug: string
    result: Result
    attempted_at: string
  }>(
    `select question_id, topic_slug, result, attempted_at from attempts
     where question_id in (${placeholders})`,
    keys,
  )

  for (const key of keys) {
    const form = forms.get(key)
    if (!form) continue

    const forQuestion = history.filter((row) => row.question_id === key)
    const topicSlug = forQuestion[0]?.topic_slug
    const replayed = replaySchedule(
      form,
      forQuestion.map((row) => ({ result: row.result, attemptedAt: new Date(row.attempted_at) })),
    )
    if (!replayed || !topicSlug) continue

    await db.run(
      `insert into review_schedule (question_id, topic_slug, due_at, interval_step, last_result, updated_at)
       values (?, ?, ?, ?, ?, ?)
       on conflict (question_id) do update set
         due_at = excluded.due_at,
         interval_step = excluded.interval_step,
         last_result = excluded.last_result,
         updated_at = excluded.updated_at`,
      [
        key,
        topicSlug,
        replayed.dueAt.toISOString(),
        replayed.step,
        replayed.lastResult,
        replayed.updatedAt.toISOString(),
      ],
    )
  }
}

function questionForms(content: ArchiveContent): Map<string, AnswerForm> {
  const forms = new Map<string, AnswerForm>()

  for (const topic of content.topics) {
    for (const question of topic.questions) {
      forms.set(`${topic.slug}#${question.id}`, question.form)
    }
  }

  return forms
}

/** Derived from the attempts rather than taken from the server, for one definition of it. */
async function rebuildLastReviewed(db: Database, topicSlugs: string[]): Promise<void> {
  for (const topicSlug of topicSlugs) {
    const rows = await db.all<{ attempted_at: string }>(
      'select attempted_at from attempts where topic_slug = ? order by attempted_at desc limit 1',
      [topicSlug],
    )

    const lastReviewedAt = rows[0]?.attempted_at
    if (!lastReviewedAt) continue

    await db.run(
      `insert into topic_progress (topic_slug, last_reviewed_at) values (?, ?)
       on conflict (topic_slug) do update set last_reviewed_at = excluded.last_reviewed_at`,
      [topicSlug, lastReviewedAt],
    )
  }
}

/**
 * Counts each affected day's attempts back into the activity table, which is
 * what the streak is derived from. A week answered on the laptop has to count as
 * the week it happened on rather than as the day it arrived here.
 *
 * Only today's queue can be said to have been cleared, because clearing is a
 * statement about the schedule as it stands. A past day's stored answer is left
 * alone, and a past day being reconstructed gets false, which changes nothing: a
 * day with attempts on it already counts toward the streak.
 */
async function rebuildActivity(db: Database, days: Set<string>, now: Date): Promise<void> {
  if (days.size === 0) return

  const sorted = [...days].sort()
  const first = sorted[0] as string
  const last = sorted.at(-1) as string
  // A calendar day in APP_TIMEZONE can begin and end up to a day either side of
  // the UTC day of the same name, so the window is widened before filtering.
  const from = `${addDays(first, -1)}T00:00:00.000Z`
  const to = `${addDays(last, 2)}T00:00:00.000Z`

  const rows = await db.all<{ attempted_at: string }>(
    'select attempted_at from attempts where attempted_at >= ? and attempted_at < ?',
    [from, to],
  )

  const counts = new Map<string, number>()
  for (const row of rows) {
    const day = toDayString(new Date(row.attempted_at))
    if (days.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  const today = toDayString(now)
  const cleared = days.has(today) ? countDueToday(await readSchedule(db), now) === 0 : false

  for (const [day, reviewed] of counts) {
    if (day === today) {
      await db.run(
        `insert into daily_activity (day, reviewed, queue_cleared) values (?, ?, ?)
         on conflict (day) do update set
           reviewed = excluded.reviewed, queue_cleared = excluded.queue_cleared`,
        [day, reviewed, cleared ? 1 : 0],
      )
      continue
    }

    // A past day's clearing cannot be recomputed, so it stays as recorded.
    await db.run(
      `insert into daily_activity (day, reviewed, queue_cleared) values (?, ?, 0)
       on conflict (day) do update set reviewed = excluded.reviewed`,
      [day, reviewed],
    )
  }
}
