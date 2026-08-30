import { describe, expect, it } from 'vitest'
import type { ScheduledQuestion } from '@prep/core'
import { buildReviewQueue } from './queue'
import { archiveContent, archiveQuestion, archiveTopic } from '../../test-support/content'

/**
 * The day's queue, built from the archive and the ladder rows together.
 *
 * The ordering and the cap are @prep/core's `buildDailyQueue`, which the server
 * runs over the same rows, so what is tested here is only what this file
 * decides: which questions exist to be asked, and what the screen is handed.
 */
const NOW = new Date('2026-08-24T09:00:00.000Z')

const content = archiveContent([
  archiveTopic({
    questions: [
      archiveQuestion({ id: 'scope' }),
      archiveQuestion({ id: 'capture' }),
      archiveQuestion({ id: 'loops' }),
    ],
  }),
])

const scheduled = (id: string, dueAt: string): ScheduledQuestion => ({
  questionId: `javascript/closures#${id}`,
  topicSlug: 'javascript/closures',
  dueAt: new Date(dueAt),
  intervalStep: 0,
  lastResult: null,
})

describe('building the day', () => {
  it('is empty when nothing is enrolled', () => {
    expect(buildReviewQueue(content, [], NOW)).toEqual({ items: [], dueToday: 0, cap: 15 })
  })

  it('hands the screen the question in full, since the answer is on the device', () => {
    const { items } = buildReviewQueue(
      content,
      [scheduled('scope', '2026-08-24T08:00:00.000Z')],
      NOW,
    )

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      key: 'javascript/closures#scope',
      topicSlug: 'javascript/closures',
      topicTitle: 'Closures',
      reason: 'due',
    })
    expect(items[0]?.question.correctOption).toBe(0)
  })

  it('puts what is overdue before what is due today', () => {
    const { items } = buildReviewQueue(
      content,
      [
        scheduled('scope', '2026-08-24T08:00:00.000Z'),
        scheduled('capture', '2026-08-20T08:00:00.000Z'),
      ],
      NOW,
    )

    expect(items.map((item) => item.question.id)).toEqual(['capture', 'scope'])
    expect(items.map((item) => item.reason)).toEqual(['overdue', 'due'])
  })

  it('skips a question this device has no copy of', () => {
    const { items, dueToday } = buildReviewQueue(
      content,
      [
        scheduled('scope', '2026-08-24T08:00:00.000Z'),
        scheduled('withdrawn', '2026-08-24T08:00:00.000Z'),
      ],
      NOW,
    )

    expect(items.map((item) => item.question.id)).toEqual(['scope'])
    // Counted the same way, so the screen never promises a question it cannot
    // ask. An archive is replaced whole and can lag behind what was synced.
    expect(dueToday).toBe(1)
  })

  it('counts everything due today even when the cap holds some of it back', () => {
    const { items, dueToday } = buildReviewQueue(
      content,
      [
        scheduled('scope', '2026-08-24T08:00:00.000Z'),
        scheduled('capture', '2026-08-24T08:00:00.000Z'),
        scheduled('loops', '2026-08-24T08:00:00.000Z'),
      ],
      NOW,
      2,
    )

    expect(items).toHaveLength(2)
    expect(dueToday).toBe(3)
  })
})
