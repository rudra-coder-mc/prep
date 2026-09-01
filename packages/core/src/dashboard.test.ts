import { describe, expect, it } from 'vitest'
import { summariseDashboard, type DashboardInput, type DashboardTopic } from './dashboard'
import { questionKey, type Tier } from './schema'

/**
 * The fold both surfaces run.
 *
 * Every decision the dashboard makes is here rather than in either app, so this
 * is the file that would notice one of them starting to answer differently.
 * What is worth testing is the parts that are neither a count nor a delegation:
 * which questions a tier's denominator covers, what a step up would enrol, and
 * which topics are called the weakest.
 */

const NOW = new Date('2026-08-26T09:00:00.000Z')

function topic(
  slug: string,
  questions: { id: string; tier: Tier }[],
  exercises = 0,
): DashboardTopic {
  const [technology = 'javascript', directory = slug] = slug.split('/')

  return {
    slug,
    technology,
    directory,
    title: directory,
    questions,
    exercises: Array.from({ length: exercises }, (_, index) => ({ id: `e${index}` })),
  }
}

function input(overrides: Partial<DashboardInput> = {}): DashboardInput {
  return {
    topics: [],
    tiers: new Map(),
    attempts: [],
    learnedAt: new Map(),
    ladderSteps: new Map(),
    exercises: [],
    activity: [],
    ...overrides,
  }
}

const CLOSURES = topic('javascript/closures', [
  { id: 'scope', tier: 'swe-1' },
  { id: 'capture', tier: 'swe-2' },
])

describe('what a tier covers', () => {
  it('counts only the questions at or below the pick', () => {
    const dashboard = summariseDashboard(input({ topics: [CLOSURES] }), NOW)

    expect(dashboard.topics[0]?.questions).toBe(1)
    expect(dashboard.tracks[0]?.readiness.total).toBe(1)
  })

  it('leaves a topic asked only above the pick off the path entirely', () => {
    const dashboard = summariseDashboard(
      input({ topics: [CLOSURES, topic('javascript/realms', [{ id: 'shape', tier: 'staff' }])] }),
      NOW,
    )

    expect(dashboard.topics.map((row) => row.slug)).toEqual(['javascript/closures'])
  })

  /**
   * Readiness is a claim about the tier, so the denominator is every question it
   * covers rather than the ones enrolled so far. Learning one topic perfectly
   * does not make somebody ready for the interview.
   */
  it('counts questions nobody has opened into the denominator', () => {
    const dashboard = summariseDashboard(
      input({
        topics: [CLOSURES, topic('javascript/promises', [{ id: 'order', tier: 'swe-1' }])],
        learnedAt: new Map([['javascript/closures', NOW]]),
        ladderSteps: new Map([[questionKey('javascript/closures', 'scope'), 3]]),
      }),
      NOW,
    )

    expect(dashboard.tracks[0]?.readiness).toMatchObject({ retained: 1, total: 2, percent: 50 })
  })
})

describe('the offer a finished tier makes', () => {
  const finished = input({
    topics: [CLOSURES],
    learnedAt: new Map([['javascript/closures', NOW]]),
    ladderSteps: new Map([[questionKey('javascript/closures', 'scope'), 3]]),
  })

  it('says what stepping up would enrol today', () => {
    const dashboard = summariseDashboard(finished, NOW)

    expect(dashboard.tracks[0]?.readiness).toMatchObject({
      percent: 100,
      stepUpTo: 'swe-2',
      stepUpAdds: 1,
    })
  })

  it('counts nothing from a topic that was never learned, since stepping up reaches none', () => {
    const dashboard = summariseDashboard(
      {
        ...finished,
        topics: [CLOSURES, topic('javascript/promises', [{ id: 'order', tier: 'swe-2' }])],
        // The unread topic has no SWE-1 question, so it is off the path and the
        // denominator does not move.
      },
      NOW,
    )

    expect(dashboard.tracks[0]?.readiness.stepUpAdds).toBe(1)
  })

  it('makes no offer while anything the tier covers is still climbing', () => {
    const dashboard = summariseDashboard(
      { ...finished, ladderSteps: new Map([[questionKey('javascript/closures', 'scope'), 2]]) },
      NOW,
    )

    expect(dashboard.tracks[0]?.readiness.stepUpTo).toBeNull()
  })
})

describe('the rest of the page', () => {
  it('counts every attempt, whatever tier its question is asked at', () => {
    const dashboard = summariseDashboard(
      input({
        topics: [CLOSURES],
        attempts: [
          { topicSlug: 'javascript/closures', questionId: 'x', result: 'passed', attemptedAt: NOW },
          { topicSlug: 'javascript/closures', questionId: 'y', result: 'weak', attemptedAt: NOW },
          { topicSlug: 'javascript/closures', questionId: 'z', result: 'failed', attemptedAt: NOW },
        ],
      }),
      NOW,
    )

    expect(dashboard.questions).toEqual({ attempted: 3, passed: 1, weak: 1, failed: 1 })
  })

  it('counts the exercises of every topic, on the path or not', () => {
    const dashboard = summariseDashboard(
      input({
        topics: [CLOSURES, topic('javascript/realms', [{ id: 'shape', tier: 'staff' }], 2)],
        exercises: [{ status: 'completed' }, { status: 'in_progress' }],
      }),
      NOW,
    )

    expect(dashboard.exercises).toEqual({ completed: 1, remaining: 1 })
  })

  it('names the weakest first, and no more than five of them', () => {
    const slipping = Array.from({ length: 7 }, (_, index) =>
      topic(`javascript/t${index}`, [{ id: 'q', tier: 'swe-1' }]),
    )

    const dashboard = summariseDashboard(
      input({
        topics: slipping,
        learnedAt: new Map(slipping.map((each) => [each.slug, NOW])),
        attempts: slipping.map((each, index) => ({
          topicSlug: each.slug,
          questionId: questionKey(each.slug, 'q'),
          // The last two passed, so they are not slipping at all.
          result: index < 5 ? 'failed' : 'passed',
          attemptedAt: NOW,
        })),
      }),
      NOW,
    )

    expect(dashboard.weakest).toHaveLength(5)
    expect(dashboard.weakest.every((row) => row.status === 'weak')).toBe(true)
  })

  it('derives the streak from the days rather than being told it', () => {
    const dashboard = summariseDashboard(
      input({
        activity: [
          { day: '2026-08-24', reviewed: 3, queueCleared: true },
          { day: '2026-08-25', reviewed: 2, queueCleared: true },
          { day: '2026-08-26', reviewed: 1, queueCleared: false },
        ],
      }),
      NOW,
    )

    expect(dashboard.streak).toEqual({ current: 3, longest: 3 })
  })
})
