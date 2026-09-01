import { currentStreak, longestStreak, toDayString, type ActivityDay } from './day'
import { nextTier, summariseReadiness, type Readiness } from './readiness'
import { questionKey, type ExerciseStatus, type Tier } from './schema'
import { DEFAULT_TIER, questionsUpTo } from './tiers'
import {
  summariseTopic,
  type AttemptRecord,
  type TopicStatus,
  type TopicSummary,
} from './topic-status'
import { summariseTracks, type TrackSummary } from './tracks'

/**
 * The whole dashboard, worked out from rows rather than fetched.
 *
 * Both surfaces show it and neither is told it. The laptop reads the rows out
 * of Postgres and the phone reads the same rows out of SQLite, and everything
 * either one displays is this fold over them, so the two cannot disagree about
 * how ready somebody is while agreeing about what they answered. See
 * docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
 *
 * Nothing here reads a clock except through `now`, and nothing here touches a
 * store. What each caller has to supply is the rows, in the shapes below.
 */

/** As much of a question as the dashboard needs: which tier it is asked at. */
export type DashboardQuestion = { id: string; tier: Tier }

export type DashboardTopic = {
  slug: string
  technology: string
  directory: string
  title: string
  questions: readonly DashboardQuestion[]
  /** Counted and nothing else, so a topic's exercises need carry no detail here. */
  exercises: readonly unknown[]
}

/** An attempt, with the topic it belongs to, which is how the rows are grouped. */
export type DashboardAttempt = AttemptRecord & { topicSlug: string }

export type DashboardInput = {
  topics: readonly DashboardTopic[]
  /** The tier picked per track. A track with no entry is on the default. */
  tiers: Map<string, Tier>
  attempts: readonly DashboardAttempt[]
  /** When each topic was marked learned. A topic never marked is absent. */
  learnedAt: Map<string, Date>
  /** Where each question sits on the interval ladder, by question key. */
  ladderSteps: Map<string, number>
  exercises: readonly { status: ExerciseStatus }[]
  activity: readonly ActivityDay[]
}

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

/** How many of the weakest topics are worth naming. Beyond that it is a backlog. */
export const WEAKEST_SHOWN = 5

const WEAK_STATUSES: TopicStatus[] = ['weak', 'learning']

export function summariseDashboard(input: DashboardInput, now = new Date()): Dashboard {
  const { topics, tiers, attempts, learnedAt, ladderSteps, exercises, activity } = input

  const attemptsByTopic = new Map<string, DashboardAttempt[]>()
  for (const attempt of attempts) {
    const list = attemptsByTopic.get(attempt.topicSlug) ?? []
    list.push(attempt)
    attemptsByTopic.set(attempt.topicSlug, list)
  }

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
  const overviews: TopicOverview[] = topics.flatMap((topic) => {
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
    const answered = (attemptsByTopic.get(topic.slug) ?? []).filter((attempt) =>
      keys.has(attempt.questionId),
    )

    return [
      {
        slug: topic.slug,
        technology: topic.technology,
        directory: topic.directory,
        title: topic.title,
        questions: inScope.length,
        ...summariseTopic(inScope.length, answered, learnedAt.get(topic.slug) ?? null),
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

  const completedExercises = exercises.filter((row) => row.status === 'completed').length
  const totalExercises = topics.reduce((total, topic) => total + topic.exercises.length, 0)

  return {
    topics: overviews,
    tracks: summariseTracks(overviews, readinessByTrack),
    byStatus,
    questions: {
      attempted: attempts.length,
      passed: attempts.filter((attempt) => attempt.result === 'passed').length,
      weak: attempts.filter((attempt) => attempt.result === 'weak').length,
      failed: attempts.filter((attempt) => attempt.result === 'failed').length,
    },
    exercises: {
      completed: completedExercises,
      remaining: Math.max(totalExercises - completedExercises, 0),
    },
    weakest: overviews
      .filter((overview) => WEAK_STATUSES.includes(overview.status))
      .sort((a, b) => a.progress - b.progress || b.attempts - a.attempts)
      .slice(0, WEAKEST_SHOWN),
    streak: {
      current: currentStreak([...activity], toDayString(now)),
      longest: longestStreak([...activity]),
    },
  }
}
