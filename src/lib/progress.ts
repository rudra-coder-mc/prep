import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { reviewSchedule, topicProgress } from '@/db/schema'
import { getTopic } from '@/content/loader'
import { questionKey } from '@/content/schema'

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
 * Marking a topic learned is what enrols its questions into recall. Every
 * question starts at the bottom of the ladder and is due immediately, so the
 * first review happens while the lesson is still fresh.
 */
export async function markTopicLearned(userId: string, technology: string, directory: string) {
  const topic = await getTopic(technology, directory)
  if (!topic) throw new Error(`No such topic: ${technology}/${directory}`)

  const now = new Date()

  await db
    .insert(topicProgress)
    .values({ userId, topicSlug: topic.slug, learnedAt: now })
    .onConflictDoUpdate({
      target: [topicProgress.userId, topicProgress.topicSlug],
      set: { learnedAt: now },
    })

  if (topic.questions.length === 0) return

  await db
    .insert(reviewSchedule)
    .values(
      topic.questions.map((question) => ({
        userId,
        questionId: questionKey(topic.slug, question.id),
        topicSlug: topic.slug,
        dueAt: now,
        intervalStep: 0,
      })),
    )
    // Re-reading a topic should not reset progress on questions already in
    // rotation, so existing schedule rows are left exactly as they are.
    .onConflictDoNothing({
      target: [reviewSchedule.userId, reviewSchedule.questionId],
    })
}
