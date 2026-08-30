import 'server-only'
import { and, eq, isNotNull } from 'drizzle-orm'
import { db } from '@/db'
import { reviewSchedule, topicProgress } from '@/db/schema'
import { getTopic, type Topic } from '@prep/content'
import { questionKey, type Tier, questionsUpTo } from '@prep/core'
import { getTrackTier, setTrackTier } from './track-tier'

export type TopicProgressRow = typeof topicProgress.$inferSelect

export async function getTopicProgress(
  userId: string,
  topicSlug: string,
): Promise<TopicProgressRow | null> {
  const [row] = await db
    .select()
    .from(topicProgress)
    .where(and(eq(topicProgress.userId, userId), eq(topicProgress.topicSlug, topicSlug)))
    .limit(1)
  return row ?? null
}

/**
 * Puts a topic's in-scope questions on the bottom rung, due immediately, so the
 * first review happens while the lesson is still fresh.
 *
 * Every question already scheduled is left exactly as it is. That is what makes
 * re-reading a topic free, and it is also what makes stepping up a tier safe:
 * the newly in-scope questions arrive at the bottom and nothing in rotation
 * moves.
 */
async function enrol(userId: string, topics: Topic[], tier: Tier, now: Date) {
  const rows = topics.flatMap((topic) =>
    questionsUpTo(topic.questions, tier).map((question) => ({
      userId,
      questionId: questionKey(topic.slug, question.id),
      topicSlug: topic.slug,
      dueAt: now,
      intervalStep: 0,
    })),
  )

  if (rows.length === 0) return

  await db
    .insert(reviewSchedule)
    .values(rows)
    .onConflictDoNothing({
      target: [reviewSchedule.userId, reviewSchedule.questionId],
    })
}

/**
 * Marking a topic learned is what enrols its questions into recall. Only the
 * questions at or below the track's tier are enrolled: being asked a staff
 * question while preparing for the SWE-1 screen teaches nothing and costs
 * confidence. See docs/decisions/0028-tiers-are-interview-levels.md.
 */
export async function markTopicLearned(userId: string, technology: string, directory: string) {
  const topic = await getTopic(technology, directory)
  if (!topic) throw new Error(`No such topic: ${technology}/${directory}`)

  const now = new Date()
  const tier = await getTrackTier(userId, technology)

  await db
    .insert(topicProgress)
    .values({ userId, topicSlug: topic.slug, learnedAt: now })
    .onConflictDoUpdate({
      target: [topicProgress.userId, topicProgress.topicSlug],
      set: { learnedAt: now },
    })

  await enrol(userId, [topic], tier, now)
}

/**
 * Picks the tier for a track, and brings what is already learned up to it.
 *
 * Without that second half the pick would only apply to topics learned after
 * it, so stepping up would mean re-marking every topic by hand. Stepping down
 * enrols nothing and removes nothing: a question already on the ladder is
 * something you have started remembering, and dropping it would throw that
 * away over a change of plan.
 */
export async function pickTrackTier(userId: string, technology: string, tier: Tier) {
  await setTrackTier(userId, technology, tier)

  const learned = await db
    .select({ topicSlug: topicProgress.topicSlug })
    .from(topicProgress)
    .where(and(eq(topicProgress.userId, userId), isNotNull(topicProgress.learnedAt)))

  const directories = learned
    .map((row) => row.topicSlug.split('/'))
    .filter(([track]) => track === technology)
    .map(([, directory]) => directory)
    .filter((directory) => directory !== undefined)

  const topics = await Promise.all(directories.map((directory) => getTopic(technology, directory)))

  await enrol(
    userId,
    topics.filter((topic) => topic !== null),
    tier,
    new Date(),
  )
}
