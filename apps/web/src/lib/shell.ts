import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { reviewSchedule } from '@/db/schema'
import { getStreaks } from './activity'
import { countDueToday, type ScheduledQuestion } from '@prep/core'

export type ShellSummary = {
  dueToday: number
  streak: { current: number; longest: number }
}

/**
 * What the top bar needs on every page: how much is waiting, and whether today
 * still counts. Deliberately cheaper than the full dashboard.
 */
export async function getShellSummary(userId: string, now = new Date()): Promise<ShellSummary> {
  const [schedule, streak] = await Promise.all([
    db
      .select({
        questionId: reviewSchedule.questionId,
        topicSlug: reviewSchedule.topicSlug,
        dueAt: reviewSchedule.dueAt,
        intervalStep: reviewSchedule.intervalStep,
        lastResult: reviewSchedule.lastResult,
      })
      .from(reviewSchedule)
      .where(eq(reviewSchedule.userId, userId)),
    getStreaks(userId, now),
  ])

  return { dueToday: countDueToday(schedule as ScheduledQuestion[], now), streak }
}
