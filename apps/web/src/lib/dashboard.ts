import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, exerciseProgress, reviewSchedule, topicProgress } from '@/db/schema'
import { getAllTopics } from '@prep/content'
import { summariseDashboard, type Dashboard, type TopicOverview } from '@prep/core'
import { getActivity } from './activity'
import { getTrackTiers } from './track-tier'

export type { Dashboard, TopicOverview }

/**
 * The dashboard, from this machine's rows.
 *
 * Which rows, and nothing about what they mean. Every number on the page is
 * `summariseDashboard` in @prep/core over the shapes below, which is what the
 * phone runs over the same rows in SQLite, so the two surfaces show the same
 * dashboard once a sync has run.
 */
export async function getDashboard(userId: string, now = new Date()): Promise<Dashboard> {
  const [topics, tiers, attemptRows, scheduleRows, progressRows, exerciseRows, activity] =
    await Promise.all([
      getAllTopics(),
      getTrackTiers(userId),
      db
        .select({
          questionId: attempts.questionId,
          topicSlug: attempts.topicSlug,
          result: attempts.result,
          attemptedAt: attempts.attemptedAt,
        })
        .from(attempts)
        .where(eq(attempts.userId, userId)),
      db
        .select({
          questionId: reviewSchedule.questionId,
          intervalStep: reviewSchedule.intervalStep,
        })
        .from(reviewSchedule)
        .where(eq(reviewSchedule.userId, userId)),
      db.select().from(topicProgress).where(eq(topicProgress.userId, userId)),
      db.select().from(exerciseProgress).where(eq(exerciseProgress.userId, userId)),
      getActivity(userId),
    ])

  return summariseDashboard(
    {
      topics,
      tiers,
      attempts: attemptRows,
      learnedAt: new Map(
        progressRows.flatMap((row) => (row.learnedAt ? [[row.topicSlug, row.learnedAt]] : [])),
      ),
      ladderSteps: new Map(scheduleRows.map((row) => [row.questionId, row.intervalStep])),
      exercises: exerciseRows,
      activity,
    },
    now,
  )
}
