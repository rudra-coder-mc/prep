import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { reviewSchedule } from '@/db/schema'
import { getQuestionsByKeys } from '@/content/loader'
import type { SessionQuestion } from '@/components/question-session'
import {
  buildDailyQueue,
  countDueToday,
  DAILY_QUEUE_CAP,
  type QueuedQuestion,
  type ScheduledQuestion,
} from './daily-queue'

async function loadSchedule(userId: string): Promise<ScheduledQuestion[]> {
  const rows = await db
    .select({
      questionId: reviewSchedule.questionId,
      topicSlug: reviewSchedule.topicSlug,
      dueAt: reviewSchedule.dueAt,
      intervalStep: reviewSchedule.intervalStep,
      lastResult: reviewSchedule.lastResult,
    })
    .from(reviewSchedule)
    .where(eq(reviewSchedule.userId, userId))

  return rows
}

export type DailyQueue = {
  questions: SessionQuestion[]
  reasons: Record<string, QueuedQuestion['reason']>
  dueToday: number
  cap: number
}

export async function getDailyQueue(userId: string, now = new Date()): Promise<DailyQueue> {
  const schedule = await loadSchedule(userId)
  const queued = buildDailyQueue(schedule, now)

  const resolved = await getQuestionsByKeys(queued.map((entry) => entry.questionId))

  const reasons: Record<string, QueuedQuestion['reason']> = {}
  for (const entry of queued) reasons[entry.questionId] = entry.reason

  const questions: SessionQuestion[] = resolved.map(({ topic, question }) => ({
    id: question.id,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    type: question.type,
    difficulty: question.difficulty,
    prompt: question.prompt,
    code: question.code,
    hints: question.hints,
    options: question.options,
  }))

  return { questions, reasons, dueToday: countDueToday(schedule, now), cap: DAILY_QUEUE_CAP }
}
