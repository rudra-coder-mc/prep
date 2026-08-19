import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { dailyActivity, reviewSchedule } from '@/db/schema'
import { countDueToday, type ScheduledQuestion } from './daily-queue'
import { currentStreak, longestStreak, toDayString, type ActivityDay } from './day'

export async function getActivity(userId: string): Promise<ActivityDay[]> {
  return db
    .select({
      day: dailyActivity.day,
      reviewed: dailyActivity.reviewed,
      queueCleared: dailyActivity.queueCleared,
    })
    .from(dailyActivity)
    .where(eq(dailyActivity.userId, userId))
}

export async function getStreaks(userId: string, now = new Date()) {
  const activity = await getActivity(userId)
  return {
    current: currentStreak(activity, toDayString(now)),
    longest: longestStreak(activity),
  }
}

/**
 * Records one review against today. Called after every attempt, so the streak is
 * derived from what actually happened rather than from a counter that can drift.
 */
export async function recordReview(userId: string, now = new Date()) {
  const day = toDayString(now)

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

  const cleared = countDueToday(remaining as ScheduledQuestion[], now) === 0

  await db
    .insert(dailyActivity)
    .values({ userId, day, reviewed: 1, queueCleared: cleared })
    .onConflictDoUpdate({
      target: [dailyActivity.userId, dailyActivity.day],
      set: {
        reviewed: sql`${dailyActivity.reviewed} + 1`,
        queueCleared: cleared,
      },
    })

  return { day, cleared }
}

export async function getToday(userId: string, now = new Date()): Promise<ActivityDay | null> {
  const day = toDayString(now)
  const [row] = await db
    .select({
      day: dailyActivity.day,
      reviewed: dailyActivity.reviewed,
      queueCleared: dailyActivity.queueCleared,
    })
    .from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.day, day)))
    .limit(1)
  return row ?? null
}
