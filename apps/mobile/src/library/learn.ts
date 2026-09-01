import type { ArchiveContent, ArchiveTopic } from '@prep/content/archive/types'
import { questionKey, questionsUpTo, type Tier } from '@prep/core'
import { readLearnedTopics } from '../db/progress'
import { enrol } from '../db/schedule'
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
}

/**
 * Brings everything already learned on one track up to a tier, which is what a
 * changed pick means: without it the pick would only apply to topics learned
 * after it. This mirrors `enrolLearnedTopics` in apps/web/src/lib/progress.ts.
 *
 * Stepping down enrols nothing and removes nothing. A question already on the
 * ladder is something you have started remembering.
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

function enrolments(topic: ArchiveTopic, tier: Tier) {
  return questionsUpTo(topic.questions, tier).map((question) => ({
    questionId: questionKey(topic.slug, question.id),
    topicSlug: topic.slug,
  }))
}
