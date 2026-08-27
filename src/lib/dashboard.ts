import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, exerciseProgress, reviewSchedule, topicProgress } from '@/db/schema'
import { getAllTopics, type Topic } from '@/content/loader'
import { questionKey } from '@/content/schema'
import { getStreaks } from './activity'
import { nextTier, summariseReadiness, type Readiness } from './readiness'
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
  const [topics, tiers, attemptRows, scheduleRows, progressRows, exerciseRows, streak] =
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
      getStreaks(userId),
    ])

  const attemptsByTopic = new Map<string, AttemptRecord[]>()
  for (const row of attemptRows) {
    const list = attemptsByTopic.get(row.topicSlug) ?? []
    list.push(row)
    attemptsByTopic.set(row.topicSlug, list)
  }

  const learnedAt = new Map(progressRows.map((row) => [row.topicSlug, row.learnedAt]))
  const ladderSteps = new Map(scheduleRows.map((row) => [row.questionId, row.intervalStep]))

  /**
   * What each track's tier covers, and what the tier above it would.
   *
   * Readiness is a claim about the tier, so its denominator is every question
   * the tier covers on that track, including the ones in topics nobody has
   * opened. Enrolling less of a tier does not make somebody more ready for it.
   *
   * `wouldEnrol` is what accepting the step up puts on the ladder today, which
   * is the newly covered questions of topics already marked learned. Stepping up
   * reaches no others: a topic nobody has learned enrols nothing at any tier.
   */
  const scope = new Map<string, { covered: string[]; wouldEnrol: number }>()

  function record(technology: string, ids: string[], wouldEnrol: number) {
    const track = scope.get(technology) ?? { covered: [], wouldEnrol: 0 }
    track.covered.push(...ids)
    track.wouldEnrol += wouldEnrol
    scope.set(technology, track)
  }

  // A topic is on the path when the tier covers at least one of its questions,
  // and only those questions count toward it. A staff question answered last
  // month says nothing about how ready somebody is for the SWE-1 screen.
  const overviews: TopicOverview[] = topics.flatMap((topic: Topic) => {
    const tier = tiers.get(topic.technology) ?? DEFAULT_TIER
    const above = nextTier(tier)

    const inScope = questionsUpTo(topic.questions, tier)
    const ids = inScope.map((question) => questionKey(topic.slug, question.id))
    const keys = new Set(ids)

    const arriving =
      above && learnedAt.get(topic.slug)
        ? questionsUpTo(topic.questions, above)
            .map((question) => questionKey(topic.slug, question.id))
            .filter((id) => !keys.has(id) && !ladderSteps.has(id)).length
        : 0

    record(topic.technology, ids, arriving)

    if (inScope.length === 0) return []
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

  const readinessByTrack = new Map<string, Readiness>(
    [...scope]
      .filter(([, track]) => track.covered.length > 0)
      .map(([technology, track]) => [
        technology,
        summariseReadiness(
          tiers.get(technology) ?? DEFAULT_TIER,
          track.covered,
          ladderSteps,
          track.wouldEnrol,
        ),
      ]),
  )

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
    tracks: summariseTracks(overviews, readinessByTrack),
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
