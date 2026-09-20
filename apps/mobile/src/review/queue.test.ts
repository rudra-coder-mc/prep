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
    technology: 'javascript',
    directory: 'closures',
    questions: [
      archiveQuestion({ id: 'scope', tier: 'swe-1' }),
      archiveQuestion({ id: 'capture', tier: 'swe-1' }),
      archiveQuestion({ id: 'loops', tier: 'swe-1' }),
      archiveQuestion({ id: 'memory-leak', tier: 'swe-2' }),
    ],
  }),
  archiveTopic({
    technology: 'browser',
    directory: 'dom',
    questions: [
      archiveQuestion({ id: 'tree-walk', tier: 'swe-1' }),
      archiveQuestion({ id: 'reflow', tier: 'swe-2' }),
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

const scheduledBrowser = (id: string, dueAt: string): ScheduledQuestion => ({
  questionId: `browser/dom#${id}`,
  topicSlug: 'browser/dom',
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

  it('filters out questions exceeding the active tier for SWE-1 user', () => {
    const rows = [
      scheduled('scope', '2026-08-24T08:00:00.000Z'),
      scheduled('memory-leak', '2026-08-24T08:00:00.000Z'), // swe-2
    ]

    // With defaultTier: 'swe-1' and empty trackTiers
    const { items, dueToday } = buildReviewQueue(content, rows, NOW, 15, new Map(), 'swe-1')

    expect(items.map((item) => item.question.id)).toEqual(['scope'])
    expect(dueToday).toBe(1)
  })

  it('includes SWE-2 questions when track is explicitly set to SWE-2', () => {
    const rows = [
      scheduled('scope', '2026-08-24T08:00:00.000Z'),
      scheduled('memory-leak', '2026-08-24T08:00:00.000Z'), // swe-2
    ]

    const trackTiers = new Map([['javascript', 'swe-2' as const]])
    const { items, dueToday } = buildReviewQueue(content, rows, NOW, 15, trackTiers, 'swe-1')

    expect(items.map((item) => item.question.id).sort()).toEqual(['memory-leak', 'scope'])
    expect(dueToday).toBe(2)
  })

  it('enforces granular per-track tiers independently across tracks', () => {
    const rows = [
      scheduled('scope', '2026-08-24T08:00:00.000Z'), // javascript, swe-1
      scheduled('memory-leak', '2026-08-24T08:00:00.000Z'), // javascript, swe-2
      scheduledBrowser('tree-walk', '2026-08-24T08:00:00.000Z'), // browser, swe-1
      scheduledBrowser('reflow', '2026-08-24T08:00:00.000Z'), // browser, swe-2
    ]

    // javascript is swe-1, browser is swe-2
    const trackTiers = new Map([
      ['javascript', 'swe-1' as const],
      ['browser', 'swe-2' as const],
    ])

    const { items, dueToday } = buildReviewQueue(content, rows, NOW, 15, trackTiers, 'swe-1')

    // Should include: javascript/scope (swe-1), browser/tree-walk (swe-1), browser/reflow (swe-2)
    // Should NOT include: javascript/memory-leak (swe-2)
    expect(items.map((item) => item.question.id).sort()).toEqual(['reflow', 'scope', 'tree-walk'])
    expect(dueToday).toBe(3)
  })
})
