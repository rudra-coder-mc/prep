import type { ArchiveContent, ArchiveTopic } from '@prep/content/archive/types'
import { DEFAULT_TIER, questionKey, questionsUpTo, tiersUpTo, type Tier } from '@prep/core'
import { readLearnedTopics, readTrackTiers } from '../db/progress'
import { enrol, readSchedule } from '../db/schedule'
import type { Database } from '../db/sqlite'

/**
 * Marking a topic learned, which is what enrols its questions into recall.
 *
 * Only the questions at or below the track's tier are enrolled, which is the
 * server's rule in apps/web/src/lib/progress.ts. Doing it twice is free: the
 * mark moves to now, and every question already climbing stays where it is.
 */
export async function markTopicLearned(
  db: Database,
  content: ArchiveContent,
  topicSlug: string,
  tier: Tier,
  now: Date,
): Promise<void> {
  const topic = content.topics.find((candidate) => candidate.slug === topicSlug)
  if (!topic) throw new Error(`This device holds no copy of ${topicSlug}`)

  const at = now.toISOString()

  // Reading a topic says nothing about when it was last reviewed, so the
  // column the queue writes is left alone.
  await db.run(
    `insert into topic_progress (topic_slug, learned_at) values (?, ?)
     on conflict (topic_slug) do update set learned_at = excluded.learned_at`,
    [topicSlug, at],
  )

  await enrolTopicQuestions(db, topic, tier, now)
}

/**
 * The enrolment on its own, for the marks that arrive from another device. A
 * sync has already written the mark by the time it gets here, and it enrols each
 * topic as of when it was learned rather than now, so a topic read offline on
 * Monday has its questions due from Monday.
 */
export async function enrolTopicQuestions(
  db: Database,
  topic: ArchiveTopic,
  tier: Tier,
  now: Date,
): Promise<void> {
  await enrol(db, enrolments(topic, tier), now)
}

/**
 * Picks the tier for a track, and brings what is already learned up to it.
 *
 * Without that second half the pick would only apply to topics learned after it,
 * so stepping up would mean re-reading every topic by hand. The pick is stamped
 * with `now` because that timestamp is what a sync merges it by: the later pick
 * wins, whichever surface made it. This mirrors `pickTrackTier` in
 * apps/web/src/lib/progress.ts.
 *
 * It reconciles enrolled questions so any questions above the newly selected tier
 * do not accumulate due dates in SQLite.
 */
export async function pickTrackTier(
  db: Database,
  content: ArchiveContent,
  technology: string,
  tier: Tier,
  now: Date,
): Promise<void> {
  await db.run(
    `insert into track_tier (technology, tier, updated_at) values (?, ?, ?)
     on conflict (technology) do update set tier = excluded.tier, updated_at = excluded.updated_at`,
    [technology, tier, now.toISOString()],
  )

  await enrolLearnedTopics(db, content, technology, tier, now)
  await reconcileTrackEnrolments(db, content, technology, tier)
}

/**
 * Brings everything already learned on one track up to a tier, which is what a
 * changed pick means: without it the pick would only apply to topics learned
 * after it. This mirrors `enrolLearnedTopics` in apps/web/src/lib/progress.ts.
 */
export async function enrolLearnedTopics(
  db: Database,
  content: ArchiveContent,
  technology: string,
  tier: Tier,
  now: Date,
): Promise<void> {
  const learned = await readLearnedTopics(db)
  const topics = content.topics.filter(
    (topic) => topic.technology === technology && learned.has(topic.slug),
  )

  await enrol(
    db,
    topics.flatMap((topic) => enrolments(topic, tier)),
    now,
  )
}

/**
 * Enrols questions for all topics that have already been marked learned, up to
 * each track's chosen tier.
 *
 * This is called after a refresh installs a new archive, so that any topic
 * marked learned on another device while this device held an older archive
 * has its questions enrolled into recall as soon as the archive catches up.
 * See task 42 in TASKS.md.
 */
export async function enrolAllLearned(db: Database, content: ArchiveContent): Promise<void> {
  const learned = await readLearnedTopics(db)
  if (learned.size === 0) return

  const tiers = await readTrackTiers(db)
  for (const topic of content.topics) {
    const learnedAt = learned.get(topic.slug)
    if (!learnedAt) continue

    const tier = tiers.get(topic.technology) ?? DEFAULT_TIER
    await enrolTopicQuestions(db, topic, tier, learnedAt)
  }
  await reconcileEnrolments(db, content, tiers)
}

/**
 * Removes scheduled questions from `review_schedule` for a specific track that exceed
 * the active tier for that track.
 */
export async function reconcileTrackEnrolments(
  db: Database,
  content: ArchiveContent,
  technology: string,
  tier: Tier,
): Promise<number> {
  const schedule = await readSchedule(db)
  if (schedule.length === 0) return 0

  const questions = new Map<string, { technology: string; tier: Tier }>()
  for (const topic of content.topics) {
    if (topic.technology !== technology) continue
    for (const q of topic.questions) {
      questions.set(questionKey(topic.slug, q.id), {
        technology: topic.technology,
        tier: q.tier,
      })
    }
  }

  const allowedTiers = new Set(tiersUpTo(tier))
  const outOfScopeIds: string[] = []

  for (const row of schedule) {
    const q = questions.get(row.questionId)
    if (!q) continue
    if (!allowedTiers.has(q.tier)) {
      outOfScopeIds.push(row.questionId)
    }
  }

  if (outOfScopeIds.length === 0) return 0

  await db.transaction(async () => {
    for (const id of outOfScopeIds) {
      await db.run('delete from review_schedule where question_id = ?', [id])
    }
  })

  return outOfScopeIds.length
}

/**
 * Removes scheduled questions from `review_schedule` that exceed the active tier
 * across all tracks.
 *
 * This reconciles the database so that when a user selects or steps down their
 * target tier, questions from higher tiers do not linger or accumulate due dates.
 */
export async function reconcileEnrolments(
  db: Database,
  content: ArchiveContent,
  tiers: Map<string, Tier>,
  defaultTier: Tier = DEFAULT_TIER,
): Promise<number> {
  let count = 0
  for (const tech of content.technologies) {
    const activeTier = tiers.get(tech.id) ?? defaultTier
    count += await reconcileTrackEnrolments(db, content, tech.id, activeTier)
  }
  return count
}

function enrolments(topic: ArchiveTopic, tier: Tier) {
  return questionsUpTo(topic.questions, tier).map((question) => ({
    questionId: questionKey(topic.slug, question.id),
    topicSlug: topic.slug,
  }))
}
