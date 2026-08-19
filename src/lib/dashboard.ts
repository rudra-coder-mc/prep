import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, exerciseProgress, topicProgress } from '@/db/schema'
import { getAllTopics, type Topic } from '@/content/loader'
import { getStreaks } from './activity'
import {
  summariseTopic,
  type AttemptRecord,
  type TopicStatus,
  type TopicSummary,
} from './topic-status'

export type TopicOverview = TopicSummary & {
  slug: string
  technology: string
  directory: string
  title: string
}

export type Dashboard = {
  topics: TopicOverview[]
  byStatus: Record<TopicStatus, number>
  questions: { attempted: number; passed: number; weak: number; failed: number }
  exercises: { completed: number; remaining: number }
  weakest: TopicOverview[]
  streak: { current: number; longest: number }
}

const WEAK_STATUSES: TopicStatus[] = ['weak', 'learning']

export async function getDashboard(userId: string): Promise<Dashboard> {
  const [topics, attemptRows, progressRows, exerciseRows, streak] = await Promise.all([
    getAllTopics(),
    db
      .select({
        questionId: attempts.questionId,
        topicSlug: attempts.topicSlug,
        result: attempts.result,
        confidence: attempts.confidence,
        attemptedAt: attempts.attemptedAt,
      })
      .from(attempts)
      .where(eq(attempts.userId, userId)),
    db.select().from(topicProgress).where(eq(topicProgress.userId, userId)),
    db.select().from(exerciseProgress).where(eq(exerciseProgress.userId, userId)),
    getStreaks(userId),
  ])

  const attemptsByTopic = new Map<string, AttemptRecord[]>()
  for (const row of attemptRows) {
    const list = attemptsByTopic.get(row.topicSlug) ?? []
    list.push(row)
    attemptsByTopic.set(row.topicSlug, list)
  }

  const learnedAt = new Map(progressRows.map((row) => [row.topicSlug, row.learnedAt]))

  const overviews: TopicOverview[] = topics.map((topic: Topic) => ({
    slug: topic.slug,
    technology: topic.technology,
    directory: topic.directory,
    title: topic.title,
    ...summariseTopic(
      topic.questions.length,
      attemptsByTopic.get(topic.slug) ?? [],
      learnedAt.get(topic.slug) ?? null,
    ),
  }))

  const byStatus = {
    not_started: 0,
    learning: 0,
    weak: 0,
    understood: 0,
    mastered: 0,
  } satisfies Record<TopicStatus, number>

  for (const overview of overviews) byStatus[overview.status] += 1

  const completedExercises = exerciseRows.filter((row) => row.status === 'completed').length
  const totalExercises = topics.reduce((total, topic) => total + topic.exercises.length, 0)

  return {
    topics: overviews,
    byStatus,
    questions: {
      attempted: attemptRows.length,
      passed: attemptRows.filter((row) => row.result === 'passed').length,
      weak: attemptRows.filter((row) => row.result === 'weak').length,
      failed: attemptRows.filter((row) => row.result === 'failed').length,
    },
    exercises: {
      completed: completedExercises,
      remaining: Math.max(totalExercises - completedExercises, 0),
    },
    weakest: overviews
      .filter((overview) => WEAK_STATUSES.includes(overview.status))
      .sort((a, b) => (a.lastConfidence ?? 0) - (b.lastConfidence ?? 0) || a.progress - b.progress)
      .slice(0, 5),
    streak,
  }
}
