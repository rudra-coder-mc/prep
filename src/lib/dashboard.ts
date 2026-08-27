import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, exerciseProgress, topicProgress } from '@/db/schema'
import { getAllTopics, type Topic } from '@/content/loader'
import { questionKey } from '@/content/schema'
import { getStreaks } from './activity'
import { DEFAULT_TIER, questionsUpTo } from './tiers'
import { getTrackTiers } from './track-tier'
import { summariseTracks, type TrackSummary } from './tracks'
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
  /** How many of the topic's questions the track's tier covers. */
  questions: number
}

export type Dashboard = {
  topics: TopicOverview[]
  tracks: TrackSummary[]
  byStatus: Record<TopicStatus, number>
  questions: { attempted: number; passed: number; weak: number; failed: number }
  exercises: { completed: number; remaining: number }
  weakest: TopicOverview[]
  streak: { current: number; longest: number }
}

const WEAK_STATUSES: TopicStatus[] = ['weak', 'learning']

export async function getDashboard(userId: string): Promise<Dashboard> {
  const [topics, tiers, attemptRows, progressRows, exerciseRows, streak] = await Promise.all([
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

  // A topic is on the path when the tier covers at least one of its questions,
  // and only those questions count toward it. A staff question answered last
  // month says nothing about how ready somebody is for the SWE-1 screen.
  const overviews: TopicOverview[] = topics.flatMap((topic: Topic) => {
    const inScope = questionsUpTo(topic.questions, tiers.get(topic.technology) ?? DEFAULT_TIER)
    if (inScope.length === 0) return []

    const keys = new Set(inScope.map((question) => questionKey(topic.slug, question.id)))
    const attempts = (attemptsByTopic.get(topic.slug) ?? []).filter((attempt) =>
      keys.has(attempt.questionId),
    )

    return [
      {
        slug: topic.slug,
        technology: topic.technology,
        directory: topic.directory,
        title: topic.title,
        questions: inScope.length,
        ...summariseTopic(inScope.length, attempts, learnedAt.get(topic.slug) ?? null),
      },
    ]
  })

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
    tracks: summariseTracks(overviews),
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
      .sort((a, b) => a.progress - b.progress || b.attempts - a.attempts)
      .slice(0, 5),
    streak,
  }
}
