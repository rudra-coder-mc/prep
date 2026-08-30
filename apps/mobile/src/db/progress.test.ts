import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from './migrate'
import { readAttemptsForTopics, readLearnedTopics, readTrackTiers } from './progress'
import { createTestDatabase } from '../../test-support/database'

/**
 * Reading the mirrored tables back out.
 *
 * The rows come back as the shapes @prep/core takes, dates included, because
 * that is the whole point of mirroring the server's tables rather than deriving
 * state: both sides hand the same functions the same values.
 */
let db: ReturnType<typeof createTestDatabase>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

async function attempt(
  id: string,
  topicSlug: string,
  questionId: string,
  at: string,
  result = 'passed',
) {
  await db.run(
    `insert into attempts (id, question_id, topic_slug, answer, result, confidence, hints_used, attempted_at)
     values (?, ?, ?, '', ?, 3, 0, ?)`,
    [id, questionId, topicSlug, result, at],
  )
}

describe('the tier picked per track', () => {
  it('is empty before anything is picked', async () => {
    expect(await readTrackTiers(db)).toEqual(new Map())
  })

  it('comes back keyed by technology', async () => {
    await db.run('insert into track_tier (technology, tier, updated_at) values (?, ?, ?)', [
      'javascript',
      'swe-2',
      '2026-08-01T00:00:00.000Z',
    ])

    expect(await readTrackTiers(db)).toEqual(new Map([['javascript', 'swe-2']]))
  })
})

describe('which topics are marked learned', () => {
  it('reads the mark back as a date', async () => {
    await db.run('insert into topic_progress (topic_slug, learned_at) values (?, ?)', [
      'javascript/closures',
      '2026-08-01T09:30:00.000Z',
    ])

    expect(await readLearnedTopics(db)).toEqual(
      new Map([['javascript/closures', new Date('2026-08-01T09:30:00.000Z')]]),
    )
  })

  /**
   * A topic gets a row the first time anything is recorded against it, and
   * being reviewed is not being learned. An unmarked row here would enrol a
   * topic nobody said they had read.
   */
  it('leaves out a topic that has a row but no mark', async () => {
    await db.run('insert into topic_progress (topic_slug, last_reviewed_at) values (?, ?)', [
      'javascript/closures',
      '2026-08-02T09:30:00.000Z',
    ])

    expect(await readLearnedTopics(db)).toEqual(new Map())
  })
})

describe('the attempts against a set of topics', () => {
  it('comes back grouped by topic, with dates rather than strings', async () => {
    await attempt('a1', 'javascript/closures', 'javascript/closures#q1', '2026-08-01T09:00:00.000Z')
    await attempt(
      'a2',
      'javascript/closures',
      'javascript/closures#q2',
      '2026-08-02T09:00:00.000Z',
      'failed',
    )
    await attempt('a3', 'javascript/scope', 'javascript/scope#q1', '2026-08-03T09:00:00.000Z')

    const byTopic = await readAttemptsForTopics(db, ['javascript/closures'])

    expect([...byTopic.keys()]).toEqual(['javascript/closures'])
    expect(byTopic.get('javascript/closures')).toEqual([
      {
        questionId: 'javascript/closures#q1',
        result: 'passed',
        attemptedAt: new Date('2026-08-01T09:00:00.000Z'),
      },
      {
        questionId: 'javascript/closures#q2',
        result: 'failed',
        attemptedAt: new Date('2026-08-02T09:00:00.000Z'),
      },
    ])
  })

  // The list is a whole track's worth of slugs, so an empty one has to mean
  // "nothing" rather than turning into a query with no filter.
  it('asks nothing of the database for an empty list', async () => {
    await attempt('a1', 'javascript/closures', 'javascript/closures#q1', '2026-08-01T09:00:00.000Z')

    expect(await readAttemptsForTopics(db, [])).toEqual(new Map())
  })
})
